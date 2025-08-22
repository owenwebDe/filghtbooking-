import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Firebase Configuration (for authentication only)
    FIREBASE_PROJECT_ID = "flightbooking-ed362"
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # MongoDB Configuration
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "flightbooking")
    
    # Stripe Configuration
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    
    # Flight API Configuration
    FLIGHT_API_USER_ID = os.getenv("FLIGHT_API_USER_ID")
    FLIGHT_API_PASSWORD = os.getenv("FLIGHT_API_PASSWORD")
    FLIGHT_API_ACCESS = os.getenv("FLIGHT_API_ACCESS", "Test")  # "Test" or "Production"
    FLIGHT_API_IP_ADDRESS = os.getenv("FLIGHT_API_IP_ADDRESS", "127.0.0.1")
    
    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ADMIN_URL = os.getenv("ADMIN_URL", "http://localhost:3001")

settings = Settings()