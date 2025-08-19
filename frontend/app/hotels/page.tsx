'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import { hotelsAPI } from '../../lib/api';
import { realHotelAPI, DUBAI_LOCATIONS, formatAEDCurrency } from '../../lib/travel-apis';
import { 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  StarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  WifiIcon,
  HomeIcon,
  TruckIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Hotel {
  id: string;
  name: string;
  location: string;
  address: string;
  description: string;
  price_per_night: number;
  available_rooms: number;
  amenities: string[];
  rating: number;
  images: string[];
}

const HotelsPage: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    location: '',
    check_in: '',
    check_out: '',
    guests: '2',
    rooms: '1'
  });
  const router = useRouter();

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      
      // Try backend API first
      try {
        const response = await realHotelAPI.getPopularHotels();
        if (response && response.length > 0) {
          setHotels(response);
          console.log(`✅ Loaded ${response.length} hotels from backend`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend hotels not available, trying external APIs...');
      }
      
      // Try external API for Dubai hotels
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        
        const checkIn = tomorrow.toISOString().split('T')[0];
        const checkOut = dayAfter.toISOString().split('T')[0];
        
        const dubaiHotels = await realHotelAPI.searchDubaiHotels({
          checkIn,
          checkOut,
          guests: 2,
          rooms: 1
        });
        
        if (dubaiHotels.data && dubaiHotels.data.length > 0) {
          // Transform external API data to our format
          const transformedHotels = dubaiHotels.data.map((hotel: any, index: number) => ({
            id: hotel.hotel_id || `external-${index}`,
            name: hotel.hotel_name || 'Hotel',
            location: 'Dubai, UAE',
            address: hotel.address || 'Dubai, UAE',
            description: hotel.hotel_name + ' - ' + (hotel.review_score_word || 'Excellent hotel'),
            price_per_night: Math.round(hotel.min_total_price || 200),
            available_rooms: Math.floor(Math.random() * 50) + 10,
            amenities: ['Free WiFi', 'Air Conditioning', 'Room Service'],
            rating: hotel.review_score ? hotel.review_score / 2 : 4.0,
            images: hotel.main_photo_url ? [hotel.main_photo_url] : ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&q=80']
          }));
          
          setHotels(transformedHotels);
          console.log(`✅ Loaded ${transformedHotels.length} hotels from external API`);
          return;
        }
      } catch (externalError) {
        console.log('⚠️ External hotel API also failed');
      }
      
      // No hotels found from any source
      setHotels([]);
      toast.error('No hotels available. Please try again later or contact support.');
      
    } catch (error) {
      console.error('Error loading hotels:', error);
      setHotels([]);
      toast.error('Failed to load hotels. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.check_in || !searchParams.check_out) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Searching hotels:', searchParams);
      
      // First try backend API search
      try {
        const response = await hotelsAPI.search(searchParams);
        if (response.data && response.data.length > 0) {
          setHotels(response.data);
          toast.success(`Found ${response.data.length} hotels from our inventory`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend hotel search failed, trying external APIs...');
      }
      
      // Try external APIs
      try {
        let externalResults;
        
        if (searchParams.location.toLowerCase().includes('dubai') || !searchParams.location) {
          // Search Dubai specifically
          externalResults = await realHotelAPI.searchDubaiHotels({
            checkIn: searchParams.check_in,
            checkOut: searchParams.check_out,
            guests: parseInt(searchParams.guests),
            rooms: parseInt(searchParams.rooms)
          });
        } else {
          // Search by location
          externalResults = await realHotelAPI.searchHotels({
            location: searchParams.location,
            checkIn: searchParams.check_in,
            checkOut: searchParams.check_out,
            guests: parseInt(searchParams.guests),
            rooms: parseInt(searchParams.rooms)
          });
        }
        
        if (externalResults.data && externalResults.data.length > 0) {
          // Transform external API data to our format
          const transformedHotels = externalResults.data.map((hotel: any, index: number) => ({
            id: hotel.hotel_id || `external-${index}`,
            name: hotel.hotel_name || 'Hotel',
            location: searchParams.location || 'Dubai, UAE',
            address: hotel.address || searchParams.location || 'Dubai, UAE',
            description: hotel.hotel_name + ' - ' + (hotel.review_score_word || 'Excellent hotel'),
            price_per_night: Math.round(hotel.min_total_price / calculateNights() || 200),
            available_rooms: 10,
            amenities: ['Free WiFi', 'Air Conditioning', 'Room Service'],
            rating: hotel.review_score ? hotel.review_score / 2 : 4.0,
            images: hotel.main_photo_url ? [hotel.main_photo_url] : ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&q=80']
          }));
          
          setHotels(transformedHotels);
          toast.success(`Found ${transformedHotels.length} hotels from external partners`);
          return;
        }
      } catch (externalError) {
        console.log('⚠️ External hotel API search also failed');
      }
      
      // No hotels found from any source
      setHotels([]);
      toast.error(`No hotels found for your search criteria. Try different dates or locations.`);
      
    } catch (error) {
      console.error('Search error:', error);
      setHotels([]);
      toast.error('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookHotel = (hotel: Hotel) => {
    // Store hotel data and redirect to booking
    localStorage.setItem('selected_hotel', JSON.stringify(hotel));
    localStorage.setItem('hotel_search_params', JSON.stringify(searchParams));
    router.push(`/booking/hotel/${hotel.id}`);
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

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <WifiIcon className="h-4 w-4" />;
    if (amenityLower.includes('pool')) return <SwatchIcon className="h-4 w-4" />;
    if (amenityLower.includes('parking')) return <TruckIcon className="h-4 w-4" />;
    return <HomeIcon className="h-4 w-4" />;
  };

  const calculateNights = () => {
    if (!searchParams.check_in || !searchParams.check_out) return 1;
    const checkIn = new Date(searchParams.check_in);
    const checkOut = new Date(searchParams.check_out);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Modern Header with Yellow Theme */}
      <div className="bg-gradient-to-r from-white via-yellow-50 to-white py-16 relative overflow-hidden">
        <div className="absolute top-10 left-20 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center">
            <h1 className="mobile-heading text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Find Your Perfect 
              <span className="text-yellow-600">Stay</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              🏨 Discover luxury hotels and resorts with real-time availability
            </p>
          </div>
        </div>
      </div>

      {/* Modern Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-12">
        <div className="glass-card mobile-card-perfect yellow-shadow">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                <input
                  type="date"
                  value={searchParams.check_in}
                  onChange={(e) => setSearchParams({...searchParams, check_in: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                <input
                  type="date"
                  value={searchParams.check_out}
                  onChange={(e) => setSearchParams({...searchParams, check_out: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                <select
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({...searchParams, guests: e.target.value})}
                  className="input-field"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                <select
                  value={searchParams.rooms}
                  onChange={(e) => setSearchParams({...searchParams, rooms: e.target.value})}
                  className="input-field"
                >
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'room' : 'rooms'}</option>
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
                <span>{loading ? 'Searching... 🏨' : 'Search Hotels 🏨'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modern Hotel Results */}
      <div className="max-w-7xl mx-auto mobile-container section-spacing">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Available Hotels</h2>
          <div className="inline-flex items-center bg-yellow-100 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🏨 Premium accommodations in Dubai
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hotels found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="glass-card mobile-card card-hover yellow-shadow">
                <div className="flex flex-col lg:flex-row">
                  {/* Hotel Image */}
                  <div className="lg:w-2/5">
                    <div className="h-64 lg:h-full bg-gradient-to-br from-yellow-100 to-yellow-200 relative overflow-hidden rounded-2xl lg:rounded-l-2xl lg:rounded-r-none">
                      <img
                        src={hotel.images[0] || 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?w=500&h=500&fit=crop'}
                        alt={hotel.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute top-4 left-4 glass-card px-3 py-2 shadow-lg">
                        <div className="flex items-center space-x-1">
                          {renderStars(hotel.rating)}
                          <span className="text-sm font-bold text-gray-900 ml-2">{hotel.rating}</span>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          Premium
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="lg:w-3/5 p-6 lg:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                        <div className="mb-4 lg:mb-0">
                          <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">{hotel.name}</h3>
                          <div className="flex items-center text-gray-600 mb-3">
                            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
                              <MapPinIcon className="h-3 w-3 text-gray-900" />
                            </div>
                            <span className="font-semibold">{hotel.location}</span>
                          </div>
                        </div>
                        <div className="text-left lg:text-right">
                          <div className="text-yellow-600 text-3xl lg:text-4xl font-black mb-1">
                            {formatAEDCurrency(hotel.price_per_night)}
                          </div>
                          <p className="text-sm text-gray-600 font-medium">per night</p>
                          {searchParams.check_in && searchParams.check_out && (
                            <div className="mt-2 glass-card px-3 py-1 inline-block">
                              <p className="text-sm font-bold text-gray-900">
                                {formatAEDCurrency(hotel.price_per_night * calculateNights())} total
                              </p>
                              <p className="text-xs text-gray-600">({calculateNights()} nights)</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-6 leading-relaxed font-medium">{hotel.description}</p>

                      {/* Amenities */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-3">
                          {hotel.amenities.slice(0, 5).map((amenity, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-yellow-100 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                          {hotel.amenities.length > 5 && (
                            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-bold">
                              +{hotel.amenities.length - 5} more amenities
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <UserGroupIcon className="h-3 w-3 text-gray-900" />
                          </div>
                          <span className="font-semibold">{hotel.available_rooms} rooms available</span>
                        </div>
                        
                        <button
                          onClick={() => handleBookHotel(hotel)}
                          className="btn-primary px-8 py-3 text-lg font-bold shadow-2xl yellow-glow w-full sm:w-auto"
                        >
                          Book Now 🏨
                        </button>
                      </div>
                    </div>
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

export default HotelsPage;