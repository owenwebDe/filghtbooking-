# Dubai Travel Website Setup Guide

## 🇦🇪 Real Data Integration for Dubai Client

This guide shows how to connect your travel booking website to real travel APIs to populate flights, hotels, and packages with live data for your Dubai-based client.

## 📋 Required API Keys

### 1. **Amadeus Travel API** (Primary - Recommended)
- **Purpose**: Real-time flights, hotel, and travel data
- **Cost**: Free tier: 2,000 calls/month, then pay-as-you-go
- **Sign up**: https://developers.amadeus.com/
- **Best for**: Flight search, hotel search, airport data

```env
NEXT_PUBLIC_AMADEUS_API_KEY=your_amadeus_api_key
NEXT_PUBLIC_AMADEUS_CLIENT_ID=your_client_id
NEXT_PUBLIC_AMADEUS_CLIENT_SECRET=your_client_secret
```

### 2. **RapidAPI** (Multiple providers)
- **Purpose**: Access to Booking.com, Skyscanner, and other APIs
- **Cost**: Various pricing tiers starting free
- **Sign up**: https://rapidapi.com/
- **Best for**: Hotels (Booking.com API), Alternative flight data

```env
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
```

### 3. **Alternative Options**:

#### **Skyscanner API** (via RapidAPI)
- Great for flight comparisons
- Strong coverage of Middle East routes

#### **Booking.com API** (via RapidAPI)  
- Largest hotel inventory globally
- Good coverage of Dubai/UAE hotels

#### **Expedia API**
- Hotels and vacation packages
- Good for bundle deals

## 🏗️ Implementation Steps

### Step 1: Get API Keys
1. Sign up for Amadeus (free tier)
2. Sign up for RapidAPI (free tier)
3. Subscribe to Booking.com API on RapidAPI
4. Subscribe to Skyscanner API on RapidAPI

### Step 2: Configure Environment
1. Copy `.env.local.example` to `.env.local`
2. Add your API keys to `.env.local`
3. Restart your development server

### Step 3: Test Integration
```bash
# Test flights from Dubai to London
GET /flights?from=DXB&to=LHR&date=2024-09-15

# Test hotels in Dubai Marina
GET /hotels?location=Dubai%20Marina&checkin=2024-09-15&checkout=2024-09-17
```

## 🇦🇪 Dubai-Specific Features Implemented

### **Flights**
- **Default departure**: Dubai International Airport (DXB)
- **Pre-loaded destinations**: Popular routes from Dubai
- **Airlines**: Emirates, Etihad, flydubai, Air Arabia
- **Currency**: All prices in AED (UAE Dirham)
- **Real airport codes**: DXB, DWC, AUH, SHJ

### **Hotels**
- **Dubai locations**: Marina, Downtown, Jumeirah, DIFC, etc.
- **Currency**: AED pricing
- **Local amenities**: Pool, WiFi, Spa, etc.

### **Packages**
- **Dubai Luxury Experience**: Burj Al Arab, helicopter tours
- **Dubai Family Adventure**: Theme parks, waterparks
- **Dubai Business & Leisure**: DIFC hotels, golf, networking

## 💰 Cost Estimation

### **Development/Testing** (Free)
- Amadeus: 2,000 calls/month free
- RapidAPI: 100-500 calls/month free per API
- Currency API: 1,500 calls/month free

### **Production** (Paid)
- Amadeus: $0.002-0.01 per call
- Booking.com API: $0.01-0.05 per call
- Skyscanner API: $0.005-0.02 per call

### **Monthly Estimate for 10,000 searches**:
- Flight searches: ~$50-100
- Hotel searches: ~$100-500  
- Total: ~$150-600/month

## 🚀 Quick Start Commands

```bash
# 1. Copy environment file
cp .env.local.example .env.local

# 2. Add your API keys to .env.local
nano .env.local

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Test the flight search at:
# http://localhost:3000/flights
```

## 📊 Real Data Integration Status

### ✅ **Ready to Use**:
- Dubai-specific mock data with real airlines
- AED currency formatting
- Real airport codes (DXB, AUH, etc.)
- Popular Dubai destinations
- Dubai travel packages

### 🔄 **Activate with API Keys**:
- Live flight search (Amadeus)
- Real hotel data (Booking.com)
- Currency conversion
- Airport autocomplete

### 🎯 **Business Benefits**:
- **Real-time pricing**: Always current rates
- **Live availability**: Actual seats/rooms
- **Comprehensive data**: 500+ airlines, 1M+ hotels
- **Local focus**: Dubai-centric experience
- **Professional appearance**: Real data builds trust

## 🛠️ Backend Integration

The backend is ready to store and manage:
- Real booking data
- User preferences  
- Payment processing
- Booking confirmations
- Customer support data

## 📞 Next Steps

1. **Get API keys** (start with Amadeus free tier)
2. **Configure environment** variables
3. **Test integration** with real searches
4. **Customize branding** for Dubai client
5. **Add payment processing** (Stripe/UAE banks)
6. **Deploy to production** server

## 🌟 Dubai Market Advantages

- **Strategic location**: Hub between Europe, Asia, Africa
- **High disposable income**: Affluent customer base  
- **Tourism growth**: 20+ million visitors annually
- **Business travel**: Major financial/business hub
- **Luxury focus**: High-end travel market
- **Multi-cultural**: International customer base

Your Dubai client now has access to a professional travel booking platform that can compete with global players while maintaining local focus and expertise!