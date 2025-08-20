'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import BookingModal from '../../components/BookingModal';
import { flightsAPI } from '../../lib/api';
import { realFlightAPI, DUBAI_LOCATIONS, formatAEDCurrency } from '../../lib/travel-apis';
import { 
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  CheckCircleIcon
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
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [searchParams, setSearchParams] = useState({
    from: 'DXB',
    to: '',
    departure_date: '',
    return_date: '',
    passengers: '1',
    trip_type: 'one-way'
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setLoading(true);
      
      // Try backend API first
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
    setSelectedFlight(flight);
    setShowBookingModal(true);
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
    if (timeString.includes('T') || timeString.includes(':')) {
      if (timeString.includes('T')) {
        return new Date(timeString).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return timeString;
      }
    }
    return timeString;
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
    <div className="min-h-screen bg-white">
      
      {/* Modern Hero Header with Red Theme */}
      <div className="relative hero-gradient py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float floating-element"></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-6 py-3 rounded-full text-sm font-bold shadow-lg mb-6 animate-pulse-red">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Premium Flight Booking Experience
            </div>
            <h1 className="mobile-heading text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              Discover Your Next 
              <span className="gradient-text-red block">Adventure</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-2xl mx-auto animate-slide-up">
              ✈️ Explore the world with premium flights and unbeatable prices
            </p>
          </div>
        </div>
      </div>

      {/* Modern Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-16 relative z-20">
        <div className="glass-card mobile-card-perfect red-shadow animate-scale-in" style={{animationDelay: '0.3s'}}>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="inline-flex items-center cursor-pointer group">
                <input
                  type="radio"
                  value="one-way"
                  checked={searchParams.trip_type === 'one-way'}
                  onChange={(e) => setSearchParams({...searchParams, trip_type: e.target.value})}
                  className="form-radio text-red-600 h-5 w-5"
                />
                <span className="ml-3 font-semibold text-gray-700 group-hover:text-red-600 transition-colors">One way</span>
              </label>
              <label className="inline-flex items-center cursor-pointer group">
                <input
                  type="radio"
                  value="round-trip"
                  checked={searchParams.trip_type === 'round-trip'}
                  onChange={(e) => setSearchParams({...searchParams, trip_type: e.target.value})}
                  className="form-radio text-red-600 h-5 w-5"
                />
                <span className="ml-3 font-semibold text-gray-700 group-hover:text-red-600 transition-colors">Round trip</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">From</label>
                <div className="relative">
                  <PaperAirplaneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  <input
                    type="text"
                    placeholder="Departure city (e.g. DXB)"
                    value={searchParams.from}
                    onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                    className="input-field pl-12 hover:shadow-red-500/20"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">To</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  <input
                    type="text"
                    placeholder="Destination city (e.g. LHR)"
                    value={searchParams.to}
                    onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                    className="input-field pl-12 hover:shadow-red-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Departure</label>
                <input
                  type="date"
                  value={searchParams.departure_date}
                  onChange={(e) => setSearchParams({...searchParams, departure_date: e.target.value})}
                  className="input-field hover:shadow-red-500/20"
                />
              </div>

              {searchParams.trip_type === 'round-trip' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Return</label>
                  <input
                    type="date"
                    value={searchParams.return_date}
                    onChange={(e) => setSearchParams({...searchParams, return_date: e.target.value})}
                    className="input-field hover:shadow-red-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Passengers</label>
                <select
                  value={searchParams.passengers}
                  onChange={(e) => setSearchParams({...searchParams, passengers: e.target.value})}
                  className="input-field hover:shadow-red-500/20"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'passenger' : 'passengers'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-mobile-perfect btn-glow flex items-center space-x-3 text-lg shadow-2xl red-glow btn-press"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span>{loading ? 'Searching Flights... ✈️' : 'Search Flights ✈️'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modern Flight Results */}
      <div className="max-w-7xl mx-auto mobile-container section-spacing">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Available Flights</h2>
          
          {isSearchResult && currentSearch && (
            <div className="glass-card inline-flex items-center space-x-4 px-6 py-3 mb-6 red-shadow animate-scale-in">
              <p className="text-sm text-gray-700 font-medium">Search results for: <span className="gradient-text-red font-bold">{currentSearch}</span></p>
              <button
                onClick={() => {
                  setIsSearchResult(false);
                  setCurrentSearch('');
                  loadFlights();
                }}
                className="btn-outline px-4 py-1 text-xs hover-lift"
              >
                Clear search
              </button>
            </div>
          )}
          
          <div className="inline-flex items-center bg-red-100 text-gray-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg red-shadow">
            ✈️ Premium airlines with worldwide destinations
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Searching for flights...</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <PaperAirplaneIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-600 text-xl font-medium">No flights found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {flights.map((flight, index) => (
              <div key={flight.id} className="glass-card mobile-card card-hover red-shadow group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0">
                  {/* Flight Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 red-gradient-bg rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg animate-pulse-red">
                          {flight.airline.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">{flight.airline}</h3>
                          <p className="gradient-text-red font-bold">{flight.flight_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black gradient-text-red">
                          {formatAEDCurrency(flight.price)}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">per person</p>
                      </div>
                    </div>

                    {/* Route and Times */}
                    <div className="flex items-center justify-between subtle-red-gradient rounded-2xl p-6 hover-lift">
                      <div className="text-center">
                        <div className="text-2xl font-black text-gray-900">{formatTime(flight.departure_time)}</div>
                        <div className="text-lg font-bold text-red-600">{getAirportCode(flight, 'departure')}</div>
                        <div className="text-sm text-gray-600">{getAirportCity(flight, 'departure')}</div>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center space-x-4">
                        <div className="h-px bg-red-300 flex-1"></div>
                        <div className="bg-white p-3 rounded-full shadow-lg red-shadow">
                          <div className="text-center">
                            <ClockIcon className="h-5 w-5 text-red-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-700">{formatDuration(flight)}</div>
                          </div>
                        </div>
                        <div className="h-px bg-red-300 flex-1"></div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-black text-gray-900">{formatTime(flight.arrival_time)}</div>
                        <div className="text-lg font-bold text-red-600">{getAirportCode(flight, 'arrival')}</div>
                        <div className="text-sm text-gray-600">{getAirportCity(flight, 'arrival')}</div>
                      </div>
                    </div>

                    {/* Flight Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-red-200 hover-lift">
                        <GlobeAltIcon className="h-4 w-4 text-red-500" />
                        <span className="font-bold text-gray-700">{flight.aircraft || flight.aircraft_type || 'Boeing 777'}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-red-200 hover-lift">
                        <UserGroupIcon className="h-4 w-4 text-red-500" />
                        <span className="font-bold text-gray-700">{flight.available_seats} seats available</span>
                      </div>
                      {flight.stops !== undefined && (
                        <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full border border-green-200">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-green-700">
                            {flight.stops === 0 ? 'Direct flight' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="lg:ml-8">
                    <button
                      onClick={() => handleBookFlight(flight)}
                      className="btn-primary px-8 py-4 text-lg font-bold shadow-2xl red-glow w-full lg:w-auto hover-lift btn-press group"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>Book Flight</span>
                        <ArrowRightIcon className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        item={selectedFlight}
        itemType="flight"
      />
    </div>
  );
};

export default FlightsPage;