# AI/ML System Quick Start Guide

## 1. Setup Python Environment

```bash
# Create virtual environment
python -m venv ml_env
source ml_env/bin/activate  # On Windows: ml_env\Scripts\activate

# Install dependencies
cd ml
pip install -r requirements.txt
```

## 2. Generate Synthetic Training Data

```bash
python synthetic_data_generator.py
# Output: ./data/
#   - demand_forecasting_data.csv (2000 rows)
#   - dynamic_pricing_data.csv (1500 rows)
#   - guest_stay_data.csv (1000 rows)
#   - guest_feedback_data.csv (800 rows)
#   - housekeeping_turnovers.csv (1200 rows)
#   - equipment_data.csv (600 rows)
#   - transaction_data.csv (2000 rows)
#   - pos_sales_data.csv (3000 rows)
```

## 3. Train ML Models

### Demand Forecasting
```bash
python demand_forecasting_pipeline.py
# Trains XGBoost/LightGBM model
# Output: 
#   - models/demand_forecast.pkl
#   - models/demand_forecast_metadata.json
# Metrics: MAPE, MAE, RMSE, Feature Importance
```

### Dynamic Pricing
```bash
python dynamic_pricing_pipeline.py
# Output:
#   - models/dynamic_pricing.pkl
#   - models/dynamic_pricing_metadata.json
# Metrics: MAPE, MAE, R²
```

### Fraud Detection & Churn
```bash
python fraud_detection_pipeline.py
# Trains supervised + unsupervised models
# Output:
#   - models/fraud_detection.pkl (supervised + isolation forest)
#   - models/guest_churn.pkl (churn classifier)
#   - Metadata files
# Metrics: Precision, Recall, F1, ROC-AUC
```

## 4. Start Local Inference Service

```bash
# Set license key environment variable
export LICENSE_KEY="HPMS-DEMO-KEY-12345-ABCDE"

# Start FastAPI service
python inference_service.py
# Server running on http://localhost:8000
# API docs: http://localhost:8000/docs
```

## 5. Make Predictions from Desktop App

```typescript
// Example: Call demand forecasting model
async function predictDemand(propertyId: string) {
  const response = await fetch('http://localhost:8000/predict/demand', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey,
    },
    body: JSON.stringify({
      property_id: propertyId,
      room_type: 'Deluxe King',
      features: {
        occupancy_rate: 0.65,
        avg_rate: 150.0,
        day_of_week: 3,
        month: 1,
        holiday_flag: 0,
        market_index: 1.05,
      }
    })
  });
  
  const prediction = await response.json();
  console.log(`Predicted nights sold: ${prediction.forecast_value}`);
  console.log(`Confidence: ${prediction.confidence}%`);
}

// Example: Call pricing model
async function recommendPrice(propertyId: string) {
  const response = await fetch('http://localhost:8000/predict/pricing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey,
    },
    body: JSON.stringify({
      property_id: propertyId,
      room_type: 'Deluxe King',
      current_price: 150,
      occupancy_rate: 0.75,
      competitor_prices_avg: 145,
      lead_time_days: 14,
    })
  });
  
  const pricing = await response.json();
  console.log(`Recommended price: $${pricing.recommended_price}`);
  console.log(`Expected change: ${pricing.price_change_percent}%`);
}

// Example: Detect fraud
async function detectFraud(transactionId: string) {
  const response = await fetch('http://localhost:8000/predict/fraud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey,
    },
    body: JSON.stringify({
      transaction_id: transactionId,
      amount: 250.0,
      guest_id: 'guest_123',
      ip_country: 'US',
      booking_ip_country: 'CN',
    })
  });
  
  const fraud = await response.json();
  console.log(`Fraud probability: ${fraud.fraud_probability}%`);
  console.log(`Recommended action: ${fraud.recommended_action}`);
}

// Example: Predict churn
async function predictChurn(guestId: string) {
  const response = await fetch('http://localhost:8000/predict/churn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey,
    },
    body: JSON.stringify({
      guest_id: guestId,
      feedback_score: 7,
      is_repeat_guest: true,
      spend_total: 450.0,
      length_of_stay_days: 3,
    })
  });
  
  const churn = await response.json();
  console.log(`Churn risk: ${churn.risk_segment}`);
  console.log(`Churn probability: ${churn.churn_probability}%`);
}
```

## 6. Collect Data for Continuous Learning

### Demand Forecasting Data
```bash
POST /api/ml/demand-data
{
  "propertyId": "prop_001",
  "roomTypeId": "room_type_1",
  "forecastDate": "2025-01-23",
  "bookingsCount": 12,
  "checkinsCount": 10,
  "nightsSold": 24,
  "availableRooms": 20,
  "avgRate": 150.50,
  "occupancyRate": 0.60,
  "holidayFlag": false,
  "weatherAvgTempC": 65.5
}
```

### Guest Stay Data (for personalization)
```bash
POST /api/ml/guest-stay-data
{
  "propertyId": "prop_001",
  "guestId": "guest_123",
  "reservationId": "res_456",
  "arrivalDate": "2025-01-20",
  "lengthOfStayDays": 3,
  "roomTypeBooked": "Deluxe King",
  "spendTotal": 450.75,
  "feedback Score": 8,
  "channel": "direct",
  "isRepeatGuest": true
}
```

### Housekeeping Data
```bash
POST /api/ml/housekeeping-turnover
{
  "propertyId": "prop_001",
  "roomId": "room_101",
  "expectedCleanDuration": 45,
  "actualCleanDuration": 42,
  "cleaningStaffId": "staff_5",
  "housekeepingPriority": "normal",
  "issuesFound": [{"issue": "stain", "location": "carpet", "severity": "low"}],
  "dateRecorded": "2025-01-23"
}
```

### Transaction Data (for fraud detection)
```bash
POST /api/ml/transaction-data
{
  "propertyId": "prop_001",
  "guestId": "guest_123",
  "reservationId": "res_456",
  "transactionId": "txn_789",
  "amount": 250.00,
  "paymentMethod": "card",
  "ipCountry": "US",
  "bookingIpCountry": "US",
  "bookingChannel": "direct",
  "transactionDate": "2025-01-23T10:30:00Z"
}
```

## 7. Monitor Model Performance

```bash
# Get model status
GET /models/status
Response: {
  "license_valid": true,
  "license_expires": "2025-02-23T...",
  "models": [
    {
      "name": "demand_forecasting",
      "version": "20250123_120000",
      "available": true,
      "metrics": {
        "train_mape": 0.12,
        "test_mape": 0.15,
        "train_mae": 4.5,
        "test_mae": 5.2
      }
    }
  ]
}

# Get model performance
GET /analytics/model-performance?propertyId=prop_001&modelName=demand_forecasting&days=30
Response: {
  "model": "demand_forecasting",
  "avg_mape": 0.16,
  "avg_mae": 5.4,
  "predictions_count": 240,
  "drift_detected": false
}

# Check for data drift
GET /analytics/drift-status
Response: {
  "models_drift_detected": [],
  "requires_retraining": false,
  "next_check": "2025-01-24T..."
}
```

## 8. Active Learning - Get Staff Feedback

```bash
# Get cases needing labels
GET /api/ml/active-learning/pending?propertyId=prop_001&modelName=demand_forecasting
Response: [
  {
    "id": "case_123",
    "caseType": "low_confidence",
    "confidenceScore": 0.42,
    "dataJson": {...},
    "createdAt": "2025-01-23T..."
  }
]

# Submit staff feedback
POST /api/ml/active-learning
{
  "propertyId": "prop_001",
  "modelName": "demand_forecasting",
  "caseType": "low_confidence",
  "dataJson": {...},
  "humanLabel": "25"  // Staff corrects prediction
}
```

## 9. Model Updates

```bash
# Check for available updates
POST /models/update
{
  "check_for_updates": true
}
Response: {
  "status": "update_check_complete",
  "updates_available": [
    {
      "model": "demand_forecasting",
      "current_version": "20250101_...",
      "new_version": "20250123_...",
      "improvement": "MAPE reduced from 0.15 to 0.12"
    }
  ]
}

# Update will:
# 1. Download encrypted model from license server
# 2. Verify signature with public key
# 3. Replace local model atomically
# 4. Keep backup of previous version
# 5. Test on recent data before activation
```

## 10. Privacy & Data Export

```bash
# Create data export request (GDPR)
POST /api/ml/data-export-request
{
  "propertyId": "prop_001",
  "requestType": "export",
  "dataScope": "guest_id",
  "scopeId": "guest_123",
  "exportFormat": "json"
}
Response: {
  "id": "export_req_789",
  "status": "in_progress",
  "estimatedCompletion": "2025-01-24T..."
}

# Get export status
GET /api/ml/data-export-request/export_req_789
Response: {
  "status": "completed",
  "fileUrl": "s3://exports/export_req_789.json",
  "expiresAt": "2025-02-23T..."
}
```

## Project Structure

```
AIPoweredHospitality/
├── ml/
│   ├── data/                           # Synthetic & training datasets
│   ├── models/                         # Trained model files
│   ├── demand_forecasting_pipeline.py
│   ├── dynamic_pricing_pipeline.py
│   ├── fraud_detection_pipeline.py
│   ├── synthetic_data_generator.py
│   ├── inference_service.py            # FastAPI local service
│   └── requirements.txt
├── shared/
│   ├── schema.ts                       # Core PMS schema
│   └── ml-schema.ts                    # ML tables schema
├── server/
│   ├── routes.ts                       # PMS API routes
│   ├── ml-routes.ts                    # ML data collection routes
│   └── ...
├── client/
│   ├── src/
│   │   ├── pages/                      # React pages
│   │   ├── components/                 # UI components
│   │   └── ...
│   └── ...
├── ML_SYSTEM_COMPLETE.md               # Full system documentation
└── ...
```

## Common Issues & Solutions

### License Error
```
Error: License not valid
Solution: 
  1. Set LICENSE_KEY environment variable
  2. Ensure license is active and not expired
  3. Check if all required features are unlocked
```

### Model Not Found
```
Error: Model demand_forecasting not found
Solution:
  1. Train the model first: python demand_forecasting_pipeline.py
  2. Check models/ directory exists
  3. Verify model file permissions
```

### Inference Timeout
```
Error: Inference exceeded timeout
Solution:
  1. Check if inference_service.py is running
  2. Reduce feature vector complexity
  3. Increase timeout in client (default 30s)
```

### CORS Error from Desktop App
```
Error: CORS policy blocked request
Solution:
  1. Inference service CORS is enabled by default
  2. Ensure calling from http://localhost:8000
  3. Check X-License-Key header is present
```

## Next Steps

1. **Train Models**: Run all training pipelines with your actual data
2. **Deploy Service**: Start inference_service.py on production server
3. **Integrate Frontend**: Connect React app to local API endpoints
4. **Collect Data**: Start capturing demand, pricing, guest data
5. **Monitor**: Setup drift detection and active learning
6. **Iterate**: Monthly retraining with accumulated data
7. **Expand**: Add more models (sentiment, maintenance, etc.)

## Support

- Full documentation: See `ML_SYSTEM_COMPLETE.md`
- Model training: See pipeline source code with comments
- API reference: Swagger docs at `http://localhost:8000/docs`
- Issues: Check logs in inference_service.py output

---

**System Version**: 1.0.0  
**Last Updated**: 2025-01-23  
**Ready for Production**: Yes
