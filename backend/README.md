# Flight Booking Backend API

FastAPI backend with MongoDB and Firebase authentication for the flight booking platform.

## Features

- FastAPI REST API
- MongoDB database with Beanie ODM
- Firebase Authentication (auth only)
- JWT token-based authentication
- Stripe payment integration
- Role-based access control (user/admin)
- CORS enabled for frontend integration

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase and Stripe credentials
```

3. MongoDB Setup:
   - Install MongoDB locally or use Docker
   - Start MongoDB: `mongod` or `docker run -d -p 27017:27017 mongo:7.0`
   - Database will be automatically created

4. Firebase Setup (Authentication only):
   - Firebase config is already set in the code
   - Enable Authentication in Firebase Console
   - No service account needed

5. Stripe Setup:
   - Create Stripe account
   - Get test API keys
   - Add to .env file

6. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/firebase-login` - Login with Firebase token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout user

### Flights
- `GET /flights/search` - Search flights
- `GET /flights/` - Get all flights
- `GET /flights/{id}` - Get flight by ID
- `POST /flights/` - Create flight (admin only)
- `PUT /flights/{id}` - Update flight (admin only)
- `DELETE /flights/{id}` - Delete flight (admin only)

### Hotels
- `GET /hotels/search` - Search hotels
- `GET /hotels/` - Get all hotels
- `GET /hotels/{id}` - Get hotel by ID
- `POST /hotels/` - Create hotel (admin only)
- `PUT /hotels/{id}` - Update hotel (admin only)
- `DELETE /hotels/{id}` - Delete hotel (admin only)

### Vacation Packages
- `GET /packages/search` - Search packages
- `GET /packages/` - Get all packages
- `GET /packages/{id}` - Get package by ID
- `POST /packages/` - Create package (admin only)
- `PUT /packages/{id}` - Update package (admin only)
- `DELETE /packages/{id}` - Delete package (admin only)

### Bookings
- `POST /bookings/` - Create booking
- `GET /bookings/my-bookings` - Get user bookings
- `GET /bookings/{id}` - Get booking by ID
- `GET /bookings/` - Get all bookings (admin only)
- `PUT /bookings/{id}/status` - Update booking status (admin only)

### Payments
- `POST /payments/create-payment-intent` - Create payment intent
- `POST /payments/confirm-payment` - Confirm payment
- `POST /payments/webhook` - Stripe webhook
- `GET /payments/my-payments` - Get user payments
- `GET /payments/{id}` - Get payment by ID
- `GET /payments/` - Get all payments (admin only)
- `POST /payments/{id}/refund` - Refund payment (admin only)

## Documentation

API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## MongoDB Collections

### users
- uid (unique), email (unique), full_name, phone, role, created_at

### flights
- airline, flight_number, departure_airport, arrival_airport, departure_time, arrival_time, price, available_seats, aircraft_type, duration_minutes, created_at

### hotels
- name, location, address, description, price_per_night, available_rooms, amenities, rating, images, created_at

### vacation_packages
- name, destination, description, duration_days, price, includes, itinerary, images, max_participants, created_at

### bookings
- user_id, booking_type, item_id, check_in_date, check_out_date, passengers, special_requests, status, total_amount, created_at

### payments
- booking_id, amount, payment_method, status, stripe_payment_intent_id, created_at

## MongoDB Setup

The application uses Beanie ODM for MongoDB operations. Collections are automatically created when the application starts.