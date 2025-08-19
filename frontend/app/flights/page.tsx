'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import { flightsAPI } from '../../lib/api';
import { realFlightAPI, DUBAI_AIRPORTS, POPULAR_DESTINATIONS_FROM_DUBAI, formatAEDCurrency } from '../../lib/travel-apis';
import { 
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Flight {
  id: string;
  airline: string;
  airline_code?: string;
  flight_number: string;
  aircraft?: string;
  departure_airport?: string;
  arrival_airport?: string;
  from?: string;
  to?: string;
  from_city?: string;
  to_city?: string;
  departure_time: string;
  arrival_time: string;
  duration?: string;
  price: number;
  currency?: string;
  class?: string;
  available_seats: number;
  aircraft_type?: string;
  duration_minutes?: number;
  stops?: number;
  baggage?: string;
}

const FlightsPage: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false); // Track if showing search results
  const [currentSearch, setCurrentSearch] = useState<string>(''); // Track current search route
  const [searchParams, setSearchParams] = useState({
    from: 'DXB', // Default to Dubai International Airport
    to: '',
    departure_date: '',
    return_date: '',
    passengers: '1',
    trip_type: 'one-way'
  });
  const [airportSuggestions, setAirportSuggestions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setLoading(true);
      console.log('🛫 Loading popular flights from backend...');
      
      // Try to get popular flights from backend first
      try {
        const backendFlights = await realFlightAPI.getPopularFlights();
        if (backendFlights && backendFlights.length > 0) {
          setFlights(backendFlights);
          setIsSearchResult(false);
          setCurrentSearch('Popular Routes');
          console.log(`✅ Loaded ${backendFlights.length} flights from backend`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend popular flights not available, trying external APIs...');
      }
      
      // Fallback: Try real-time APIs for popular routes
      const popularRoutes = [
        { from: 'DXB', to: 'LHR', city: 'London' },
        { from: 'DXB', to: 'JFK', city: 'New York' },
        { from: 'DXB', to: 'BOM', city: 'Mumbai' }
      ];
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];
      
      let allRealFlights: Flight[] = [];
      
      for (const route of popularRoutes) {
        try {
          const realFlights = await realFlightAPI.searchFlights({
            from: route.from,
            to: route.to,
            departureDate: departureDate,
            passengers: 1
          });
          
          if (realFlights.data && realFlights.data.length > 0) {
            const transformedFlights = realFlights.data.slice(0, 2).map((offer: any, index: number) => {
              const segment = offer.itineraries?.[0]?.segments?.[0];
              const airline = segment?.carrierCode || 'XX';
              
              return {
                id: offer.id || `amadeus-${route.from}-${route.to}-${index}`,
                airline: getAirlineName(airline),
                airline_code: airline,
                flight_number: `${airline}${segment?.number || '000'}`,
                aircraft: segment?.aircraft?.code || 'Commercial Aircraft',
                from: route.from,
                to: route.to,
                from_city: 'Dubai',
                to_city: route.city,
                departure_time: segment?.departure?.at?.split('T')[1]?.substring(0, 5) || '00:00',
                arrival_time: segment?.arrival?.at?.split('T')[1]?.substring(0, 5) || '00:00',
                duration: offer.itineraries?.[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || '---',
                price: Math.round(parseFloat(offer.price?.total || '0')),
                currency: 'AED',
                class: 'Economy',
                available_seats: offer.numberOfBookableSeats || Math.floor(Math.random() * 50) + 10,
                stops: (segment?.numberOfStops || 0),
                baggage: '23kg checked, 8kg cabin'
              };
            });
            
            allRealFlights = [...allRealFlights, ...transformedFlights];
          }
        } catch (routeError) {
          console.log(`⚠️ No external API flights found for ${route.from} → ${route.to}`);
        }
      }
      
      if (allRealFlights.length > 0) {
        setFlights(allRealFlights);
        setIsSearchResult(false);
        setCurrentSearch('Popular Routes (Live)');
        console.log(`✅ Loaded ${allRealFlights.length} real flights from external APIs`);
      } else {
        // No flights found at all
        setFlights([]);
        setIsSearchResult(false);
        setCurrentSearch('');
        console.log('❌ No flights available from any source');
        toast.error('No flights available. Please try again later or contact support.');
      }
      
    } catch (error) {
      console.error('Error loading flights:', error);
      setFlights([]);
      toast.error('Failed to load flights. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.from || !searchParams.to || !searchParams.departure_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Searching flights:', searchParams);
      
      // First try backend API search
      try {
        const backendResults = await flightsAPI.search(searchParams);
        if (backendResults.data && backendResults.data.length > 0) {
          setFlights(backendResults.data);
          setIsSearchResult(true);
          setCurrentSearch(`${searchParams.from} → ${searchParams.to}`);
          toast.success(`Found ${backendResults.data.length} flights from our inventory`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend search failed, trying external APIs...');
      }
      
      // Try external APIs (Amadeus)
      try {
        const realFlights = await realFlightAPI.searchFlights({
          from: searchParams.from,
          to: searchParams.to,
          departureDate: searchParams.departure_date,
          returnDate: searchParams.trip_type === 'round-trip' ? searchParams.return_date : undefined,
          passengers: parseInt(searchParams.passengers)
        });
        
        if (realFlights.data && realFlights.data.length > 0) {
          console.log('✅ External API flights found:', realFlights.data.length);
          
          // Transform external API data to our format
          const transformedFlights = realFlights.data.map((offer: any, index: number) => {
            const segment = offer.itineraries?.[0]?.segments?.[0];
            const airline = segment?.carrierCode || 'XX';
            
            return {
              id: offer.id || `external-${index}`,
              airline: getAirlineName(airline),
              airline_code: airline,
              flight_number: `${airline}${segment?.number || '000'}`,
              aircraft: segment?.aircraft?.code || 'Commercial Aircraft',
              from: searchParams.from,
              to: searchParams.to,
              from_city: searchParams.from,
              to_city: searchParams.to,
              departure_time: segment?.departure?.at?.split('T')[1]?.substring(0, 5) || '00:00',
              arrival_time: segment?.arrival?.at?.split('T')[1]?.substring(0, 5) || '00:00',
              duration: offer.itineraries?.[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || '---',
              price: Math.round(parseFloat(offer.price?.total || '0')),
              currency: 'AED',
              class: 'Economy',
              available_seats: offer.numberOfBookableSeats || 10,
              stops: (segment?.numberOfStops || 0),
              baggage: '23kg checked, 8kg cabin'
            };
          });
          
          setFlights(transformedFlights);
          setIsSearchResult(true);
          setCurrentSearch(`${searchParams.from} → ${searchParams.to}`);
          toast.success(`Found ${transformedFlights.length} flights from external partners`);
          return;
        }
      } catch (externalError) {
        console.log('⚠️ External API search also failed');
      }
      
      // No flights found from any source
      setFlights([]);
      setIsSearchResult(true);
      setCurrentSearch(`${searchParams.from} → ${searchParams.to}`);
      toast.error(`No flights found for ${searchParams.from} → ${searchParams.to}. Try different dates or airports.`);
      
    } catch (error) {
      console.error('🚫 Search error:', error);
      setFlights([]);
      setIsSearchResult(true);
      setCurrentSearch(`${searchParams.from} → ${searchParams.to}`);
      toast.error('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get airline names
  const getAirlineName = (code: string): string => {
    const airlines: { [key: string]: string } = {
      'EK': 'Emirates',
      'EY': 'Etihad Airways', 
      'FZ': 'flydubai',
      'QR': 'Qatar Airways',
      'LH': 'Lufthansa',
      'BA': 'British Airways',
      'AF': 'Air France',
      'KL': 'KLM',
      'TK': 'Turkish Airlines',
      'SV': 'Saudia',
      'MS': 'EgyptAir',
      'AI': 'Air India'
    };
    return airlines[code] || `Airline ${code}`;
  };

  const handleBookFlight = (flight: Flight) => {
    // Store flight data and redirect to booking
    localStorage.setItem('selected_flight', JSON.stringify(flight));
    router.push(`/booking/flight/${flight.id}`);
  };

  const formatDuration = (flight: Flight) => {
    if (flight.duration) return flight.duration;
    if (flight.duration_minutes) {
      const hours = Math.floor(flight.duration_minutes / 60);
      const mins = flight.duration_minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return '---';
  };

  const formatTime = (timeString: string) => {
    // Handle both ISO datetime strings and simple time strings
    if (timeString.includes('T') || timeString.includes(':')) {
      if (timeString.includes('T')) {
        return new Date(timeString).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return timeString; // Already in HH:MM format
      }
    }
    return timeString;
  };

  const formatDate = (dateString: string) => {
    if (dateString && dateString.includes('T')) {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    return 'Today'; // Default for our sample data
  };

  const getAirportCode = (flight: Flight, type: 'departure' | 'arrival') => {
    if (type === 'departure') {
      return flight.from || flight.departure_airport || 'DXB';
    } else {
      return flight.to || flight.arrival_airport || '---';
    }
  };

  const getAirportCity = (flight: Flight, type: 'departure' | 'arrival') => {
    if (type === 'departure') {
      return flight.from_city || 'Dubai';
    } else {
      return flight.to_city || '---';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Modern Header with Yellow Theme */}
      <div className="bg-gradient-to-r from-white via-yellow-50 to-white py-16 relative overflow-hidden">
        <div className="absolute top-10 left-20 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center">
            <h1 className="mobile-heading text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Find Your Perfect 
              <span className="text-yellow-600">Flight</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              ✈️ Search and book flights to destinations worldwide with real-time prices
            </p>
          </div>
        </div>
      </div>

      {/* Modern Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-12">
        <div className="glass-card mobile-card-perfect yellow-shadow">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="one-way"
                  checked={searchParams.trip_type === 'one-way'}
                  onChange={(e) => setSearchParams({...searchParams, trip_type: e.target.value})}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">One way</span>
              </label>
              <label className="inline-flex items-center ml-4">
                <input
                  type="radio"
                  value="round-trip"
                  checked={searchParams.trip_type === 'round-trip'}
                  onChange={(e) => setSearchParams({...searchParams, trip_type: e.target.value})}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Round trip</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select
                  value={searchParams.from}
                  onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select departure airport</option>
                  {Object.values(DUBAI_AIRPORTS).map(airport => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  value={searchParams.to}
                  onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select destination</option>
                  {POPULAR_DESTINATIONS_FROM_DUBAI.map(dest => (
                    <option key={dest.code} value={dest.code}>
                      {dest.code} - {dest.city}, {dest.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                <input
                  type="date"
                  value={searchParams.departure_date}
                  onChange={(e) => setSearchParams({...searchParams, departure_date: e.target.value})}
                  className="input-field"
                />
              </div>

              {searchParams.trip_type === 'round-trip' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                  <input
                    type="date"
                    value={searchParams.return_date}
                    onChange={(e) => setSearchParams({...searchParams, return_date: e.target.value})}
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                <select
                  value={searchParams.passengers}
                  onChange={(e) => setSearchParams({...searchParams, passengers: e.target.value})}
                  className="input-field"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'passenger' : 'passengers'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-mobile-perfect flex items-center space-x-3 text-lg shadow-2xl yellow-glow"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span>{loading ? 'Searching... ✈️' : 'Search Flights ✈️'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modern Flight Results */}
      <div className="max-w-7xl mx-auto mobile-container section-spacing">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Available Flights</h2>
          
          {isSearchResult && currentSearch && (
            <div className="glass-card inline-flex items-center space-x-4 px-6 py-3 mb-4">
              <p className="text-sm text-gray-700 font-medium">Search results for: <span className="text-yellow-600 font-bold">{currentSearch}</span></p>
              <button
                onClick={() => {
                  setIsSearchResult(false);
                  setCurrentSearch('');
                  loadFlights();
                }}
                className="btn-outline px-4 py-1 text-xs"
              >
                Clear search
              </button>
            </div>
          )}
          
          {!isSearchResult && (
            <p className="text-gray-600 font-medium mb-4">Popular routes from Dubai</p>
          )}
          
          <div className="inline-flex items-center bg-yellow-100 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🛫 Real-time via Amadeus API
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for flights...</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-12">
            <PaperAirplaneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No flights found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {flights.map((flight) => (
              <div key={flight.id} className="glass-card mobile-card card-hover yellow-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-8">
                    {/* Airline & Flight Number */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                          <PaperAirplaneIcon className="h-4 w-4 text-gray-900" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">{flight.airline}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">{flight.flight_number}</p>
                      <p className="text-xs text-gray-500 mb-1">{flight.aircraft || flight.aircraft_type || 'Commercial Aircraft'}</p>
                      {flight.class && (
                        <div className="inline-block bg-yellow-100 text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                          {flight.class}
                        </div>
                      )}
                    </div>

                    {/* Route & Times */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{formatTime(flight.departure_time)}</p>
                          <p className="text-sm text-gray-600">{getAirportCode(flight, 'departure')}</p>
                          <p className="text-xs text-gray-500">{getAirportCity(flight, 'departure')}</p>
                        </div>
                        
                        <div className="flex-1 mx-4">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center">
                              <span className="bg-white px-2 text-xs text-gray-500 flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatDuration(flight)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{formatTime(flight.arrival_time)}</p>
                          <p className="text-sm text-gray-600">{getAirportCode(flight, 'arrival')}</p>
                          <p className="text-xs text-gray-500">{getAirportCity(flight, 'arrival')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price & Seats */}
                    <div className="text-center lg:text-right">
                      <div className="mb-3">
                        <div className="text-yellow-600 text-3xl font-black mb-1">
                          {formatAEDCurrency(flight.price)}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">per person</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center lg:justify-end space-x-2 text-sm">
                          <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <UserGroupIcon className="h-2.5 w-2.5 text-gray-900" />
                          </div>
                          <span className="font-semibold text-gray-700">{flight.available_seats} seats left</span>
                        </div>
                        {flight.stops !== undefined && (
                          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                            {flight.stops === 0 ? '✓ Direct flight' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </div>
                        )}
                        {flight.baggage && (
                          <p className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">{flight.baggage}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="mt-6 lg:mt-0 lg:ml-6">
                    <button
                      onClick={() => handleBookFlight(flight)}
                      className="btn-primary w-full lg:w-auto px-8 py-4 text-lg font-bold shadow-2xl yellow-glow"
                    >
                      Book Flight ✈️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default FlightsPage;