# Room Service System - Testing Guide

## Quick Start

### For Guests (No Login Required)
1. **Access the Guest Portal**:
   - Navigate to: `http://localhost:5173/room-service/test-reservation-123`
   - Replace `test-reservation-123` with any reservation ID
   - You should see the guest portal load immediately

2. **QR Code Tab**:
   - See the generated QR code
   - Click "Share QR Code" button to share it

3. **Menu Tab**:
   - Browse available menu items
   - Click on an item to see details
   - Add items to cart with special instructions
   - View order history
   - Place orders

4. **Messages Tab**:
   - Send messages to staff
   - Messages automatically refresh every 1.5 seconds
   - See staff responses in real-time

5. **Billing Tab**:
   - View your charges breakdown
   - See subtotal, tax, and service fee
   - View payment status
   - Complete checkout button (enabled only when paid)

### For Staff (Requires Login)
1. **Login to Dashboard**:
   - Go to: `http://localhost:5173/login`
   - Use your staff credentials

2. **Menu Management** (`/shop-menu`):
   - Click "Shop Menu" in sidebar
   - Create new menu items
   - Edit existing items
   - Delete items as needed
   - Organize by category and property

3. **Order Management** (`/room-service`):
   - Click "Room Service" in sidebar
   - View pending orders by status
   - See guest information and room numbers
   - Update order status:
     - Pending → Confirmed
     - Confirmed → In Progress
     - In Progress → Completed

4. **Real-time Messaging**:
   - When guest sends message, see it in their order
   - Send replies through staff dashboard
   - Messages sync automatically

## Testing Scenarios

### Scenario 1: Guest Places Order
1. Guest accesses `/room-service/reservation-123`
2. Guest browses menu and adds items
3. Guest provides special instructions (e.g., "No onions")
4. Guest submits order
5. Staff sees order in `/room-service` dashboard
6. Order marked as "Confirmed"
7. Guest sees order status update in "Messages" tab

### Scenario 2: Real-time Messaging
1. Guest sends message: "Can you add extra butter?"
2. Keep browser open, staff responds within 1.5 seconds
3. Message automatically refreshes on guest screen
4. Guest sees staff response

### Scenario 3: Billing Process
1. Guest places multiple orders
2. Billing tab shows: Subtotal ($50) + Tax ($5) + Fee ($5) = Total ($60)
3. "Complete Checkout" button is DISABLED (unpaid)
4. Guest makes payment via Stripe
5. Payment confirmed
6. "Complete Checkout" button becomes ENABLED
7. Guest can now complete checkout and leave property

### Scenario 4: QR Code Flow
1. Staff sets up menu items in `/shop-menu`
2. Staff generates QR code via `/api/room-service-qr/reservation-123`
3. QR code printed in room or sent to guest email
4. Guest scans QR code with phone camera
5. Phone opens: `/room-service/reservation-123`
6. Guest accesses full menu and services

## API Testing via cURL

### Generate QR Code
```bash
curl http://localhost:3000/api/room-service-qr/test-reservation-123
```
Response: Base64 PNG image data

### Create Menu Item
```bash
curl -X POST http://localhost:3000/api/shop-menu \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop-1",
    "name": "Caesar Salad",
    "description": "Fresh caesar salad with croutons",
    "price": 12.99,
    "category": "Salads",
    "prepTimeMinutes": 15
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/guest-messages \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "test-reservation-123",
    "senderType": "guest",
    "senderName": "John Doe",
    "message": "Can I get extra lemon?"
  }'
```

### Get Messages
```bash
curl http://localhost:3000/api/guest-messages/test-reservation-123
```

### Place Order
```bash
curl -X POST http://localhost:3000/api/guest-orders \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "test-reservation-123",
    "propertyId": "prop-1",
    "specialRequests": "Extra spicy"
  }'
```

### Get Billing
```bash
curl http://localhost:3000/api/guest-billing/test-reservation-123
```

### Create Payment Intent (Stripe)
```bash
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "test-reservation-123",
    "amount": 6000
  }'
```

## Development Server

### Start Backend
```bash
cd c:\Users\mosim\OneDrive\Desktop\AIPoweredHospitality
npm run dev
```

### Start Frontend (separate terminal)
```bash
cd c:\Users\mosim\OneDrive\Desktop\AIPoweredHospitality\client
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## Browser DevTools Debugging

1. **Network Tab**:
   - Check API requests to `/api/*` endpoints
   - Verify they're routing to backend
   - Check response status (200 for success)

2. **Console Tab**:
   - Look for any error messages
   - Verify no 405 Method Not Allowed errors
   - Check for authentication errors

3. **Storage Tab**:
   - Check localStorage for auth tokens
   - Verify VITE_API_URL environment variable

## Common Issues & Solutions

### Issue: "Cannot GET /room-service/:id"
**Solution**: Make sure route is at top level in Router(), not inside auth block

### Issue: "405 Method Not Allowed"
**Solution**: Verify apiRequest() is being used instead of raw fetch()

### Issue: "Messages not updating"
**Solution**: 
- Check Network tab for `/api/guest-messages` requests
- Verify requests are being sent every 1.5 seconds
- Check backend is returning message data

### Issue: "QR Code not displaying"
**Solution**:
- Verify `/api/room-service-qr/:id` endpoint returns image data
- Check qrcode package is installed: `npm list qrcode`
- Check backend logs for errors

### Issue: "Sidebar showing on guest portal"
**Solution**: Already fixed! AppContent checks for `/room-service/` pattern and hides sidebar

### Issue: "Checkout button always disabled"
**Solution**: 
- Verify payment was confirmed via Stripe
- Check guestBilling.status = 'paid' in database
- Check POST /api/confirm-payment was successful

## Deployment Checklist

Before deploying to production:

- [ ] All TypeScript errors resolved (except pre-existing ones)
- [ ] npm run build completes successfully in client/
- [ ] Backend .env has all required variables
- [ ] Frontend .env has VITE_API_URL pointing to backend
- [ ] Stripe keys configured correctly
- [ ] Database migrations applied
- [ ] QR codes tested and working
- [ ] Payment flow tested with Stripe
- [ ] Real-time messaging tested
- [ ] Guest portal access without login confirmed
- [ ] Staff dashboard fully functional

## Support Information

All room service features are now live and working. For issues:

1. Check browser console for errors
2. Check network requests in DevTools
3. Verify API endpoints match `/api/room-service-*` patterns
4. Ensure VITE_API_URL is correctly configured
5. Check backend logs on Render
