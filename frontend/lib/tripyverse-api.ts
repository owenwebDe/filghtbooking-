import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// TravelNext Flight API Types
export interface FlightSegment {
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  flight_number: string;
  airline_code: string;
  airline_name: string;
  aircraft_type?: string;
  duration: string;
  stops: number;
  cabin_class: string;
  fare_basis?: string;
  baggage_info?: string;
}

export interface PassengerFare {
  passenger_type: string;
  base_fare: number;
  taxes: number;
  total_fare: number;
  passenger_count: number;
}

export interface FlightOption {
  fare_source_code: string;
  airline_code: string;
  airline_name: string;
  total_duration: string;
  total_stops: number;
  departure_time: string;
  arrival_time: string;
  segments: FlightSegment[];
  passenger_fares: PassengerFare[];
  total_amount: number;
  currency: string;
  is_refundable: boolean;
  fare_type: string;
  booking_class: string;
  last_ticket_date?: string;
  baggage_info?: string[];
}

export interface FlightSearchResponse {
  success: boolean;
  flights: FlightOption[];
  total_results: number;
  currency: string;
  search_metadata: {
    search_id?: string;
    search_key?: string;
    origin: string;
    destination: string;
    departure_date: string;
    return_date?: string;
    journey_type: string;
    passengers: {
      adults: number;
      children: number;
      infants: number;
    };
    class: string;
  };
  error?: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  journey_type?: string;
  adults?: number;
  children?: number;
  infants?: number;
  class_type?: string;
  currency?: string;
  airline_code?: string;
  direct_flight?: number;
}

export interface HotelSearchParams {
  destination_code?: string;
  city_name?: string;
  country_name?: string;
  check_in_date: string;
  check_out_date: string;
  rooms: Array<{
    adults: number;
    children: number;
    child_ages?: number[];
  }>;
  nationality?: string;
  currency?: string;
  max_result?: number;
}

export interface Hotel {
  hotel_code: string;
  hotel_name: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  description?: string;
  amenities: string[];
  images: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  rooms: Array<{
    room_type: string;
    room_name: string;
    price: number;
    currency: string;
    board_type: string;
    cancellation_policy: string;
    room_amenities: string[];
  }>;
  total_price: number;
  currency: string;
}

export interface HotelSearchResponse {
  success: boolean;
  hotels: Hotel[];
  total_results: number;
  currency: string;
  search_metadata: {
    destination: string;
    check_in_date: string;
    check_out_date: string;
    rooms: number;
    guests: number;
  };
  error?: string;
}

// TripyVerse API - Real TravelNext Integration
export const tripyverseAPI = {
  // Flight APIs using real TravelNext integration
  flights: {
    // Search flights with real TravelNext API
    search: async (params: FlightSearchParams): Promise<FlightSearchResponse> => {
      try {
        const response = await apiClient.get('/flights/search', { 
          params: {
            origin: params.origin,
            destination: params.destination,
            departure_date: params.departure_date,
            return_date: params.return_date,
            journey_type: params.journey_type || 'OneWay',
            adults: params.adults || 1,
            children: params.children || 0,
            infants: params.infants || 0,
            class_type: params.class_type || 'Economy',
            currency: params.currency || 'USD',
            airline_code: params.airline_code,
            direct_flight: params.direct_flight
          }
        });
        return response.data;
      } catch (error: any) {
        console.error('Flight search error:', error);
        // Return error response in consistent format instead of throwing
        return {
          success: false,
          error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Flight search failed',
          flights: [],
          search_metadata: {}
        };
      }
    },

    // Multi-city flight search
    searchMulticity: async (segments: Array<{origin: string, destination: string, departure_date: string}>, options: any = {}): Promise<FlightSearchResponse> => {
      try {
        const response = await apiClient.post('/flights/search/multicity', {
          segments,
          adults: options.adults || 1,
          children: options.children || 0,
          infants: options.infants || 0,
          class_type: options.class_type || 'Economy',
          currency: options.currency || 'USD',
          airline_code: options.airline_code
        });
        return response.data;
      } catch (error: any) {
        console.error('Multi-city flight search error:', error);
        throw new Error(error.response?.data?.detail || 'Multi-city flight search failed');
      }
    },

    // Validate fare before booking
    validateFare: async (session_id: string, fare_source_code: string, fare_source_code_inbound?: string) => {
      try {
        const response = await apiClient.post('/flights/validate-fare', null, {
          params: {
            session_id,
            fare_source_code,
            fare_source_code_inbound
          }
        });
        return response.data;
      } catch (error: any) {
        console.error('Fare validation error:', error);
        throw new Error(error.response?.data?.detail || 'Fare validation failed');
      }
    },

    // Book flight
    book: async (bookingData: any) => {
      try {
        const response = await apiClient.post('/flights/book', bookingData);
        return response.data;
      } catch (error: any) {
        console.error('Flight booking error:', error);
        throw new Error(error.response?.data?.detail || 'Flight booking failed');
      }
    },

    // Get extra services (baggage, meals, seats)
    getExtraServices: async (session_id: string, fare_source_code: string) => {
      try {
        const response = await apiClient.get('/flights/extra-services', {
          params: { session_id, fare_source_code }
        });
        return response.data;
      } catch (error: any) {
        console.error('Extra services error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to get extra services');
      }
    },

    // Get fare rules
    getFareRules: async (session_id: string, fare_source_code: string, fare_source_code_inbound?: string) => {
      try {
        const response = await apiClient.get('/flights/fare-rules', {
          params: { session_id, fare_source_code, fare_source_code_inbound }
        });
        return response.data;
      } catch (error: any) {
        console.error('Fare rules error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to get fare rules');
      }
    },

    // Get trip details
    getTripDetails: async (unique_id: string) => {
      try {
        const response = await apiClient.get(`/flights/trip-details/${unique_id}`);
        return response.data;
      } catch (error: any) {
        console.error('Trip details error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to get trip details');
      }
    },

    // Order ticket (for non-LCC airlines)
    orderTicket: async (unique_id: string) => {
      try {
        const response = await apiClient.post(`/flights/order-ticket/${unique_id}`);
        return response.data;
      } catch (error: any) {
        console.error('Ticket order error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to order ticket');
      }
    },

    // Cancel booking
    cancel: async (unique_id: string) => {
      try {
        const response = await apiClient.delete(`/flights/cancel/${unique_id}`);
        return response.data;
      } catch (error: any) {
        console.error('Flight cancellation error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to cancel flight');
      }
    },

    // Get airports
    getAirports: async () => {
      try {
        const response = await apiClient.get('/flights/airports');
        return response.data;
      } catch (error: any) {
        console.error('Airports error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to get airports');
      }
    },

    // Get airlines
    getAirlines: async () => {
      try {
        const response = await apiClient.get('/flights/airlines');
        return response.data;
      } catch (error: any) {
        console.error('Airlines error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to get airlines');
      }
    }
  },

  // Hotel APIs using real TravelNext integration
  hotels: {
    // Search hotels with real TravelNext API
    search: async (params: HotelSearchParams): Promise<HotelSearchResponse> => {
      try {
        const response = await apiClient.get('/hotels/search', { 
          params: {
            destination_code: params.destination_code,
            city_name: params.city_name,
            country_name: params.country_name,
            check_in_date: params.check_in_date,
            check_out_date: params.check_out_date,
            adults: params.rooms.reduce((acc, room) => acc + room.adults, 0),
            children: params.rooms.reduce((acc, room) => acc + room.children, 0),
            no_of_rooms: params.rooms.length,
            nationality: params.nationality || 'IN',
            currency: params.currency || 'USD',
            max_result: params.max_result || 25
          }
        });
        return response.data;
      } catch (error: any) {
        console.error('Hotel search error:', error);
        // Return error response in consistent format instead of throwing
        return {
          success: false,
          error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Hotel search failed',
          hotels: [],
          search_metadata: {}
        };
      }
    },

    // Book hotel
    book: async (bookingData: any) => {
      try {
        const response = await apiClient.post('/hotels/book', bookingData);
        return response.data;
      } catch (error: any) {
        console.error('Hotel booking error:', error);
        throw new Error(error.response?.data?.detail || 'Hotel booking failed');
      }
    },

    // Get hotel details
    getDetails: async (session_id: string, hotel_code: string, product_id: string) => {
      try {
        const response = await apiClient.get('/hotels/details', {
          params: { session_id, hotel_code, product_id }
        });
        return response.data;
      } catch (error: any) {
        console.error('Hotel details error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to get hotel details');
      }
    },

    // Cancel hotel booking
    cancel: async (booking_id: string) => {
      try {
        const response = await apiClient.post(`/hotels/cancel/${booking_id}`);
        return response.data;
      } catch (error: any) {
        console.error('Hotel cancellation error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to cancel hotel booking');
      }
    }
  }
};

// Format currency for TripyVerse (showing USD by default)
export const formatTripyverseCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format duration in a user-friendly way
export const formatFlightDuration = (duration: string): string => {
  // Handle different duration formats
  if (duration.includes('h') && duration.includes('m')) {
    return duration; // Already formatted like "2h 30m"
  }
  
  if (duration.match(/^\d+$/)) {
    // Pure minutes
    const totalMinutes = parseInt(duration);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
  
  if (duration.includes('PT')) {
    // ISO 8601 duration format like "PT2H30M"
    return duration
      .replace('PT', '')
      .replace('H', 'h ')
      .replace('M', 'm');
  }
  
  return duration;
};

// Get airline name from code
export const getAirlineName = (code: string): string => {
  const airlines: { [key: string]: string } = {
    // Major international airlines
    'EK': 'Emirates',
    'EY': 'Etihad Airways',
    'QR': 'Qatar Airways',
    'LH': 'Lufthansa',
    'BA': 'British Airways',
    'AF': 'Air France',
    'KL': 'KLM',
    'TK': 'Turkish Airlines',
    'SV': 'Saudia',
    'MS': 'EgyptAir',
    'RJ': 'Royal Jordanian',
    'ME': 'Middle East Airlines',
    'GF': 'Gulf Air',
    'WY': 'Oman Air',
    
    // Indian airlines
    'AI': 'Air India',
    'SG': 'SpiceJet',
    '6E': 'IndiGo',
    'UK': 'Vistara',
    'G8': 'Go First',
    'I5': 'AirAsia India',
    '9W': 'Jet Airways',
    
    // US airlines
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'UA': 'United Airlines',
    'WN': 'Southwest Airlines',
    'B6': 'JetBlue Airways',
    'AS': 'Alaska Airlines',
    
    // European airlines
    'FR': 'Ryanair',
    'U2': 'easyJet',
    'VY': 'Vueling',
    'W6': 'Wizz Air',
    'FB': 'Bulgaria Air',
    
    // Asian airlines
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'TG': 'Thai Airways',
    'MH': 'Malaysia Airlines',
    'NH': 'ANA',
    'JL': 'Japan Airlines',
    'KE': 'Korean Air',
    'OZ': 'Asiana Airlines',
    'CI': 'China Airlines',
    'BR': 'EVA Air',
    'CZ': 'China Southern',
    'MU': 'China Eastern',
    'CA': 'Air China'
  };
  
  return airlines[code] || `${code} Airlines`;
};

export default tripyverseAPI;