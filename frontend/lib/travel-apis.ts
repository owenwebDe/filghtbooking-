// Real Travel API Integration - NO MOCK DATA
import axios from 'axios';

// API Base URLs and Configuration
const AMADEUS_BASE_URL = process.env.NEXT_PUBLIC_AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const BOOKING_COM_BASE_URL = 'https://booking-com15.p.rapidapi.com/api/v1';
const SKYSCANNER_BASE_URL = 'https://skyscanner50.p.rapidapi.com/api/v1';

// Amadeus OAuth token storage
let amadeusAccessToken: string | null = null;
let tokenExpiry: number = 0;

// Get Amadeus access token using client credentials
const getAmadeusAccessToken = async (): Promise<string> => {
  // Check if token is still valid (with 5 minute buffer)
  if (amadeusAccessToken && Date.now() < tokenExpiry - 300000) {
    return amadeusAccessToken;
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_AMADEUS_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_AMADEUS_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Amadeus credentials not configured');
    }

    const response = await axios.post(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, 
      new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    amadeusAccessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    return amadeusAccessToken;
  } catch (error) {
    console.error('Failed to get Amadeus access token:', error);
    throw error;
  }
};

// Create API clients
const createAmadeusClient = async () => {
  const token = await getAmadeusAccessToken();
  return axios.create({
    baseURL: AMADEUS_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

const bookingClient = axios.create({
  baseURL: BOOKING_COM_BASE_URL,
  headers: {
    'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
  }
});

const skyscannerClient = axios.create({
  baseURL: SKYSCANNER_BASE_URL,
  headers: {
    'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
  }
});

// Dubai-specific reference data (not business logic data)
export const DUBAI_AIRPORTS = {
  DXB: { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai' },
  DWC: { code: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai' },
  AUH: { code: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi' },
  SHJ: { code: 'SHJ', name: 'Sharjah International Airport', city: 'Sharjah' }
};

export const POPULAR_DESTINATIONS_FROM_DUBAI = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'JFK', name: 'John F Kennedy Intl', city: 'New York', country: 'USA' },
  { code: 'BOM', name: 'Mumbai Airport', city: 'Mumbai', country: 'India' },
  { code: 'DEL', name: 'Delhi Airport', city: 'Delhi', country: 'India' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  { code: 'DOH', name: 'Doha Airport', city: 'Doha', country: 'Qatar' },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'SIN', name: 'Singapore Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' }
];

// Dubai-specific locations for hotel search
export const DUBAI_LOCATIONS = [
  'Dubai Marina',
  'Downtown Dubai', 
  'Jumeirah Beach',
  'Dubai International Financial Centre (DIFC)',
  'Business Bay',
  'Palm Jumeirah',
  'Dubai Creek',
  'Deira',
  'Bur Dubai',
  'Jumeirah Lake Towers (JLT)',
  'Dubai Sports City',
  'Dubai Silicon Oasis',
  'Dubai Investment Park',
  'Al Barsha',
  'Dubai Festival City'
];

// Flight Search API - REAL DATA ONLY
export const realFlightAPI = {
  // Search flights using Amadeus API
  searchFlights: async (params: {
    from: string;
    to: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    cabinClass?: string;
  }) => {
    try {
      const amadeusClient = await createAmadeusClient();
      
      const response = await amadeusClient.get('/v2/shopping/flight-offers', {
        params: {
          originLocationCode: params.from,
          destinationLocationCode: params.to,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.passengers,
          currencyCode: 'AED',
          max: 20
        }
      });
      
      console.log('✅ Amadeus API Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Amadeus API error:', error);
      
      if (error.response?.status === 401) {
        // Clear token and retry once
        amadeusAccessToken = null;
        try {
          const amadeusClient = await createAmadeusClient();
          const response = await amadeusClient.get('/v2/shopping/flight-offers', {
            params: {
              originLocationCode: params.from,
              destinationLocationCode: params.to,
              departureDate: params.departureDate,
              returnDate: params.returnDate,
              adults: params.passengers,
              currencyCode: 'AED',
              max: 20
            }
          });
          console.log('✅ Amadeus API Success (retry):', response.data);
          return response.data;
        } catch (retryError) {
          console.error('❌ Amadeus API retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  },

  // Alternative: Skyscanner API
  searchFlightsSkyscanner: async (params: any) => {
    try {
      const response = await skyscannerClient.get('/flights/search', {
        params: {
          origin: params.from,
          destination: params.to,
          date: params.departureDate,
          returnDate: params.returnDate,
          adults: params.passengers,
          currency: 'AED'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Skyscanner API error:', error);
      throw error;
    }
  },

  // Get airport suggestions
  getAirports: async (query: string) => {
    try {
      const amadeusClient = await createAmadeusClient();
      const response = await amadeusClient.get('/reference-data/locations', {
        params: {
          keyword: query,
          subType: 'AIRPORT',
          'page[limit]': 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('Airport search error:', error);
      throw error;
    }
  },

  // Get popular flights from backend
  getPopularFlights: async (params?: {
    from?: string;
    to?: string;
    departureDate?: string;
  }) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/flights/popular`, {
        params: {
          from: params?.from,
          to: params?.to,
          departure_date: params?.departureDate,
          limit: 10
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching popular flights from backend:', error);
      throw error;
    }
  }
};

// Hotel Search API - REAL DATA ONLY
export const realHotelAPI = {
  // Search hotels using Booking.com API
  searchHotels: async (params: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  }) => {
    try {
      const response = await bookingClient.get('/hotels/searchHotels', {
        params: {
          dest_id: params.location,
          search_type: 'city',
          arrival_date: params.checkIn,
          departure_date: params.checkOut,
          adults: params.guests,
          children: '0',
          room_qty: params.rooms,
          page_number: '1',
          languagecode: 'en-us',
          currency_code: 'AED'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Booking.com API error:', error);
      throw error;
    }
  },

  // Search Dubai hotels specifically
  searchDubaiHotels: async (params: {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  }) => {
    try {
      // Dubai city ID for Booking.com API
      const dubaiDestId = '-782831';
      
      const response = await bookingClient.get('/hotels/searchHotels', {
        params: {
          dest_id: dubaiDestId,
          search_type: 'city',
          arrival_date: params.checkIn,
          departure_date: params.checkOut,
          adults: params.guests,
          children: '0',
          room_qty: params.rooms,
          page_number: '1',
          languagecode: 'en-us',
          currency_code: 'AED',
          order_by: 'popularity'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Dubai hotels API error:', error);
      throw error;
    }
  },

  // Get hotel details
  getHotelDetails: async (hotelId: string) => {
    try {
      const response = await bookingClient.get('/hotels/details', {
        params: {
          hotel_id: hotelId,
          currency: 'AED',
          locale: 'en-gb'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Hotel details error:', error);
      throw error;
    }
  },

  // Search locations for Dubai area
  searchDubaiLocations: async (query: string) => {
    try {
      const response = await bookingClient.get('/hotels/locations', {
        params: {
          name: query,
          locale: 'en-gb'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Location search error:', error);
      throw error;
    }
  },

  // Get popular hotels from backend
  getPopularHotels: async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hotels/popular`, {
        params: {
          limit: 20
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching popular hotels from backend:', error);
      throw error;
    }
  }
};

// Packages API - REAL DATA ONLY
export const packagesAPI = {
  // Get all packages from backend
  getAvailablePackages: async (params?: {
    destination?: string;
    duration?: string;
    maxPrice?: number;
    participants?: number;
  }) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/packages`, {
        params: {
          destination: params?.destination,
          duration: params?.duration,
          max_price: params?.maxPrice,
          participants: params?.participants,
          limit: 20
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching packages from backend:', error);
      throw error;
    }
  },

  // Search packages with filters
  searchPackages: async (searchParams: any) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/packages/search`, {
        params: searchParams
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching packages:', error);
      throw error;
    }
  },

  // Get featured packages
  getFeaturedPackages: async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/packages/featured`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured packages:', error);
      throw error;
    }
  },

  // Get package details
  getPackageDetails: async (packageId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/packages/${packageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching package details:', error);
      throw error;
    }
  }
};

// Currency conversion utility with real API
export const currencyAPI = {
  convertToAED: async (amount: number, fromCurrency: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY;
      if (!apiKey) {
        throw new Error('Exchange Rate API key not configured');
      }
      
      const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`);
      
      if (response.data.result === 'success') {
        const rate = response.data.conversion_rates.AED;
        return amount * rate;
      } else {
        throw new Error(`Exchange API error: ${response.data['error-type']}`);
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw error;
    }
  },

  getExchangeRates: async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY;
      if (!apiKey) {
        throw new Error('Exchange Rate API key not configured');
      }
      
      const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/AED`);
      
      if (response.data.result === 'success') {
        return response.data.conversion_rates;
      } else {
        throw new Error(`Exchange API error: ${response.data['error-type']}`);
      }
    } catch (error) {
      console.error('Exchange rates error:', error);
      throw error;
    }
  },

  // Convert from USD to AED (common for travel APIs)
  convertUSDToAED: async (usdAmount: number) => {
    return await currencyAPI.convertToAED(usdAmount, 'USD');
  },

  // Get current USD to AED rate
  getUSDToAEDRate: async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY;
      if (!apiKey) {
        throw new Error('Exchange Rate API key not configured');
      }
      
      const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
      
      if (response.data.result === 'success') {
        return response.data.conversion_rates.AED;
      }
      throw new Error('Failed to get USD to AED rate');
    } catch (error) {
      console.error('USD to AED rate error:', error);
      throw error;
    }
  }
};

// Format currency for UAE
export const formatAEDCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format currency with conversion info
export const formatCurrencyWithConversion = (amount: number, originalCurrency: string = 'USD'): string => {
  if (originalCurrency === 'AED') {
    return formatAEDCurrency(amount);
  }
  
  const aedFormatted = formatAEDCurrency(amount);
  return `${aedFormatted}`;
};

// Get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    'AED': 'د.إ',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹'
  };
  return symbols[currency] || currency;
};

export default {
  realFlightAPI,
  realHotelAPI,
  packagesAPI,
  currencyAPI,
  DUBAI_AIRPORTS,
  POPULAR_DESTINATIONS_FROM_DUBAI,
  DUBAI_LOCATIONS,
  formatAEDCurrency,
  formatCurrencyWithConversion,
  getCurrencySymbol
};