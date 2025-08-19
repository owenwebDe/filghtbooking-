# FlightBooking - Complete Travel Platform

A comprehensive flight booking and travel management platform built with modern technologies.

## 🏗️ Project Structure

```
flightbooking/
├── frontend/           # Next.js 14 Frontend Application
├── backend/           # FastAPI Backend API
├── admin-panel/       # React Admin Dashboard
├── docker-compose.yml # Docker orchestration
└── setup.sh          # Quick setup script
```

## 🚀 Live Demo

**Frontend Application:** https://frontend-gaybykh73-owens-projects-9a25e22f.vercel.app

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **React Hot Toast** - Notifications
- **Responsive Sidebar** - Professional authenticated UI

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **JWT Authentication** - Secure user authentication
- **Pydantic** - Data validation
- **CORS** - Cross-origin resource sharing

### Admin Panel
- **React** - Frontend library
- **Material-UI** - Component library
- **Admin Dashboard** - Management interface

### APIs & Integrations
- **Amadeus Travel API** - Flight data
- **RapidAPI** - Hotel and travel services
- **Stripe** - Payment processing
- **Firebase** - Authentication (optional)

## 🔧 Features

### ✅ Frontend Features
- **Responsive Sidebar Navigation** - Smart navigation based on authentication
- **Real Travel APIs** - No mock data, completely API-driven
- **User Authentication** - JWT-based login/register system
- **Flight Search** - Real-time flight data from Amadeus
- **Hotel Booking** - Hotel search and booking system
- **Travel Packages** - Complete travel package management
- **User Dashboard** - Personalized user experience
- **Wallet System** - Virtual wallet for transactions
- **Booking Management** - View and manage all bookings
- **Profile Management** - User profile and settings
- **Referral System** - User referral program
- **Mobile Responsive** - Works perfectly on all devices

### ✅ Backend Features
- **RESTful API** - Complete CRUD operations
- **Authentication & Authorization** - Secure user management
- **Database Integration** - MongoDB with proper schemas
- **API Documentation** - Auto-generated with FastAPI
- **Error Handling** - Comprehensive error management
- **CORS Support** - Frontend-backend communication

### ✅ Admin Panel Features
- **Admin Dashboard** - Overview of platform metrics
- **User Management** - Manage all users
- **Booking Management** - Handle all bookings
- **Analytics** - Platform usage statistics
- **Settings** - Configure platform settings

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or later)
- **Python** (v3.8 or later)
- **MongoDB** (local or cloud)
- **Git**

### Option 1: Docker Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/owenwebDe/filghtbooking-.git
cd filghtbooking-

# Start all services with Docker
docker-compose up -d

# Access the applications:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Admin Panel: http://localhost:3001
```

### Option 2: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Create .env file with your configurations
cp .env.example .env

# Start the backend
uvicorn main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local

# Start the frontend
npm run dev
```

#### 3. Admin Panel Setup
```bash
cd admin-panel
npm install
npm start
```

## 🔐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AMADEUS_API_KEY=your_amadeus_key
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017/flightbooking
SECRET_KEY=your_secret_key
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 📱 API Documentation

Once the backend is running, visit:
- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🎨 Design System

- **Primary Colors:** Blue gradient themes
- **Typography:** Inter font family
- **Icons:** Heroicons library
- **Responsive:** Mobile-first approach
- **Dark Mode:** Ready for dark theme

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
```

### Backend Development
```bash
cd backend
uvicorn main:app --reload    # Development server
pytest                       # Run tests
black .                      # Code formatting
```

## 🚀 Deployment

### Frontend - Vercel (Deployed)
- **Live URL:** https://frontend-gaybykh73-owens-projects-9a25e22f.vercel.app
- **Auto-deploys** from this repository

### Backend - Deploy Options
- **Heroku:** `git subtree push --prefix backend heroku main`
- **Railway:** Connect repository and set root directory to `/backend`
- **Digital Ocean:** Use App Platform
- **AWS:** Use Elastic Beanstalk or ECS

### Database
- **MongoDB Atlas:** Cloud MongoDB (recommended)
- **Self-hosted:** MongoDB on VPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email dev@flightbooking.com or create an issue in this repository.

## 🙏 Acknowledgments

- **Amadeus** for flight API
- **RapidAPI** for hotel data
- **Vercel** for frontend hosting
- **Next.js** team for the amazing framework
- **FastAPI** for the excellent Python framework

---

**Built with ❤️ for modern travel booking experiences**