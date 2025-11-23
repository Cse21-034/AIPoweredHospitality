"""
Dynamic Pricing Model Training Pipeline
Trains models for revenue optimization and price recommendations
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_percentage_error, mean_absolute_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import optuna
from datetime import datetime
import json
import pickle
import os
import hashlib


class DynamicPricingPipeline:
    """Pipeline for dynamic pricing model training"""
    
    def __init__(self, config_path: str = None):
        """Initialize pipeline"""
        self.config = self._load_config(config_path)
        self.scaler = StandardScaler()
        self.feature_list = []
        self.model = None
        self.metadata = {}
    
    def _load_config(self, config_path: str = None) -> dict:
        """Load configuration"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        return {
            "model_type": "lightgbm",
            "hyperparameters": {
                "n_estimators": 300,
                "learning_rate": 0.05,
                "max_depth": 7,
                "num_leaves": 50,
            }
        }
    
    def load_data(self, csv_path: str) -> pd.DataFrame:
        """Load pricing data from CSV"""
        df = pd.read_csv(csv_path)
        df['decision_date'] = pd.to_datetime(df['decision_date'])
        return df.sort_values('decision_date').reset_index(drop=True)
    
    def feature_engineering(self, df: pd.DataFrame) -> tuple:
        """Create pricing features"""
        features = df.copy()
        
        # Price-related features
        features['price_gap'] = features['current_price'] - features['competitor_prices_avg']
        features['price_ratio'] = features['current_price'] / (features['competitor_prices_avg'] + 1e-6)
        features['competitor_undercut'] = (features['competitor_prices_avg'] < features['current_price']).astype(int)
        
        # Lagged price features
        for lag in [1, 7, 14]:
            features[f'price_lag_{lag}'] = features.groupby('room_type')['current_price'].shift(lag)
        
        # Occupancy-based features
        features['occupancy_high'] = (features['occupancy_rate'] > 0.8).astype(int)
        features['occupancy_low'] = (features['occupancy_rate'] < 0.4).astype(int)
        features['occupancy_change'] = features['occupancy_rate'].diff()
        
        # Lead time features
        features['short_lead_time'] = (features['lead_time_days'] < 7).astype(int)
        features['medium_lead_time'] = ((features['lead_time_days'] >= 7) & (features['lead_time_days'] < 30)).astype(int)
        features['long_lead_time'] = (features['lead_time_days'] >= 30).astype(int)
        
        # Calendar features
        features['day_of_week_sin'] = np.sin(2 * np.pi * features['weekday_flag'] / 7)
        features['day_of_week_cos'] = np.cos(2 * np.pi * features['weekday_flag'] / 7)
        features['is_special_occasion'] = features['special_offer_flag'].astype(int)
        
        # Rolling features
        for window in [7, 14]:
            features[f'price_rolling_mean_{window}'] = features.groupby('room_type')['current_price'].rolling(window=window, min_periods=1).mean().reset_index(0, drop=True)
            features[f'occupancy_rolling_mean_{window}'] = features.groupby('room_type')['occupancy_rate'].rolling(window=window, min_periods=1).mean().reset_index(0, drop=True)
        
        # Interaction features
        features['high_demand_low_comp'] = (features['occupancy_high'] & ~features['competitor_undercut']).astype(int)
        features['low_demand_high_comp'] = (features['occupancy_low'] & features['competitor_undercut']).astype(int)
        
        features = features.fillna(method='bfill').fillna(method='ffill')
        
        feature_cols = [col for col in features.columns if col not in [
            'decision_date', 'room_type', 'current_price', 'realized_price', 'realized_revenue', 'competitor_prices_avg'
        ]]
        
        return features, feature_cols
    
    def prepare_training_data(self, df: pd.DataFrame) -> tuple:
        """Prepare training data"""
        features_df, feature_cols = self.feature_engineering(df)
        self.feature_list = feature_cols
        
        features_df = features_df.dropna()
        
        # Target: optimal price derived from realized revenue
        # In practice, this would be computed from historical A/B tests or simulations
        X = features_df[feature_cols].values
        y = features_df['realized_price'].values
        
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.metadata['scaler_mean'] = self.scaler.mean_.tolist()
        self.metadata['scaler_scale'] = self.scaler.scale_.tolist()
        
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def train(self, df: pd.DataFrame):
        """Train pricing model"""
        print(f"[{datetime.now()}] Training Dynamic Pricing Model...")
        
        X_train, X_test, y_train, y_test = self.prepare_training_data(df)
        
        # Train model
        if self.config['model_type'] == 'xgboost':
            self.model = xgb.XGBRegressor(**self.config['hyperparameters'], random_state=42)
        else:
            self.model = lgb.LGBMRegressor(**self.config['hyperparameters'], random_state=42)
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        train_mape = mean_absolute_percentage_error(y_train, y_train_pred)
        test_mape = mean_absolute_percentage_error(y_test, y_test_pred)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        
        print(f"Train MAPE: {train_mape:.4f} | Test MAPE: {test_mape:.4f}")
        print(f"Test MAE: ${test_mae:.2f} | Test R²: {test_r2:.4f}")
        
        self.metadata['evaluation_metrics'] = {
            'train_mape': float(train_mape),
            'test_mape': float(test_mape),
            'test_mae': float(test_mae),
            'test_r2': float(test_r2),
        }
        
        feature_importance = self.model.feature_importances_
        self.metadata['feature_importance'] = dict(zip(self.feature_list, feature_importance.tolist()))
    
    def save_model(self, output_dir: str = './models', model_name: str = 'dynamic_pricing'):
        """Save model"""
        os.makedirs(output_dir, exist_ok=True)
        
        model_path = os.path.join(output_dir, f'{model_name}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        self.metadata['model_version'] = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.metadata['feature_schema'] = self.feature_list
        self.metadata['training_date'] = datetime.now().isoformat()
        
        metadata_path = os.path.join(output_dir, f'{model_name}_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        
        with open(model_path, 'rb') as f:
            model_hash = hashlib.sha256(f.read()).hexdigest()
        
        print(f"Model saved: {model_path} (hash: {model_hash})")
        return model_path, metadata_path, model_hash


if __name__ == '__main__':
    pipeline = DynamicPricingPipeline()
    
    # Synthetic data for demo
    dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
    synthetic_data = pd.DataFrame({
        'decision_date': dates,
        'room_type': np.random.choice(['Deluxe', 'Standard'], len(dates)),
        'current_price': np.random.uniform(80, 300, len(dates)),
        'competitor_prices_avg': np.random.uniform(75, 280, len(dates)),
        'occupancy_rate': np.random.uniform(0.3, 0.95, len(dates)),
        'lead_time_days': np.random.randint(1, 90, len(dates)),
        'booking_window': np.random.choice([7, 30], len(dates)),
        'weekday_flag': np.random.choice([0, 1], len(dates)),
        'special_offer_flag': np.random.choice([0, 1], len(dates), p=[0.9, 0.1]),
        'realized_price': np.random.uniform(80, 300, len(dates)),
        'realized_revenue': np.random.uniform(800, 3000, len(dates)),
    })
    
    pipeline.train(synthetic_data)
    pipeline.save_model()
