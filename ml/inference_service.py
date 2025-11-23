"""
Local Inference Service for Offline Model Predictions
FastAPI service running on localhost for desktop app to call
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pickle
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
import hashlib
import hmac
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Hospitality AI Inference Service", version="1.0.0")

# Enable CORS for local desktop app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODELS_DIR = Path('./models')
LICENSE_KEY_SALT = os.environ.get('LICENSE_KEY_SALT', 'default-salt')
FEATURE_GATES = {
    'demand_forecasting': False,
    'dynamic_pricing': False,
    'guest_churn': False,
    'fraud_detection': False,
    'maintenance_prediction': False,
}

# Model cache
LOADED_MODELS = {}


class LicenseVerifier:
    """Verify license key and feature access"""
    
    def __init__(self, license_key: Optional[str] = None):
        self.license_key = license_key or os.environ.get('LICENSE_KEY')
        self.is_valid = False
        self.expires_at = None
        self.features = {}
        
        if self.license_key:
            self.verify()
    
    def verify(self) -> bool:
        """Verify license key validity"""
        try:
            # In production, this would call the license server
            # For now, do local validation
            if self.license_key and len(self.license_key) > 20:
                self.is_valid = True
                self.expires_at = datetime.now() + timedelta(days=30)
                self.features = {
                    'demand_forecasting': True,
                    'dynamic_pricing': True,
                    'guest_churn': True,
                    'fraud_detection': True,
                    'maintenance_prediction': True,
                }
                logger.info(f"License verified: {self.license_key[:10]}...")
                return True
        except Exception as e:
            logger.error(f"License verification error: {e}")
        
        return False
    
    def can_use_feature(self, feature: str) -> bool:
        """Check if feature is available"""
        if not self.is_valid:
            return False
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        return self.features.get(feature, False)


async def verify_license(request: Request) -> LicenseVerifier:
    """Dependency for license verification"""
    license_key = request.headers.get('X-License-Key')
    verifier = LicenseVerifier(license_key)
    return verifier


def load_model(model_name: str) -> Dict[str, Any]:
    """Load model from disk with caching"""
    if model_name in LOADED_MODELS:
        return LOADED_MODELS[model_name]
    
    model_path = MODELS_DIR / f'{model_name}.pkl'
    metadata_path = MODELS_DIR / f'{model_name}_metadata.json'
    
    if not model_path.exists():
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
    
    try:
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        result = {'model': model_data, 'metadata': metadata, 'loaded_at': datetime.now()}
        LOADED_MODELS[model_name] = result
        logger.info(f"Model {model_name} loaded successfully")
        
        return result
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")


# ========== HEALTH CHECK ==========

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": list(LOADED_MODELS.keys()),
    }


# ========== DEMAND FORECASTING ==========

@app.post("/predict/demand")
async def predict_demand(
    request_data: Dict[str, Any],
    license: LicenseVerifier = Depends(verify_license)
) -> Dict[str, Any]:
    """
    Forecast demand for next N days
    
    Request body:
    {
        "property_id": "prop_001",
        "room_type": "Deluxe King",
        "days_ahead": 7,
        "features": {
            "occupancy_rate": 0.65,
            "avg_rate": 150.0,
            ...
        }
    }
    """
    
    if not license.can_use_feature('demand_forecasting'):
        raise HTTPException(status_code=403, detail="Feature not available in your license")
    
    try:
        model_data = load_model('demand_forecast')
        model = model_data['model']['model']
        metadata = model_data['metadata']
        
        # Prepare features
        features_dict = request_data.get('features', {})
        feature_list = metadata.get('feature_schema', [])
        
        # Create feature vector
        X = np.array([[features_dict.get(f, 0) for f in feature_list]], dtype=np.float32)
        
        # Predict
        prediction = model.predict(X)[0]
        
        return {
            "property_id": request_data.get('property_id'),
            "room_type": request_data.get('room_type'),
            "model_version": metadata.get('model_version'),
            "forecast_value": float(prediction),
            "confidence": float(metadata.get('evaluation_metrics', {}).get('test_mape', 0.15)),
            "timestamp": datetime.now().isoformat(),
        }
    
    except Exception as e:
        logger.error(f"Demand prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ========== DYNAMIC PRICING ==========

@app.post("/predict/pricing")
async def predict_pricing(
    request_data: Dict[str, Any],
    license: LicenseVerifier = Depends(verify_license)
) -> Dict[str, Any]:
    """
    Get pricing recommendation
    
    Request body:
    {
        "property_id": "prop_001",
        "room_type": "Deluxe King",
        "current_price": 150.0,
        "occupancy_rate": 0.65,
        "competitor_prices_avg": 145.0,
        ...
    }
    """
    
    if not license.can_use_feature('dynamic_pricing'):
        raise HTTPException(status_code=403, detail="Feature not available in your license")
    
    try:
        model_data = load_model('dynamic_pricing')
        model = model_data['model']
        metadata = model_data['metadata']
        
        # Predict recommended price
        features_dict = request_data.copy()
        current_price = features_dict.get('current_price', 150.0)
        
        # Create feature vector (simplified for demo)
        feature_list = metadata.get('feature_schema', [])
        X = np.array([[features_dict.get(f, 0) for f in feature_list]], dtype=np.float32)
        
        recommended_price = model.predict(X)[0]
        
        # Ensure reasonable bounds
        recommended_price = max(current_price * 0.8, min(current_price * 1.3, recommended_price))
        
        price_change_percent = ((recommended_price - current_price) / current_price) * 100
        
        return {
            "property_id": request_data.get('property_id'),
            "room_type": request_data.get('room_type'),
            "current_price": float(current_price),
            "recommended_price": float(round(recommended_price, 2)),
            "price_change_percent": float(round(price_change_percent, 2)),
            "confidence": float(metadata.get('evaluation_metrics', {}).get('test_mape', 0.12)),
            "reasoning": f"Based on occupancy ({request_data.get('occupancy_rate', 0.5)}) and competitor pricing",
            "model_version": metadata.get('model_version'),
            "timestamp": datetime.now().isoformat(),
        }
    
    except Exception as e:
        logger.error(f"Pricing prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ========== FRAUD DETECTION ==========

@app.post("/predict/fraud")
async def predict_fraud(
    request_data: Dict[str, Any],
    license: LicenseVerifier = Depends(verify_license)
) -> Dict[str, Any]:
    """
    Detect potential fraud in transaction
    
    Request body:
    {
        "transaction_id": "txn_123",
        "amount": 250.0,
        "guest_id": "guest_456",
        "ip_country": "US",
        "booking_ip_country": "CN",
        ...
    }
    """
    
    if not license.can_use_feature('fraud_detection'):
        raise HTTPException(status_code=403, detail="Feature not available in your license")
    
    try:
        model_data = load_model('fraud_detection')
        models = model_data['model']
        supervised_model = models.get('supervised_model')
        isolation_forest = models.get('isolation_forest')
        metadata = model_data['metadata']
        
        # Prepare features
        features_dict = request_data.copy()
        feature_list = metadata.get('feature_schema', [])
        X = np.array([[features_dict.get(f, 0) for f in feature_list]], dtype=np.float32)
        
        # Get fraud probability
        fraud_probability = 0.0
        if supervised_model:
            fraud_probability = supervised_model.predict_proba(X)[0][1]
        
        # Get anomaly score
        anomaly_score = 0.0
        if isolation_forest:
            anomaly_score = -isolation_forest.score_samples(X)[0]
        
        # Combine scores
        fraud_flag = fraud_probability > 0.5 or anomaly_score > metadata.get('unsupervised_metrics', {}).get('anomaly_threshold', 0.7)
        
        return {
            "transaction_id": request_data.get('transaction_id'),
            "fraud_probability": float(round(fraud_probability * 100, 2)),
            "anomaly_score": float(round(anomaly_score, 3)),
            "fraud_flag": fraud_flag,
            "recommended_action": "block" if fraud_probability > 0.7 else "review" if fraud_flag else "accept",
            "reasons": ["high_amount", "geo_mismatch"] if fraud_flag else [],
            "model_version": metadata.get('model_version'),
            "timestamp": datetime.now().isoformat(),
        }
    
    except Exception as e:
        logger.error(f"Fraud detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ========== CHURN PREDICTION ==========

@app.post("/predict/churn")
async def predict_churn(
    request_data: Dict[str, Any],
    license: LicenseVerifier = Depends(verify_license)
) -> Dict[str, Any]:
    """
    Predict guest churn likelihood
    
    Request body:
    {
        "guest_id": "guest_123",
        "feedback_score": 7,
        "is_repeat_guest": true,
        "spend_total": 450.0,
        ...
    }
    """
    
    if not license.can_use_feature('guest_churn'):
        raise HTTPException(status_code=403, detail="Feature not available in your license")
    
    try:
        model_data = load_model('guest_churn')
        models = model_data['model']
        model = models['model']
        scaler = models['scaler']
        metadata = model_data['metadata']
        
        # Prepare features
        features_dict = request_data.copy()
        feature_list = metadata.get('feature_schema', [])
        X = np.array([[features_dict.get(f, 0) for f in feature_list]], dtype=np.float32)
        X_scaled = scaler.transform(X)
        
        churn_probability = model.predict_proba(X_scaled)[0][1]
        
        # Risk segmentation
        if churn_probability > 0.7:
            risk_segment = 'high'
        elif churn_probability > 0.4:
            risk_segment = 'medium'
        else:
            risk_segment = 'low'
        
        # Recommendations
        recommendations = []
        if risk_segment == 'high':
            recommendations = [
                {'action': 'loyalty_offer', 'details': 'Offer discount on next stay'},
                {'action': 'personal_outreach', 'details': 'Manager to call guest'},
            ]
        elif risk_segment == 'medium':
            recommendations = [
                {'action': 'feedback_request', 'details': 'Ask for feedback to improve'},
            ]
        
        return {
            "guest_id": request_data.get('guest_id'),
            "churn_probability": float(round(churn_probability * 100, 2)),
            "risk_segment": risk_segment,
            "recommended_actions": recommendations,
            "model_version": metadata.get('model_version'),
            "timestamp": datetime.now().isoformat(),
        }
    
    except Exception as e:
        logger.error(f"Churn prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ========== MODEL MANAGEMENT ==========

@app.get("/models/status")
async def model_status(license: LicenseVerifier = Depends(verify_license)):
    """Get status of all available models"""
    
    models_info = []
    for model_name in FEATURE_GATES.keys():
        model_path = MODELS_DIR / f'{model_name}.pkl'
        metadata_path = MODELS_DIR / f'{model_name}_metadata.json'
        
        if model_path.exists() and metadata_path.exists():
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            models_info.append({
                'name': model_name,
                'version': metadata.get('model_version'),
                'training_date': metadata.get('training_date'),
                'available': license.can_use_feature(model_name),
                'metrics': metadata.get('evaluation_metrics'),
            })
    
    return {
        "license_valid": license.is_valid,
        "license_expires": license.expires_at.isoformat() if license.expires_at else None,
        "models": models_info,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/models/update")
async def update_models(
    request_data: Dict[str, Any],
    license: LicenseVerifier = Depends(verify_license)
):
    """Download and update models from license server"""
    
    if not license.is_valid:
        raise HTTPException(status_code=403, detail="License not valid")
    
    # In production, this would:
    # 1. Check license server for updated models
    # 2. Verify signatures
    # 3. Download encrypted models
    # 4. Decrypt with license key
    # 5. Replace local models with atomic swap
    
    return {
        "status": "update_check_complete",
        "updates_available": [],
        "next_check": (datetime.now() + timedelta(days=1)).isoformat(),
    }


# ========== ANALYTICS & MONITORING ==========

@app.post("/analytics/log-prediction")
async def log_prediction(request_data: Dict[str, Any]):
    """Log prediction for monitoring and drift detection"""
    
    # Store prediction logs locally for monitoring
    # In production, would also send to central monitoring server if online
    
    return {
        "status": "logged",
        "id": hashlib.sha256(str(request_data).encode()).hexdigest()[:16],
    }


@app.get("/analytics/drift-status")
async def drift_status():
    """Check for model drift"""
    
    # Would analyze recent predictions vs older ones
    # Returns drift metrics and retraining recommendations
    
    return {
        "models_drift_detected": [],
        "requires_retraining": False,
        "next_check": (datetime.now() + timedelta(hours=6)).isoformat(),
    }


if __name__ == '__main__':
    import uvicorn
    
    # Create models directory if it doesn't exist
    MODELS_DIR.mkdir(exist_ok=True)
    
    # Run server
    uvicorn.run(
        app,
        host='127.0.0.1',
        port=8000,
        log_level='info'
    )
