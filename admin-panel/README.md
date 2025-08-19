# FlightBooking Admin Panel

Next.js React admin dashboard for managing the flight booking platform.

## Features

- Admin-only authentication with role-based access
- Dashboard with analytics and overview
- Manage flights, hotels, vacation packages
- View and manage bookings
- Payment processing and refunds
- User management
- Responsive admin interface

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase and API credentials
```

3. Firebase Setup:
   - Use same Firebase project as frontend
   - Ensure admin users have role='admin' in Firestore
   - Add web app config to .env.local

4. Run development server:
```bash
npm run dev
```

The admin panel will be available at http://localhost:3001

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration (same as frontend)

## Admin Access

1. Create user account via backend API or frontend
2. Update user role to 'admin' in Firestore users collection
3. Login with admin credentials

## Admin Pages

- `/login` - Admin login (role verification)
- `/dashboard` - Main dashboard with stats
- `/flights` - Flight management
- `/hotels` - Hotel management
- `/packages` - Vacation package management
- `/bookings` - Booking management
- `/payments` - Payment and refund management
- `/users` - User management
- `/analytics` - Analytics and reports

## Technologies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Firebase Auth (admin role required)
- Recharts for analytics
- Axios for API calls
- React Hook Form
- React Hot Toast

## Security

- Role-based authentication (admin only)
- Firebase ID token verification
- API access token management
- Automatic logout on unauthorized access