# 🚀 Getting Started - 5 Minute Quick Start

## The Fastest Way to Get Your Hotel PMS Running

---

## ⚡ TL;DR (2 Minutes)

```bash
# 1. Install
git clone <repo> && cd AIPoweredHospitality && npm install

# 2. Setup
cp .env.example .env.local
npm run db:push

# 3. Run
npm run dev:all

# 4. Open browser
# Go to http://localhost:5173
# Login with: demo@hotel.com / Demo123!@#
```

**Done! Your PMS is running.** ✅

---

## 📋 Prerequisites (1 Minute)

You need:
- ✅ Node.js 18+ (`node -v` to check)
- ✅ Git (to clone repo)
- ✅ A code editor (VS Code recommended)
- ✅ 2GB free disk space

**Don't have Node.js?**
- Windows/Mac: https://nodejs.org/
- Linux: `apt-get install nodejs` or `brew install node`

---

## 🎬 Step-by-Step Setup (5 Minutes)

### Step 1: Clone Repository (30 seconds)

```bash
git clone https://github.com/Cse21-034/AIPoweredHospitality.git
cd AIPoweredHospitality
```

### Step 2: Install Dependencies (2 minutes)

```bash
npm install
```

**What's happening?**
- Installs 100+ npm packages
- Downloads React, Express, UI components
- Sets up build tools

### Step 3: Configure Environment (1 minute)

**Option A: Quick Setup (SQLite - Offline)**
```bash
cp .env.example .env.local
```

**Option B: PostgreSQL (Cloud)**

Edit `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host:port/hotel_pms
NODE_ENV=development
```

### Step 4: Initialize Database (1 minute)

```bash
npm run db:push
```

**What's happening?**
- Creates all database tables
- Sets up relationships
- Adds sample data

### Step 5: Start the App (30 seconds)

```bash
npm run dev:all
```

**You'll see:**
```
✓ Frontend ready at http://localhost:5173
✓ Backend ready at http://localhost:3000
✓ Database connected
```

### Step 6: Open in Browser

Go to: **http://localhost:5173**

---

## 🔐 First Login

### Demo Credentials
```
Email:    demo@hotel.com
Password: Demo123!@#
```

### Create Your Own Account

1. Click "Sign Up"
2. Enter your email
3. Set a strong password
4. Click "Create Account"

---

## 🏨 First-Time Setup Checklist

After logging in, follow these steps:

### ✅ 1. Create Your Property (2 minutes)

```
Menu → Properties & Rooms
Click "Add Property"
Enter:
  - Property Name: "My Hotel"
  - Address, Phone, Email
  - Currency, Timezone
Click "Save"
```

### ✅ 2. Add Rooms (3 minutes)

```
Go to Properties page
Click your property
Click "Add Room Type"
Enter:
  - Name: "Standard Room"
  - Occupancy: 2
  - Base Rate: $120
Click "Add Room"

(Repeat for other room types)
```

### ✅ 3. Create Test Reservation (2 minutes)

```
Menu → Reservations
Click "New Reservation"
Select:
  - Guest (create new or pick existing)
  - Room
  - Check-in date
  - Check-out date
Enter price and click "Create"
```

### ✅ 4. Activate License (1 minute)

```
Menu → License & Subscription
Enter License Key: HPMS-DEMO-2024-TEST
Click "Activate"
Select Plan: Professional
```

### ✅ 5. Explore Features (5 minutes)

Navigate to each menu item:
- Dashboard - See overview
- Reservations - Manage bookings
- Guests - View profiles
- Room Service - Manage orders
- AI Demand Forecast - See predictions
- Staff Management - Add staff
- Analytics - View reports

---

## 🎯 What Each Page Does

### 📊 Dashboard
- Real-time KPIs (revenue, occupancy, ADR)
- Charts and trends
- Quick actions
- Upcoming reservations

### 📅 Reservations
- Create/manage bookings
- Check-in/out
- Pricing & payments
- Guest communication

### 👥 Guests
- Guest profiles
- Contact information
- Stay history
- Preferences

### 🏠 Properties & Rooms
- Manage properties
- Add/edit rooms
- Room inventory
- Availability

### 🍽️ Room Service
- Guest orders
- Menu management
- Order status
- Billing integration

### 💰 Guest Billing
- Create invoices
- Payment tracking
- Refunds
- Reports

### 🤖 AI Demand Forecast
- Predict occupancy (30 days)
- Revenue projections
- Insights & alerts
- AI confidence scores

### 💳 AI Dynamic Pricing
- Optimal room rates
- Revenue optimization
- Competitor analysis
- Price recommendations

### 🚨 AI Fraud & Churn
- Detect fraud
- Identify at-risk guests
- Retention strategies
- Risk scoring

### 👨‍💼 Staff Management
- Add/remove staff
- Schedules
- Payroll tracking
- Performance reviews

### 🧹 Housekeeping & Maintenance
- Work orders
- Equipment tracking
- Maintenance schedule
- Inspection logs

### 📈 Advanced Analytics
- Revenue analysis
- Occupancy trends
- Guest segmentation
- Custom reports

### 🔑 License & Subscription
- License activation
- Plan management
- Billing history
- Feature access

---

## 🔧 Common Tasks

### Add a Guest

```
Menu → Guests
Click "Add Guest"
Fill in details:
  - Name, Email, Phone
  - Address
  - Preferences
Click "Save"
```

### Create Room Service Order

```
Menu → Room Service
Click "New Order"
Select Guest/Room
Add Items from menu
Click "Send Order"
```

### View Revenue Report

```
Menu → Analytics → Reports
Select Date Range
Choose Report Type
Click "Generate"
Download as CSV/PDF
```

### Check Fraud Alerts

```
Menu → AI Risk Detection
View Recent Alerts
Click alert for details
Take action (approve/reject)
```

### Schedule Staff

```
Menu → Staff Management → Schedule
Drag staff to time slots
Set hours
Click "Save Schedule"
```

---

## 🤖 Using AI Features

### Demand Forecasting

1. Go to **AI Demand Forecast**
2. See 30-day occupancy predictions
3. View revenue projections
4. Review key insights
5. Make pricing decisions based on forecast

### Dynamic Pricing

1. Go to **AI Dynamic Pricing**
2. See AI-recommended prices
3. Compare with current rates
4. Check revenue impact
5. Click "Apply Recommendation"

### Fraud Detection

1. Go to **AI Fraud & Churn**
2. Review recent alerts
3. Check risk scores
4. Approve or reject transactions
5. Identify at-risk guests

---

## 💾 Data Management

### Export Data

```
Any page with data:
Click "Export" button
Choose format: CSV, PDF, Excel
File downloads automatically
```

### Import Data

```
Menu → Settings
Click "Import Data"
Choose CSV file
Map columns
Click "Import"
```

### Backup Database

```bash
# Automatic daily backups (if using Neon)
# Manual backup:
pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup

```bash
psql $DATABASE_URL < backup.sql
npm run db:push
```

---

## 🚨 Troubleshooting

### App Won't Start?

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev:all
```

### Port 3000 Already in Use?

```bash
# Use different port
PORT=3001 npm run dev
```

### Can't Login?

```bash
# Check if database is running
npm run db:push

# Try demo credentials
Email: demo@hotel.com
Password: Demo123!@#
```

### Page Won't Load?

```bash
# Clear browser cache
Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)

# Reload page
F5 or Cmd+R
```

### ML Features Not Working?

ML features need the Python service running:

```bash
# In another terminal
pip install -r ml/requirements.txt
python ml/inference_service.py
```

---

## 📱 Using on Mobile

The app is fully responsive. You can:
1. Share reservation link with guests
2. Guests can check in from phone
3. Guests can order room service
4. View dashboard on tablet
5. Manage orders on phone

To access from mobile:
```
Change localhost to your IP:
http://192.168.1.100:5173
```

---

## 🚀 Going Live

When ready to deploy:

### 1. Get a Domain
- Buy from GoDaddy, Namecheap, etc.
- Point DNS to your server

### 2. Deploy Frontend
```bash
# Push to GitHub
git push origin main

# Deploy on Vercel
vercel --prod
```

### 3. Deploy Backend
```bash
# Create account on Render.com
# Connect GitHub repo
# Set environment variables
# Deploy
```

### 4. Setup Database
```bash
# Create PostgreSQL on Neon
# Update DATABASE_URL
# Run migrations
npm run db:push
```

### 5. Enable HTTPS
```bash
# Automatic with Vercel & Render
# Get free SSL certificate
```

---

## 📚 Next: Learn More

After you're comfortable, read:

1. **SYSTEM_OVERVIEW.md** - Architecture details
2. **INSTALLATION.md** - Advanced setup
3. **ML_QUICK_START.md** - ML model training
4. **design_guidelines.md** - UI customization

---

## 💡 Pro Tips

- 🔐 Use strong passwords
- 📊 Check dashboard daily
- 🤖 Train ML models with real data (after 2+ weeks)
- 💾 Backup regularly
- 📱 Test on mobile devices
- 🔍 Review fraud alerts daily
- 📈 Use pricing recommendations
- 👥 Keep staff info updated

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Database configured
- [ ] App running locally
- [ ] Logged in successfully
- [ ] Property created
- [ ] Rooms added
- [ ] Test reservation created
- [ ] License activated
- [ ] All pages explored
- [ ] Ready to customize

---

## 🎉 You're Ready!

Your complete hotel management system is now running.

### What to do next:
1. ✅ Customize property details
2. ✅ Add your staff
3. ✅ Import existing reservations
4. ✅ Set up payment processing
5. ✅ Configure email notifications
6. ✅ Deploy to production
7. ✅ Train on real data
8. ✅ Enable AI features

---

## 📞 Need Help?

- **Docs**: Check markdown files in root
- **Issues**: GitHub issues page
- **Code**: Explore the source
- **Error**: Read the error message carefully

---

**Congratulations! You now have a professional hotel management system.** 🎊

Start managing your guests and let AI optimize your business! 🚀

---

*Last updated: January 2025*
*Time to setup: 5 minutes*
*Complexity: Beginner-friendly* ✨
