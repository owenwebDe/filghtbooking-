#!/bin/bash

echo "🚀 Setting up FlightBooking Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed."
    exit 1
fi

print_status "Installing Python dependencies for backend..."
cd backend
python3 -m pip install -r requirements.txt
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed successfully!"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "Installing Node.js dependencies for frontend..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed successfully!"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Installing Node.js dependencies for admin panel..."
cd ../admin-panel
npm install
if [ $? -eq 0 ]; then
    print_status "Admin panel dependencies installed successfully!"
else
    print_error "Failed to install admin panel dependencies"
    exit 1
fi

cd ..

print_status "Setting up environment files..."
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp admin-panel/.env.example admin-panel/.env.local

print_status "✅ Setup completed successfully!"
echo
print_warning "⚠️  IMPORTANT: Please complete the following steps:"
echo "1. Install and start MongoDB:"
echo "   - Install MongoDB: https://docs.mongodb.com/manual/installation/"
echo "   - Start MongoDB: mongod --dbpath /your/data/path"
echo "   - Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:7.0"
echo
echo "2. Set up your Firebase project (for authentication only):"
echo "   - Firebase config is already configured with your provided details"
echo "   - Enable Authentication (Email/Password and Google) in Firebase Console"
echo "   - No additional Firebase setup needed - using MongoDB for data storage"
echo
echo "3. Set up Stripe account:"
echo "   - Create account at https://stripe.com"
echo "   - Get test API keys from dashboard"
echo
echo "4. Configure environment variables:"
echo "   - Edit backend/.env with JWT secret and Stripe keys"
echo "   - Edit frontend/.env.local with Stripe publishable key"
echo "   - MongoDB URL: mongodb://localhost:27017 (default)"
echo
echo "5. Create admin user:"
echo "   - Register a user via frontend"
echo "   - Update user role to 'admin' in MongoDB users collection"
echo "   - Or use MongoDB Compass/CLI to update the role field"
echo
echo "6. Start the services:"
echo "   MongoDB:      mongod (if not using Docker)"
echo "   Backend:      cd backend && uvicorn app.main:app --reload"
echo "   Frontend:     cd frontend && npm run dev"
echo "   Admin Panel:  cd admin-panel && npm run dev"
echo
echo "7. Docker option:"
echo "   docker-compose up -d (includes MongoDB, backend, frontend, admin)"
echo
print_status "🎉 Your FlightBooking platform with MongoDB is ready to go!"