# Quick Start Guide - One-Click Deployment

This guide will help you deploy your Hospitality PMS SaaS application in minutes.

## 🚀 Quick Deploy

### Step 1: Fork & Deploy Backend (5 minutes)

1. **Fork this repository** to your GitHub account

2. **Go to [Render](https://render.com)** and sign up/login

3. **Click "New +" → "Blueprint"**

4. **Select this repository** - Render will auto-detect `render.yaml`

5. **Click "Apply"** - Render will create:
   - PostgreSQL database
   - Backend web service

6. **IMPORTANT: Set FRONTEND_URL first** (before other env vars):
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
   (You'll update this with your actual Vercel URL in Step 3)

7. **Add other required environment variables** in Render dashboard:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PRICE_ID_MONTHLY=price_your_id_here
   STRIPE_PRICE_ID_YEARLY=price_your_id_here
   ```

8. **Note your backend URL**: `https://your-app-name.onrender.com`

### Step 2: Deploy Frontend (3 minutes)

1. **Go to [Vercel](https://vercel.com)** and sign up/login

2. **Click "Add New Project"** → Import your repository

3. **Configure environment variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here
   ```

4. **Click "Deploy"** - Vercel will build and deploy

5. **Note your frontend URL**: `https://your-app.vercel.app`

### Step 3: Connect Frontend & Backend (1 minute)

1. **Go back to Render** → Your backend service → Environment

2. **Update FRONTEND_URL** with your actual Vercel URL:
   ```
   FRONTEND_URL=https://your-actual-app.vercel.app
   ```
   ⚠️ **CRITICAL**: This must match your Vercel URL exactly (including https://) or CORS will block all requests!

3. **Save** - Render will automatically redeploy

### Step 4: Initialize Database (2 minutes)

```bash
# Install dependencies
npm install

# Set your database URL (from Render dashboard)
export DATABASE_URL="your_database_url"

# Push schema to database
npm run db:push
```

## ✅ That's It!

Your SaaS app is now live at your Vercel URL!

## 🧪 Test Your Deployment

1. Visit your Vercel URL
2. Click "Sign in with Replit" or register
3. You'll get a 3-month free trial automatically
4. Explore the dashboard, reservations, and features

## 🔑 How the License System Works

1. **Free Trial**: Every new user gets 90 days free
2. **All Features Unlocked**: AI forecasting, dynamic pricing, analytics
3. **Auto-Renewal**: After trial, users must subscribe to continue
4. **Stripe Integration**: Handles all payment processing
5. **License Validation**: Automatic on every AI feature access

## 📊 What You Get

### Core Features (Always Available)
- ✅ Reservation management
- ✅ Guest check-in/checkout
- ✅ Room inventory
- ✅ Housekeeping management
- ✅ Basic reporting

### Premium Features (License Required)
- 🤖 AI demand forecasting
- 💰 Dynamic pricing optimization
- 📈 Advanced analytics
- 🎯 Guest personalization
- 🔮 Predictive maintenance

## 🎨 Customize Your Deployment

### Add OpenAI for AI Features

In Render, add:
```
OPENAI_API_KEY=sk-your_openai_key
```

### Use Live Stripe Keys

Replace test keys with live keys in both Render and Vercel:
```
# Render
STRIPE_SECRET_KEY=sk_live_...

# Vercel
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Custom Domain

#### Vercel:
1. Project Settings → Domains → Add
2. Update DNS records

#### Render:
1. Service Settings → Custom Domain → Add
2. Update DNS records

## 🆘 Troubleshooting

### "Failed to fetch" errors
- Check `VITE_API_URL` in Vercel points to your Render URL
- Verify `FRONTEND_URL` in Render matches your Vercel URL

### Database connection errors
- Ensure `DATABASE_URL` is set in Render
- Run `npm run db:push` to initialize schema

### Stripe not working
- Verify keys are correctly set (test with test keys first)
- Check Stripe dashboard for errors

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 💰 Pricing

### Render
- Free tier: 750 hours/month
- Starter: $7/month + $7/month for database

### Vercel
- Hobby: Free
- Pro: $20/month (for commercial use)

### Total Cost
- Development: **$0/month** (free tiers)
- Production: **$14/month** (Render starter + database)

## 🎯 Next Steps

1. Set up Stripe products and prices
2. Configure your pricing tiers
3. Customize branding and UI
4. Add your hotel/property data
5. Invite your team members
6. Go live! 🚀

---

**Need Help?** Check the [full deployment guide](./DEPLOYMENT.md) or open an issue.
