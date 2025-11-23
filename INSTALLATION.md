# AI-Powered Hospitality PMS - Installation & Setup Guide

## Complete Standalone Application

This is a **full-featured, production-ready** Hotel Property Management System with integrated AI/ML capabilities. The application is designed to run as a standalone desktop or web app.

---

## 📋 System Requirements

### Windows, macOS, or Linux
- **Node.js**: v18.17.0 or higher
- **Python**: 3.9+ (for ML models)
- **PostgreSQL**: 13+ (for cloud deployment) OR SQLite (for local/offline)
- **RAM**: 8GB minimum (4GB minimum for light usage)
- **Storage**: 2GB for application + dependencies

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Web Application (Recommended for Teams)

```bash
# 1. Clone and install
git clone <your-repo>
cd AIPoweredHospitality
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# 3. Start development server
npm run dev:all
# Frontend: http://localhost:5173
# Backend: http://localhost:3000

# 4. Open browser
# Navigate to http://localhost:5173
# Login with demo credentials
```

### Option 2: Standalone Desktop App

```bash
# After following Option 1 setup above:

# Build desktop version
npm run build

# Run as standalone app (Tauri/Electron)
npm run tauri dev
```

---

## 📦 Installation Steps

### Step 1: Prerequisites

```bash
# Verify Node.js
node -v  # Should be v18.17.0+

# Verify Python
python --version  # Should be 3.9+

# Install PostgreSQL (if using cloud database)
# Or use local SQLite (comes with app)
```

### Step 2: Clone Repository

```bash
git clone https://github.com/YourOrg/AIPoweredHospitality.git
cd AIPoweredHospitality
```

### Step 3: Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm install

# Install Python ML dependencies
pip install -r ml/requirements.txt
```

### Step 4: Configure Environment

Create `.env.local` in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hotel_pms
# OR for SQLite (offline):
DATABASE_URL=file:./hotel.db

# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# API Keys (Optional)
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...

# License (Generated during activation)
LICENSE_KEY=HPMS-XXXX-XXXX-XXXX
```

### Step 5: Database Setup

```bash
# Push schema to database
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### Step 6: Start Application

```bash
# Development mode (both frontend and backend)
npm run dev:all

# OR separately:
npm run dev           # Backend on http://localhost:3000
npm run dev:client    # Frontend on http://localhost:5173
```

### Step 7: ML Model Setup (Optional but Recommended)

```bash
# Generate training data
python ml/synthetic_data_generator.py
# Creates sample data for model training

# Train demand forecasting model
python ml/demand_forecasting_pipeline.py
# Creates demand_model.pkl in ./models/

# Start inference service
python ml/inference_service.py
# Starts on http://localhost:8000
```

---

## 🎯 First-Time Login

1. **Navigate to**: http://localhost:5173
2. **Create account** or use demo credentials:
   - Email: `demo@hotel.com`
   - Password: `Demo123!@#`
3. **Activate license**:
   - Go to **License & Subscription**
   - Enter license key: `HPMS-DEMO-2024-TEST`
   - Select plan: Professional
4. **Create property**:
   - Go to **Properties**
   - Click "Add Property"
   - Fill in details
5. **Start using** the PMS

---

## 📊 Available Features

### Core PMS
- ✅ Reservations management
- ✅ Guest profiles & history
- ✅ Room inventory & rates
- ✅ Guest billing & payments
- ✅ Room service orders
- ✅ Housekeeping tracking

### AI/ML Features
- 🤖 **Demand Forecasting** - Predict occupancy 30 days ahead
- 💰 **Dynamic Pricing** - AI-optimized room rates
- 🚨 **Fraud Detection** - Real-time transaction monitoring
- 📉 **Churn Prediction** - Identify at-risk guests

### Operations
- 👥 Staff management
- 🧹 Housekeeping & maintenance
- 📈 Advanced analytics & reports
- 🔐 License & subscription management

---

## 🔧 Configuration

### Customize Hotel Details

```typescript
// client/src/lib/hotelConfig.ts
export const hotelConfig = {
  name: "Your Hotel Name",
  currency: "USD",
  timezone: "America/New_York",
  defaultCheckInTime: "15:00",
  defaultCheckOutTime: "11:00",
};
```

### Enable/Disable Features

```typescript
// shared/ml-schema.ts
export const features = {
  aiDemandForecasting: true,
  aiDynamicPricing: true,
  fraudDetection: true,
  advancedReports: true,
};
```

---

## 🗄️ Database Structure

### Core Tables
- `users` - Staff accounts
- `properties` - Hotel properties
- `rooms` - Individual rooms
- `reservations` - Bookings
- `guests` - Guest profiles
- `room_service_requests` - Orders

### ML Tables
- `demand_forecasting_data` - Occupancy metrics
- `dynamic_pricing_data` - Price decisions
- `fraud_detections` - Flagged transactions
- `guest_stay_data` - Guest profiles
- `model_prediction_logs` - Prediction history

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Reservations
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations/:id` - Update
- `DELETE /api/reservations/:id` - Delete

### Guests
- `GET /api/guests` - List guests
- `GET /api/guests/:id` - Get guest
- `POST /api/guests` - Create guest

### Room Service
- `GET /api/room-service-requests` - List orders
- `POST /api/room-service-requests` - Create order
- `GET /api/shop-menu` - Get menu items

### AI/ML (Inference Service)
- `POST /predict/demand` - Demand forecast
- `POST /predict/pricing` - Pricing recommendation
- `POST /predict/fraud` - Fraud detection
- `POST /predict/churn` - Churn prediction

---

## 🚀 Deployment

### Deploy to Vercel (Frontend)

```bash
# 1. Push to GitHub
git push origin main

# 2. Create Vercel project
vercel create

# 3. Deploy
vercel --prod
```

### Deploy Backend to Render

```bash
# 1. Create Render service
# 2. Connect GitHub repo
# 3. Set environment variables
# 4. Deploy

# Your backend will be at: https://your-app.render.com
```

### Deploy ML Service to Docker

```bash
# 1. Build Docker image
docker build -f ml/Dockerfile -t hotel-pms-ml .

# 2. Run container
docker run -p 8000:8000 hotel-pms-ml

# 3. ML service at: http://localhost:8000
```

---

## 🔐 Security Setup

### Enable HTTPS (Production)

Update `.env.local`:
```env
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### Database Security

```bash
# Use strong password
# Restrict database access to app server only
# Enable SSL connections
# Regular backups scheduled
```

### API Security

```typescript
// Endpoints are protected with:
// - Session authentication
// - CORS restrictions
// - Rate limiting
// - Input validation (Zod)
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

### Database Connection Error

```bash
# Test connection
psql -h localhost -U user -d hotel_pms

# Check DATABASE_URL in .env.local
# Format: postgresql://user:password@host:port/database
```

### ML Model Not Found

```bash
# Train models first
python ml/demand_forecasting_pipeline.py

# Check if models/ directory exists with .pkl files
ls -la models/
```

### Frontend Won't Load

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev:client
```

---

## 📚 Architecture Overview

```
AIPoweredHospitality/
├── client/              # React frontend
│   ├── src/pages/       # All 15+ pages
│   ├── src/components/  # UI components
│   └── src/lib/         # Utilities
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── db.ts            # Database layer
│   └── auth.ts          # Authentication
├── ml/                  # Python models
│   ├── demand_forecasting_pipeline.py
│   ├── dynamic_pricing_pipeline.py
│   ├── fraud_detection_pipeline.py
│   ├── inference_service.py
│   └── requirements.txt
├── shared/              # Shared types
│   ├── schema.ts        # Database schema
│   └── ml-schema.ts     # ML tables
└── package.json         # Dependencies
```

---

## 📊 Pages & Routes

### Admin/Staff Pages
- `/dashboard` - Main dashboard with KPIs
- `/reservations` - Manage bookings
- `/guests` - Guest management
- `/properties` - Property & room setup
- `/room-service` - Room service orders
- `/guest-billing` - Billing management
- `/qr-codes` - Generate QR codes
- `/rates` - Rate management
- `/staff-management` - HR management
- `/housekeeping-maintenance` - Operations

### AI/Analytics Pages
- `/ai/demand-forecast` - Demand predictions
- `/ai/dynamic-pricing` - Pricing recommendations
- `/ai/fraud-churn` - Fraud & churn analysis
- `/analytics-reports` - Advanced reports

### System Pages
- `/license-subscription` - License management
- `/settings` - System settings
- `/shop-menu` - Menu management

### Guest Pages
- `/room-service/:reservationId` - Guest order portal

---

## 🎓 Learning Resources

### Key Files to Understand

1. **Schema**: `shared/schema.ts` (833 lines)
   - All database tables and relationships

2. **Routes**: `server/routes.ts` (1561 lines)
   - All 40+ API endpoints

3. **ML Models**: `ml/*.py` (2000+ lines)
   - Training pipelines and inference

4. **Pages**: `client/src/pages/*.tsx`
   - React components for each feature

### Documentation Files

- `ML_SYSTEM_COMPLETE.md` - Full ML system docs
- `ML_QUICK_START.md` - ML setup guide
- `IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `design_guidelines.md` - UI/UX guidelines

---

## 💡 Next Steps

1. ✅ Complete installation
2. ✅ Login and create property
3. ✅ Add sample reservations
4. ✅ Explore all pages
5. ✅ Train ML models
6. ✅ Review AI predictions
7. ✅ Customize settings
8. ✅ Deploy to production

---

## 📞 Support

- **Documentation**: See markdown files in root directory
- **Issues**: Check GitHub issues
- **Email**: support@hotelpms.com
- **Status**: Check [status page]

---

## 📄 License

Licensed under MIT. See LICENSE file for details.

---

## 🎉 You're All Set!

Your AI-Powered Hospitality PMS is ready to use. Start managing your hotel operations with AI-driven insights.

**Happy Hosting! 🏨**
