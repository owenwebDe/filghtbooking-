# FlightBooking Frontend

Next.js React frontend for the flight booking platform.

## Features

- Modern responsive UI with Tailwind CSS
- Firebase Authentication integration
- Search and browse flights, hotels, vacation packages
- User booking flow with payment integration
- Guest browsing with login required for payments
- Stripe payment processing

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
   - Create Firebase project
   - Enable Authentication (Email/Password and Google)
   - Add web app to Firebase project
   - Copy config to .env.local

4. Run development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Pages

- `/` - Homepage with search widget
- `/login` - User login
- `/register` - User registration
- `/flights` - Flight search and listing
- `/hotels` - Hotel search and listing
- `/packages` - Vacation package listing
- `/bookings` - User bookings (authenticated)
- `/profile` - User profile (authenticated)

## Technologies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Firebase Auth
- Stripe
- Axios for API calls
- React Hook Form
- React Hot Toast

## Authentication Flow

1. Users can browse without authentication
2. Login/registration required for booking
3. Firebase handles authentication
4. JWT tokens used for API authentication
5. Google OAuth supported