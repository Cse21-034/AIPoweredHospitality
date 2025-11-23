"""
Demand Forecasting Model Training Pipeline
Trains XGBoost/LightGBM models for occupancy and nights sold forecasting
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_percentage_error, mean_absolute_error, mean_squared_error
import xgboost as xgb
import lightgbm as lgb
import optuna
from optuna.samplers import TPESampler
import json
import pickle
import os
from pathlib import Path
from datetime import datetime, timedelta
import hashlib
import onnx
import skl2onnx
from skl2onnx.common.data_types import FloatTensorType


class DemandForecastingPipeline:
    """Complete pipeline for demand forecasting model development"""
    
    def __init__(self, config_path: str = None):
        """Initialize pipeline with optional config file"""
        self.config = self._load_config(config_path)
        self.scaler = StandardScaler()
        self.feature_list = []
        self.model = None
        self.metadata = {}
        
    def _load_config(self, config_path: str = None) -> dict:
        """Load configuration from JSON or return defaults"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        return {
            "model_type": "xgboost",  # or "lightgbm"
            "prediction_horizon": 7,  # days
            "train_test_split": 0.8,
            "cv_folds": 5,
            "hyperparameters": {
                "n_estimators": 300,
                "learning_rate": 0.05,
                "max_depth": 6,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
            }
        }
    
    def load_data(self, csv_path: str) -> pd.DataFrame:
        """Load demand forecasting data from CSV"""
        df = pd.read_csv(csv_path)
        df['forecast_date'] = pd.to_datetime(df['forecast_date'])
        return df.sort_values('forecast_date').reset_index(drop=True)
    
    def feature_engineering(self, df: pd.DataFrame) -> tuple[pd.DataFrame, list]:
        """
        Create features for demand forecasting
        Returns: (feature_df, feature_names)
        """
        features = df.copy()
        
        # Lag features (1, 7, 14, 30 days)
        for col in ['nights_sold', 'bookings_count', 'occupancy_rate']:
            for lag in [1, 7, 14, 30]:
                features[f'{col}_lag_{lag}'] = features.groupby('room_type')[col].shift(lag)
        
        # Rolling statistics (7, 30 days)
        for col in ['nights_sold', 'occupancy_rate']:
            for window in [7, 30]:
                features[f'{col}_rolling_mean_{window}'] = features.groupby('room_type')[col].rolling(window=window, min_periods=1).mean().reset_index(0, drop=True)
                features[f'{col}_rolling_std_{window}'] = features.groupby('room_type')[col].rolling(window=window, min_periods=1).std().reset_index(0, drop=True)
        
        # Calendar features
        features['day_of_week'] = features['forecast_date'].dt.dayofweek
        features['month'] = features['forecast_date'].dt.month
        features['quarter'] = features['forecast_date'].dt.quarter
        features['day_of_month'] = features['forecast_date'].dt.day
        features['day_of_year'] = features['forecast_date'].dt.dayofyear
        
        # Cyclical encoding for cyclical features
        features['day_of_week_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
        features['day_of_week_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
        features['month_sin'] = np.sin(2 * np.pi * features['month'] / 12)
        features['month_cos'] = np.cos(2 * np.pi * features['month'] / 12)
        
        # Business logic features
        features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
        features['is_holiday'] = features['holiday_flag'].astype(int)
        features['is_promotion'] = features['promotion_active'].astype(int)
        
        # Price features
        features['avg_rate_lag_7'] = features.groupby('room_type')['avg_rate'].shift(7)
        features['price_momentum'] = features['avg_rate'] - features['avg_rate_lag_7']
        
        # OTA channel mix features
        if 'channel_mix' in features.columns:
            # Assuming channel_mix is JSON string
            for col in features['channel_mix']:
                features[f'channel_{col}'] = features['channel_mix'].apply(lambda x: x.get(col, 0) if x else 0)
        
        # Fill NaN values from lag/rolling operations
        features = features.fillna(method='bfill').fillna(method='ffill')
        
        # Select final features for model
        feature_cols = [col for col in features.columns if col not in ['forecast_date', 'room_type', 'channel_mix', 'events_local']]
        
        return features, feature_cols
    
    def prepare_training_data(self, df: pd.DataFrame, target_col: str = 'nights_sold') -> tuple:
        """
        Prepare training data with proper time-series split
        Returns: (X_train, X_test, y_train, y_test, feature_list)
        """
        features_df, feature_cols = self.feature_engineering(df)
        self.feature_list = feature_cols
        
        # Remove rows with NaN values (result of lag features)
        features_df = features_df.dropna()
        
        # Prepare X and y
        X = features_df[feature_cols].values
        y = features_df[target_col].values
        
        # Time-series split (no shuffling!)
        split_idx = int(len(X) * self.config['train_test_split'])
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Standardize features using training data only
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Store scaler params for inference
        self.metadata['scaler_mean'] = self.scaler.mean_.tolist()
        self.metadata['scaler_scale'] = self.scaler.scale_.tolist()
        
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def objective(self, trial: optuna.Trial, X_train, X_test, y_train, y_test):
        """Optuna objective function for hyperparameter tuning"""
        
        if self.config['model_type'] == 'xgboost':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 500),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'min_child_weight': trial.suggest_int('min_child_weight', 1, 5),
            }
            model = xgb.XGBRegressor(**params, random_state=42)
        else:  # lightgbm
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 500),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'num_leaves': trial.suggest_int('num_leaves', 20, 100),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            }
            model = lgb.LGBMRegressor(**params, random_state=42)
        
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        mape = mean_absolute_percentage_error(y_test, y_pred)
        return mape
    
    def train(self, df: pd.DataFrame, target_col: str = 'nights_sold', tune_hyperparams: bool = True):
        """Train demand forecasting model"""
        print(f"[{datetime.now()}] Starting training pipeline...")
        
        X_train, X_test, y_train, y_test = self.prepare_training_data(df, target_col)
        print(f"Training set size: {X_train.shape[0]}, Test set size: {X_test.shape[0]}")
        
        # Hyperparameter tuning
        if tune_hyperparams:
            print(f"[{datetime.now()}] Starting hyperparameter tuning with Optuna...")
            sampler = TPESampler(seed=42)
            study = optuna.create_study(sampler=sampler, direction='minimize')
            study.optimize(lambda trial: self.objective(trial, X_train, X_test, y_train, y_test), n_trials=20)
            best_params = study.best_params
            print(f"Best MAPE: {study.best_value:.4f}")
            print(f"Best params: {best_params}")
        else:
            best_params = self.config['hyperparameters']
        
        # Train final model with best params
        print(f"[{datetime.now()}] Training final model...")
        if self.config['model_type'] == 'xgboost':
            self.model = xgb.XGBRegressor(**best_params, random_state=42)
        else:
            self.model = lgb.LGBMRegressor(**best_params, random_state=42)
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        train_mape = mean_absolute_percentage_error(y_train, y_train_pred)
        test_mape = mean_absolute_percentage_error(y_test, y_test_pred)
        train_mae = mean_absolute_error(y_train, y_train_pred)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        
        print(f"\n{'='*50}")
        print(f"Training Results:")
        print(f"Train MAPE: {train_mape:.4f} | Test MAPE: {test_mape:.4f}")
        print(f"Train MAE: {train_mae:.2f} | Test MAE: {test_mae:.2f}")
        print(f"Train RMSE: {train_rmse:.2f} | Test RMSE: {test_rmse:.2f}")
        print(f"{'='*50}\n")
        
        # Store metrics
        self.metadata['evaluation_metrics'] = {
            'train_mape': float(train_mape),
            'test_mape': float(test_mape),
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
        }
        
        # Feature importance
        feature_importance = self.model.feature_importances_
        importance_dict = dict(zip(self.feature_list, feature_importance.tolist()))
        self.metadata['feature_importance'] = importance_dict
        
        return self.model
    
    def save_model(self, output_dir: str = './models', model_name: str = 'demand_forecast'):
        """Save model and metadata"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(output_dir, f'{model_name}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save metadata
        self.metadata['model_version'] = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.metadata['feature_schema'] = self.feature_list
        self.metadata['model_type'] = self.config['model_type']
        self.metadata['training_date'] = datetime.now().isoformat()
        
        metadata_path = os.path.join(output_dir, f'{model_name}_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        
        # Compute model hash
        with open(model_path, 'rb') as f:
            model_hash = hashlib.sha256(f.read()).hexdigest()
        
        print(f"Model saved to {model_path}")
        print(f"Model hash: {model_hash}")
        print(f"Metadata saved to {metadata_path}")
        
        return model_path, metadata_path, model_hash
    
    def export_onnx(self, output_dir: str = './models', model_name: str = 'demand_forecast'):
        """Export model to ONNX format for cross-platform inference"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Create a simple wrapper that handles the conversion
        # ONNX export requires sklearn-compatible models
        if self.config['model_type'] == 'xgboost':
            # XGBoost has native ONNX support via onnxmltools
            try:
                import onnxmltools
                onnx_model = onnxmltools.convert_xgboost(self.model)
            except ImportError:
                print("Warning: onnxmltools not installed. Using sklearn wrapper.")
                return None
        
        onnx_path = os.path.join(output_dir, f'{model_name}.onnx')
        with open(onnx_path, 'wb') as f:
            f.write(onnx_model.SerializeToString())
        
        print(f"ONNX model exported to {onnx_path}")
        return onnx_path
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions using trained model"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)


if __name__ == '__main__':
    # Example usage
    print("Demand Forecasting Model Training Pipeline")
    print("=" * 50)
    
    # Create pipeline
    pipeline = DemandForecastingPipeline()
    
    # Load sample data (replace with actual data source)
    # df = pipeline.load_data('demand_data.csv')
    
    # For demo, create synthetic data
    dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
    synthetic_data = pd.DataFrame({
        'forecast_date': dates,
        'room_type': np.random.choice(['Deluxe', 'Standard', 'Suite'], len(dates)),
        'bookings_count': np.random.randint(5, 30, len(dates)),
        'checkins_count': np.random.randint(3, 28, len(dates)),
        'nights_sold': np.random.randint(10, 60, len(dates)),
        'available_rooms': np.random.randint(15, 25, len(dates)),
        'avg_rate': np.random.uniform(80, 250, len(dates)),
        'occupancy_rate': np.random.uniform(0.3, 0.95, len(dates)),
        'weather_avg_temp_c': np.random.uniform(10, 35, len(dates)),
        'holiday_flag': np.random.choice([0, 1], len(dates), p=[0.9, 0.1]),
        'promotion_active': np.random.choice([0, 1], len(dates), p=[0.85, 0.15]),
    })
    
    # Train model
    pipeline.train(synthetic_data, target_col='nights_sold', tune_hyperparams=True)
    
    # Save model
    model_path, metadata_path, model_hash = pipeline.save_model()
    
    print(f"\nModel successfully trained and saved!")
    print(f"Model Hash: {model_hash}")
