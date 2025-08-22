'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import BookingModal from '../../components/BookingModal';
import { tripyverseAPI, Hotel, HotelSearchParams, formatTripyverseCurrency } from '../../lib/tripyverse-api';
import { 
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  StarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  WifiIcon,
  HomeIcon,
  TruckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const HotelsPage: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [searchParams, setSearchParams] = useState<HotelSearchParams>({
    city_name: 'Mumbai',
    country_name: 'India',
    check_in_date: '',
    check_out_date: '',
    rooms: [
      {
        adults: 2,
        children: 0
      }
    ],
    nationality: 'IN',
    currency: 'USD',
    max_result: 25
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadPopularHotels();
  }, []);

  const loadPopularHotels = async () => {
    try {
      setLoading(true);
      
      // Load popular destinations with real TravelNext API
      const popularDestinations = [
        { city: 'Mumbai', country: 'India' },
        { city: 'Delhi', country: 'India' },
        { city: 'Bangalore', country: 'India' }
      ];
      
      // Get dates for search (7 days from now for better availability)
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 8);
      
      const checkInDate = checkIn.toISOString().split('T')[0];
      const checkOutDate = checkOut.toISOString().split('T')[0];
      
      let allHotels: Hotel[] = [];
      
      // Try to load hotels from each popular destination
      for (const destination of popularDestinations) {
        try {
          const result = await tripyverseAPI.hotels.search({
            city_name: destination.city,
            country_name: destination.country,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            rooms: [{ adults: 2, children: 0 }],
            nationality: 'IN',
            currency: 'USD',
            max_result: 25
          });
          
          if (result.success && result.hotels && result.hotels.length > 0) {
            // Take top 3 hotels from each destination
            allHotels = [...allHotels, ...result.hotels.slice(0, 3)];
            console.log(`✅ Loaded ${result.hotels.length} hotels from ${destination.city}`);
          }
        } catch (destinationError) {
          console.log(`⚠️ No hotels found for ${destination.city}, ${destination.country}`);
        }
      }
      
      if (allHotels.length > 0) {
        setHotels(allHotels);
        setIsSearchResult(false);
        setCurrentSearch('Popular Destinations - Live from TravelNext');
        console.log(`✅ Total hotels loaded: ${allHotels.length}`);
      } else {
        setHotels([]);
        setCurrentSearch('');
        console.log('❌ No hotels available from TravelNext API');
        toast.error('No hotels available. Please try a manual search.');
      }
      
    } catch (error) {
      console.error('Error loading popular hotels:', error);
      setHotels([]);
      toast.error('Failed to load hotels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.city_name || !searchParams.check_in_date || !searchParams.check_out_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    const checkIn = new Date(searchParams.check_in_date);
    const checkOut = new Date(searchParams.check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      toast.error('Check-in date cannot be in the past');
      return;
    }

    if (checkOut <= checkIn) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Searching TripyVerse hotels:', searchParams);
      
      // Search using real TravelNext API
      const result = await tripyverseAPI.hotels.search(searchParams);
      
      if (result.success && result.hotels && result.hotels.length > 0) {
        setHotels(result.hotels);
        setIsSearchResult(true);
        setSearchMetadata(result.search_metadata);
        setCurrentSearch(`${searchParams.city_name}, ${searchParams.country_name}`);
        toast.success(`Found ${result.hotels.length} real-time hotels via TravelNext!`);
        console.log(`✅ Found ${result.hotels.length} hotels from TravelNext API`);
      } else {
        setHotels([]);
        setIsSearchResult(true);
        setSearchMetadata(null);
        setCurrentSearch(`${searchParams.city_name}, ${searchParams.country_name}`);
        toast.error(result.error || `No hotels found for ${searchParams.city_name}. Try different dates or locations.`);
      }
      
    } catch (error: any) {
      console.error('🚫 TripyVerse hotel search error:', error);
      setHotels([]);
      setIsSearchResult(true);
      setCurrentSearch(`${searchParams.city_name}, ${searchParams.country_name}`);
      toast.error(error.message || 'Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setShowBookingModal(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-4 w-4 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  const updateRoomConfiguration = (adults: number, children: number) => {
    setSearchParams({
      ...searchParams,
      rooms: [{ adults, children }]
    });
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* TripyVerse Hero Header with Cosmic Theme */}
      <div className="relative hero-gradient py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float floating-element"></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="mobile-heading text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              Hotel Universe in 
              <span className="gradient-text-cosmic block">TripyVerse</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-3xl mx-auto animate-slide-up">
              🏨 Discover extraordinary accommodations across the universe with real-time availability and instant booking
            </p>
            <div className="mt-6 flex justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-700">Real-time Rates</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold text-gray-700">Instant Booking</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <GlobeAltIcon className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-gray-700">Global Hotels</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TripyVerse Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-16 relative z-20">
        <div className="glass-card mobile-card-perfect red-shadow animate-scale-in" style={{animationDelay: '0.3s'}}>
          <form onSubmit={handleSearch} className="space-y-6 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Destination</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  <input
                    type="text"
                    placeholder="City name (e.g. Mumbai)"
                    value={searchParams.city_name}
                    onChange={(e) => setSearchParams({...searchParams, city_name: e.target.value})}
                    className="input-field pl-12 hover:shadow-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  placeholder="Country (e.g. India)"
                  value={searchParams.country_name}
                  onChange={(e) => setSearchParams({...searchParams, country_name: e.target.value})}
                  className="input-field hover:shadow-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Check-in</label>
                <input
                  type="date"
                  value={searchParams.check_in_date}
                  onChange={(e) => setSearchParams({...searchParams, check_in_date: e.target.value})}
                  className="input-field hover:shadow-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Check-out</label>
                <input
                  type="date"
                  value={searchParams.check_out_date}
                  onChange={(e) => setSearchParams({...searchParams, check_out_date: e.target.value})}
                  className="input-field hover:shadow-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Adults</label>
                  <select
                    value={searchParams.rooms[0]?.adults || 2}
                    onChange={(e) => updateRoomConfiguration(parseInt(e.target.value), searchParams.rooms[0]?.children || 0)}
                    className="input-field text-sm hover:shadow-purple-500/20"
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Child</label>
                  <select
                    value={searchParams.rooms[0]?.children || 0}
                    onChange={(e) => updateRoomConfiguration(searchParams.rooms[0]?.adults || 2, parseInt(e.target.value))}
                    className="input-field text-sm hover:shadow-purple-500/20"
                  >
                    {[0,1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-mobile-perfect btn-glow flex items-center space-x-3 text-lg shadow-2xl red-glow btn-press bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span>{loading ? 'Searching Universe... 🏨' : 'Search Hotels 🏨'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hotel Results */}
      <div className="max-w-7xl mx-auto mobile-container section-spacing">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Available Hotels</h2>
          
          {isSearchResult && currentSearch && (
            <div className="glass-card inline-flex items-center space-x-4 px-6 py-3 mb-6 red-shadow animate-scale-in">
              <p className="text-sm text-gray-700 font-medium">Search results for: <span className="gradient-text-cosmic font-bold">{currentSearch}</span></p>
              <button
                onClick={() => {
                  setIsSearchResult(false);
                  setCurrentSearch('');
                  setSearchMetadata(null);
                  loadPopularHotels();
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
        ) : hotels.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <BuildingOffice2Icon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-600 text-xl font-medium">No hotels found in the universe. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {hotels.map((hotel, index) => (
              <div key={`${hotel.hotel_code}-${index}`} className="glass-card mobile-card card-hover red-shadow group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                {/* Hotel Image */}
                {hotel.images && hotel.images.length > 0 && (
                  <div className="relative h-64 mb-6 rounded-2xl overflow-hidden">
                    <img 
                      src={hotel.images[0]} 
                      alt={hotel.hotel_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                        {renderStars(hotel.rating)}
                        <span className="ml-2 text-sm font-bold text-gray-700">{hotel.rating}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hotel Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">{hotel.hotel_name}</h3>
                      <div className="flex items-center space-x-2 text-gray-600 mb-3">
                        <MapPinIcon className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{hotel.address}</span>
                      </div>
                      {hotel.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{hotel.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black gradient-text-cosmic">
                        {formatTripyverseCurrency(hotel.total_price, hotel.currency)}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">per night</p>
                    </div>
                  </div>

                  {/* Hotel Amenities */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.slice(0, 6).map((amenity, amenityIndex) => (
                        <span key={amenityIndex} className="inline-flex items-center bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 6 && (
                        <span className="inline-flex items-center bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                          +{hotel.amenities.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Room Information */}
                  {hotel.rooms && hotel.rooms.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">Available Rooms</h4>
                      <div className="space-y-2">
                        {hotel.rooms.slice(0, 2).map((room, roomIndex) => (
                          <div key={roomIndex} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{room.room_name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{room.board_type}</span>
                              <span className="font-bold text-purple-600">{formatTripyverseCurrency(room.price, room.currency)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handleBookHotel(hotel)}
                      className="btn-primary px-8 py-4 text-lg font-bold shadow-2xl red-glow w-full hover-lift btn-press group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>Book Hotel</span>
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
        item={selectedHotel}
        itemType="hotel"
      />
    </div>
  );
};

export default HotelsPage;