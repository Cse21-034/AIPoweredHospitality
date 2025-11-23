"""
Fraud Detection & Anomaly Detection Pipeline
Detects fraudulent transactions and abnormal booking patterns
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score, confusion_matrix
import xgboost as xgb
from datetime import datetime
import json
import pickle
import os
import hashlib


class FraudDetectionPipeline:
    """Pipeline for fraud detection using ensemble methods"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.isolation_forest = None
        self.supervised_model = None
        self.feature_list = []
        self.metadata = {}
    
    def load_data(self, csv_path: str) -> pd.DataFrame:
        """Load transaction data"""
        df = pd.read_csv(csv_path)
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        return df.sort_values('transaction_date').reset_index(drop=True)
    
    def feature_engineering(self, df: pd.DataFrame) -> tuple:
        """Create fraud detection features"""
        features = df.copy()
        
        # Basic transaction features
        features['transaction_hour'] = features['transaction_date'].dt.hour
        features['transaction_day'] = features['transaction_date'].dt.dayofweek
        features['amount_log'] = np.log1p(features['amount'])
        
        # Velocity features (risky if many transactions in short time)
        features['guest_txn_count_24h'] = features.groupby('guest_id')['transaction_date'].rolling('24H').count().reset_index(0, drop=True).astype(int)
        features['guest_txn_count_7d'] = features.groupby('guest_id')['transaction_date'].rolling('7D').count().reset_index(0, drop=True).astype(int)
        
        # IP-based features
        features['ip_txn_count_1h'] = features.groupby('ip_address')['transaction_date'].rolling('1H').count().reset_index(0, drop=True).astype(int)
        features['ip_txn_count_24h'] = features.groupby('ip_address')['transaction_date'].rolling('24H').count().reset_index(0, drop=True).astype(int)
        
        # Geographic mismatch
        features['geo_mismatch'] = (features['ip_country'] != features['booking_ip_country']).astype(int)
        
        # Amount deviation from historical
        features['guest_avg_amount'] = features.groupby('guest_id')['amount'].transform('mean')
        features['amount_deviation'] = np.abs(features['amount'] - features['guest_avg_amount']) / (features['guest_avg_amount'] + 1e-6)
        
        # Card features
        features['card_age_days'] = (datetime.now() - pd.to_datetime(features['card_bin'])).dt.days
        features['card_age_days'] = features['card_age_days'].clip(lower=0)
        
        # Channel-specific features
        features['unusual_channel'] = features.groupby('guest_id')['booking_channel'].transform(lambda x: (x != x.mode()[0] if len(x.mode()) > 0 else False)).astype(int)
        
        # Time-based risk
        features['is_high_risk_hour'] = features['transaction_hour'].isin([0, 1, 2, 3, 4, 5]).astype(int)  # Late night
        features['is_weekend_txn'] = (features['transaction_day'] >= 5).astype(int)
        
        # Flag features
        features['flagged_discrepancy_count'] = features['flagged_discrepancies'].apply(lambda x: len(x) if x else 0)
        
        feature_cols = [col for col in features.columns if col not in [
            'transaction_date', 'guest_id', 'reservation_id', 'transaction_id', 
            'ip_address', 'booking_ip_country', 'ip_country', 'card_bin', 
            'amount', 'currency', 'flagged_discrepancies'
        ]]
        
        return features.fillna(0), feature_cols
    
    def prepare_training_data(self, df: pd.DataFrame) -> tuple:
        """Prepare training data"""
        features_df, feature_cols = self.feature_engineering(df)
        self.feature_list = feature_cols
        
        X = features_df[feature_cols].values
        
        # Use unsupervised approach if no fraud labels exist, otherwise supervised
        if 'is_fraud' in df.columns:
            y = df['is_fraud'].values
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            return X_train_scaled, X_test_scaled, y_train, y_test, True
        else:
            X_scaled = self.scaler.fit_transform(X)
            return X_scaled, None, None, None, False
    
    def train_supervised(self, X_train, X_test, y_train, y_test):
        """Train supervised fraud classifier"""
        print(f"[{datetime.now()}] Training supervised fraud model...")
        
        # Handle imbalanced data
        fraud_ratio = np.sum(y_train) / len(y_train)
        scale_pos_weight = (1 - fraud_ratio) / (fraud_ratio + 1e-6)
        
        self.supervised_model = xgb.XGBClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=7,
            scale_pos_weight=scale_pos_weight,
            random_state=42
        )
        
        self.supervised_model.fit(X_train, y_train)
        
        y_pred = self.supervised_model.predict(X_test)
        y_pred_proba = self.supervised_model.predict_proba(X_test)[:, 1]
        
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        print(f"Precision: {precision:.4f} | Recall: {recall:.4f} | F1: {f1:.4f}")
        print(f"ROC-AUC: {roc_auc:.4f}")
        
        self.metadata['supervised_metrics'] = {
            'precision': float(precision),
            'recall': float(recall),
            'f1': float(f1),
            'roc_auc': float(roc_auc),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp),
        }
    
    def train_unsupervised(self, X_scaled):
        """Train unsupervised anomaly detection"""
        print(f"[{datetime.now()}] Training unsupervised anomaly detector...")
        
        self.isolation_forest = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_jobs=-1
        )
        
        self.isolation_forest.fit(X_scaled)
        anomaly_scores = -self.isolation_forest.score_samples(X_scaled)
        
        self.metadata['unsupervised_metrics'] = {
            'anomaly_threshold': float(np.percentile(anomaly_scores, 95)),
            'mean_anomaly_score': float(np.mean(anomaly_scores)),
        }
        
        print(f"Anomaly detection model trained")
    
    def train(self, df: pd.DataFrame):
        """Train fraud detection pipeline"""
        X_train, X_test, y_train, y_test, has_labels = self.prepare_training_data(df)
        
        if has_labels:
            self.train_supervised(X_train, X_test, y_train, y_test)
            self.train_unsupervised(X_train)  # Also train unsupervised for new patterns
        else:
            self.train_unsupervised(X_train)
    
    def save_model(self, output_dir: str = './models', model_name: str = 'fraud_detection'):
        """Save fraud detection model"""
        os.makedirs(output_dir, exist_ok=True)
        
        model_data = {
            'supervised_model': self.supervised_model,
            'isolation_forest': self.isolation_forest,
            'scaler': self.scaler,
        }
        
        model_path = os.path.join(output_dir, f'{model_name}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        self.metadata['model_version'] = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.metadata['feature_schema'] = self.feature_list
        self.metadata['training_date'] = datetime.now().isoformat()
        
        metadata_path = os.path.join(output_dir, f'{model_name}_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        
        with open(model_path, 'rb') as f:
            model_hash = hashlib.sha256(f.read()).hexdigest()
        
        print(f"Fraud detection model saved: {model_path}")
        return model_path, metadata_path, model_hash


class GuestChurnPredictionPipeline:
    """Pipeline for predicting guest churn likelihood"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = None
        self.feature_list = []
        self.metadata = {}
    
    def feature_engineering(self, df: pd.DataFrame) -> tuple:
        """Create churn prediction features"""
        features = df.copy()
        
        # Engagement features
        features['stay_length'] = features['length_of_stay_days']
        features['spend_per_night'] = features['spend_total'] / (features['stay_length'] + 1)
        features['purchase_variety'] = features['purchases_json'].apply(lambda x: len(x) if x else 0)
        
        # Historical features
        features['is_repeat'] = features['is_repeat_guest'].astype(int)
        features['nps_proxy'] = features['feedback_score'] / 10.0
        
        # Channel-based features (direct = more loyal typically)
        features['is_direct_booking'] = (features['channel'] == 'direct').astype(int)
        
        # Satisfaction features
        features['satisfied'] = (features['feedback_score'] >= 8).astype(int)
        features['dissatisfied'] = (features['feedback_score'] <= 5).astype(int)
        
        feature_cols = [col for col in features.columns if col not in [
            'guest_id', 'reservation_id', 'property_id', 'purchases_json', 'preferences'
        ]]
        
        return features.fillna(0), feature_cols
    
    def train(self, df: pd.DataFrame):
        """Train churn prediction model"""
        features_df, feature_cols = self.feature_engineering(df)
        self.feature_list = feature_cols
        
        X = features_df[feature_cols].values
        
        # Target: whether guest churned (didn't return within 12 months)
        # In production, this would be derived from historical data
        y = (features_df['feedback_score'] <= 5).astype(int)  # Proxy: low satisfaction = likely churn
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Handle class imbalance
        churn_ratio = np.sum(y_train) / len(y_train)
        scale_pos_weight = (1 - churn_ratio) / (churn_ratio + 1e-6)
        
        self.model = xgb.XGBClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            scale_pos_weight=scale_pos_weight,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        y_pred = self.model.predict(X_test_scaled)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
        
        print(f"Churn Model - Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")
        
        self.metadata['evaluation_metrics'] = {
            'precision': float(precision),
            'recall': float(recall),
            'f1': float(f1),
        }
    
    def save_model(self, output_dir: str = './models', model_name: str = 'guest_churn'):
        """Save churn model"""
        os.makedirs(output_dir, exist_ok=True)
        
        model_path = os.path.join(output_dir, f'{model_name}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump({'model': self.model, 'scaler': self.scaler}, f)
        
        self.metadata['model_version'] = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.metadata['feature_schema'] = self.feature_list
        self.metadata['training_date'] = datetime.now().isoformat()
        
        metadata_path = os.path.join(output_dir, f'{model_name}_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        
        with open(model_path, 'rb') as f:
            model_hash = hashlib.sha256(f.read()).hexdigest()
        
        print(f"Churn prediction model saved: {model_path}")
        return model_path, metadata_path, model_hash


if __name__ == '__main__':
    # Demo fraud detection
    print("Fraud Detection & Churn Prediction Pipelines")
    
    # Create synthetic transaction data
    n_samples = 10000
    fraud_data = pd.DataFrame({
        'transaction_id': range(n_samples),
        'guest_id': np.random.choice([f'guest_{i}' for i in range(100)], n_samples),
        'reservation_id': np.random.choice([f'res_{i}' for i in range(500)], n_samples),
        'amount': np.random.exponential(150, n_samples),
        'currency': ['USD'] * n_samples,
        'payment_method': np.random.choice(['card', 'cash'], n_samples),
        'card_bin': np.random.randint(400000, 700000, n_samples),
        'ip_address': np.random.choice([f'192.168.{i}.{j}' for i in range(256) for j in range(5)], n_samples),
        'ip_country': np.random.choice(['US', 'UK', 'DE', 'FR', 'ES'], n_samples),
        'booking_ip_country': np.random.choice(['US', 'UK', 'DE', 'FR', 'ES'], n_samples),
        'booking_channel': np.random.choice(['direct', 'booking.com', 'expedia'], n_samples),
        'device_id': np.random.choice([f'device_{i}' for i in range(50)], n_samples),
        'transaction_date': pd.date_range('2023-01-01', periods=n_samples, freq='H'),
        'flagged_discrepancies': [None] * n_samples,
        'is_fraud': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),
    })
    
    fraud_pipeline = FraudDetectionPipeline()
    fraud_pipeline.train(fraud_data)
    fraud_pipeline.save_model()
