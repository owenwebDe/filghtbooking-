'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import BookingModal from '../../components/BookingModal';
import { tripyverseAPI, FlightOption, FlightSearchParams, formatTripyverseCurrency, formatFlightDuration, getAirlineName } from '../../lib/tripyverse-api';
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
  CheckCircleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const FlightsPage: React.FC = () => {
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: 'DEL',
    destination: 'BOM',
    departure_date: '',
    return_date: '',
    adults: 1,
    children: 0,
    infants: 0,
    journey_type: 'OneWay',
    class_type: 'Economy',
    currency: 'USD'
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadPopularFlights();
  }, []);

  const loadPopularFlights = async () => {
    try {
      setLoading(true);
      
      // Load popular routes with real TravelNext API
      const popularRoutes = [
        { origin: 'DEL', destination: 'BOM', route: 'Delhi → Mumbai' },
        { origin: 'BOM', destination: 'DEL', route: 'Mumbai → Delhi' },
        { origin: 'DEL', destination: 'BLR', route: 'Delhi → Bangalore' }
      ];
      
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];
      
      let allFlights: FlightOption[] = [];
      
      // Try to load flights from each popular route
      for (const route of popularRoutes) {
        try {
          const result = await tripyverseAPI.flights.search({
            origin: route.origin,
            destination: route.destination,
            departure_date: departureDate,
            adults: 1,
            children: 0,
            infants: 0,
            journey_type: 'OneWay',
            class_type: 'Economy',
            currency: 'USD'
          });
          
          if (result.success && result.flights && result.flights.length > 0) {
            // Take top 2 flights from each route
            allFlights = [...allFlights, ...result.flights.slice(0, 2)];
            console.log(`✅ Loaded ${result.flights.length} flights for ${route.route}`);
          }
        } catch (routeError) {
          console.log(`⚠️ No flights found for ${route.route}`);
        }
      }
      
      if (allFlights.length > 0) {
        setFlights(allFlights);
        setIsSearchResult(false);
        setCurrentSearch('Popular Routes - Live from TravelNext');
        console.log(`✅ Total flights loaded: ${allFlights.length}`);
      } else {
        setFlights([]);
        setCurrentSearch('');
        console.log('❌ No flights available from TravelNext API');
        toast.error('No flights available. Please try a manual search.');
      }
      
    } catch (error) {
      console.error('Error loading popular flights:', error);
      setFlights([]);
      toast.error('Failed to load flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.origin || !searchParams.destination || !searchParams.departure_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Searching TripyVerse flights:', searchParams);
      
      // Search using real TravelNext API
      const result = await tripyverseAPI.flights.search(searchParams);
      
      if (result.success && result.flights && result.flights.length > 0) {
        setFlights(result.flights);
        setIsSearchResult(true);
        setSearchMetadata(result.search_metadata);
        setCurrentSearch(`${searchParams.origin} → ${searchParams.destination}`);
        toast.success(`Found ${result.flights.length} real-time flights via TravelNext!`);
        console.log(`✅ Found ${result.flights.length} flights from TravelNext API`);
      } else {
        setFlights([]);
        setIsSearchResult(true);
        setSearchMetadata(null);
        setCurrentSearch(`${searchParams.origin} → ${searchParams.destination}`);
        toast.error(result.error || `No flights found for ${searchParams.origin} → ${searchParams.destination}. Try different dates or airports.`);
      }
      
    } catch (error: any) {
      console.error('🚫 TripyVerse search error:', error);
      setFlights([]);
      setIsSearchResult(true);
      setCurrentSearch(`${searchParams.origin} → ${searchParams.destination}`);
      toast.error(error.message || 'Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookFlight = (flight: FlightOption) => {
    setSelectedFlight(flight);
    setShowBookingModal(true);
  };

  const formatTime = (timeString: string) => {
    if (timeString.includes('T')) {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return timeString;
  };

  const getMainSegment = (flight: FlightOption) => {
    return flight.segments?.[0] || {
      departure_airport: flight.segments?.[0]?.departure_airport || 'N/A',
      arrival_airport: flight.segments?.[0]?.arrival_airport || 'N/A',
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
      airline_code: flight.airline_code,
      flight_number: flight.segments?.[0]?.flight_number || 'N/A'
    };
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* TripyVerse Hero Header with Cosmic Theme */}
      <div className="relative hero-gradient py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float floating-element"></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="mobile-heading text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              Welcome to 
              <span className="gradient-text-red block">TripyVerse</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-3xl mx-auto animate-slide-up">
              🌟 Discover your ultimate travel universe with real-time flights, instant booking, and global connectivity
            </p>
            <div className="mt-6 flex justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-700">Real-time Pricing</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold text-gray-700">Instant Confirmation</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <GlobeAltIcon className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-gray-700">Global Coverage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TripyVerse Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-16 relative z-20">
        <div className="glass-card mobile-card-perfect red-shadow animate-scale-in" style={{animationDelay: '0.3s'}}>
          <form onSubmit={handleSearch} className="space-y-6 p-8">
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="inline-flex items-center cursor-pointer group">
                <input
                  type="radio"
                  value="OneWay"
                  checked={searchParams.journey_type === 'OneWay'}
                  onChange={(e) => setSearchParams({...searchParams, journey_type: e.target.value as any})}
                  className="form-radio text-purple-600 h-5 w-5"
                />
                <span className="ml-3 font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">One way</span>
              </label>
              <label className="inline-flex items-center cursor-pointer group">
                <input
                  type="radio"
                  value="Return"
                  checked={searchParams.journey_type === 'Return'}
                  onChange={(e) => setSearchParams({...searchParams, journey_type: e.target.value as any})}
                  className="form-radio text-purple-600 h-5 w-5"
                />
                <span className="ml-3 font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">Round trip</span>
              </label>
            </div>

            {/* Main Flight Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* From Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">From</label>
                <div className="relative">
                  <PaperAirplaneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                  <input
                    type="text"
                    placeholder="Origin (e.g. DEL)"
                    value={searchParams.origin}
                    onChange={(e) => setSearchParams({...searchParams, origin: e.target.value})}
                    className="input-field pl-12 hover:shadow-purple-500/20"
                  />
                </div>
              </div>

              {/* To Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">To</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                  <input
                    type="text"
                    placeholder="Destination (e.g. BOM)"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                    className="input-field pl-12 hover:shadow-purple-500/20"
                  />
                </div>
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Departure</label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                  <input
                    type="date"
                    value={searchParams.departure_date}
                    onChange={(e) => setSearchParams({...searchParams, departure_date: e.target.value})}
                    className="input-field pl-12 hover:shadow-purple-500/20"
                  />
                </div>
              </div>

              {/* Return Date (conditional) */}
              {searchParams.journey_type === 'Return' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Return</label>
                  <div className="relative">
                    <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                    <input
                      type="date"
                      value={searchParams.return_date || ''}
                      onChange={(e) => setSearchParams({...searchParams, return_date: e.target.value})}
                      className="input-field pl-12 hover:shadow-purple-500/20"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Class</label>
                  <select
                    value={searchParams.class_type}
                    onChange={(e) => setSearchParams({...searchParams, class_type: e.target.value})}
                    className="input-field hover:shadow-purple-500/20"
                  >
                    <option value="Economy">Economy</option>
                    <option value="PremiumEconomy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First Class</option>
                  </select>
                </div>
              )}
            </div>

            {/* Passengers and Class Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Passengers Section */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
                <UserGroupIcon className="h-6 w-6 text-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-700 mb-2">Passengers</div>
                  <div className="text-xs text-gray-600">
                    {searchParams.adults + searchParams.children + searchParams.infants} passenger{(searchParams.adults + searchParams.children + searchParams.infants) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Adults */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adults (12+)</label>
                <select
                  value={searchParams.adults}
                  onChange={(e) => setSearchParams({...searchParams, adults: parseInt(e.target.value)})}
                  className="input-field hover:shadow-purple-500/20"
                >
                  {[1,2,3,4,5,6,7,8,9].map(num => (
                    <option key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Children */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Children (2-11)</label>
                <select
                  value={searchParams.children}
                  onChange={(e) => setSearchParams({...searchParams, children: parseInt(e.target.value)})}
                  className="input-field hover:shadow-purple-500/20"
                >
                  {[0,1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                  ))}
                </select>
              </div>

              {/* Infants or Class based on trip type */}
              {searchParams.journey_type === 'Return' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Class</label>
                  <select
                    value={searchParams.class_type}
                    onChange={(e) => setSearchParams({...searchParams, class_type: e.target.value})}
                    className="input-field hover:shadow-purple-500/20"
                  >
                    <option value="Economy">Economy</option>
                    <option value="PremiumEconomy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First Class</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Infants (0-2)</label>
                  <select
                    value={searchParams.infants}
                    onChange={(e) => setSearchParams({...searchParams, infants: parseInt(e.target.value)})}
                    className="input-field hover:shadow-purple-500/20"
                  >
                    {[0,1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Infant' : 'Infants'}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-mobile-perfect btn-glow flex items-center space-x-3 text-lg shadow-2xl red-glow btn-press bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span>{loading ? 'Searching Universe... 🚀' : 'Search TripyVerse 🚀'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Flight Results */}
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
                  setSearchMetadata(null);
                  loadPopularFlights();
                }}
                className="btn-outline px-4 py-1 text-xs hover-lift"
              >
                Clear search
              </button>
            </div>
          )}
          
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Searching the TripyVerse...</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <PaperAirplaneIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-600 text-xl font-medium">No flights found in the universe. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {flights.map((flight, index) => {
              const mainSegment = getMainSegment(flight);
              return (
                <div key={`${flight.fare_source_code}-${index}`} className="glass-card mobile-card card-hover red-shadow group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0">
                    {/* Flight Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 red-gradient-bg rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg animate-pulse-red">
                            {flight.airline_code || flight.airline_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">{getAirlineName(flight.airline_code) || flight.airline_name}</h3>
                            <p className="gradient-text-red font-bold">
                              {mainSegment.flight_number || `${flight.airline_code}${Math.floor(Math.random() * 1000)}`}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{flight.fare_type}</span>
                              {flight.is_refundable && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-semibold">Refundable</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black gradient-text-red">
                            {formatTripyverseCurrency(flight.total_amount, flight.currency)}
                          </div>
                          <p className="text-sm text-gray-600 font-medium">per person</p>
                          {flight.passenger_fares && flight.passenger_fares.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Base: {formatTripyverseCurrency(flight.passenger_fares[0].base_fare, flight.currency)} + 
                              Tax: {formatTripyverseCurrency(flight.passenger_fares[0].taxes, flight.currency)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Route and Times */}
                      <div className="flex items-center justify-between subtle-cosmic-gradient rounded-2xl p-6 hover-lift">
                        <div className="text-center">
                          <div className="text-2xl font-black text-gray-900">{formatTime(flight.departure_time)}</div>
                          <div className="text-lg font-bold text-purple-600">{mainSegment.departure_airport}</div>
                          <div className="text-sm text-gray-600">Departure</div>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center space-x-4">
                          <div className="h-px bg-purple-300 flex-1"></div>
                          <div className="bg-white p-3 rounded-full shadow-lg red-shadow">
                            <div className="text-center">
                              <ClockIcon className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                              <div className="text-sm font-bold text-gray-700">{formatFlightDuration(flight.total_duration)}</div>
                            </div>
                          </div>
                          <div className="h-px bg-purple-300 flex-1"></div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-black text-gray-900">{formatTime(flight.arrival_time)}</div>
                          <div className="text-lg font-bold text-purple-600">{mainSegment.arrival_airport}</div>
                          <div className="text-sm text-gray-600">Arrival</div>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-purple-200 hover-lift">
                          <GlobeAltIcon className="h-4 w-4 text-purple-500" />
                          <span className="font-bold text-gray-700">{flight.booking_class} Class</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-purple-200 hover-lift">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          <span className="font-bold text-gray-700">
                            {flight.total_stops === 0 ? 'Direct flight' : `${flight.total_stops} stop${flight.total_stops > 1 ? 's' : ''}`}
                          </span>
                        </div>

                        {flight.baggage_info && flight.baggage_info.length > 0 && (
                          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                            <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />
                            <span className="font-bold text-blue-700">Baggage: {flight.baggage_info[0]}</span>
                          </div>
                        )}
                      </div>
                      
                      {flight.segments && flight.segments.length > 1 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Flight Segments:</p>
                          <div className="space-y-2">
                            {flight.segments.map((segment, segIndex) => (
                              <div key={segIndex} className="flex items-center text-xs text-gray-600">
                                <span>{segment.departure_airport} → {segment.arrival_airport}</span>
                                <span className="mx-2">•</span>
                                <span>{segment.airline_name} {segment.flight_number}</span>
                                <span className="mx-2">•</span>
                                <span>{formatFlightDuration(segment.duration)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Button */}
                    <div className="lg:ml-8">
                      <button
                        onClick={() => handleBookFlight(flight)}
                        className="btn-primary px-8 py-4 text-lg font-bold shadow-2xl red-glow w-full lg:w-auto hover-lift btn-press group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <span>Book Flight</span>
                          <ArrowRightIcon className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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