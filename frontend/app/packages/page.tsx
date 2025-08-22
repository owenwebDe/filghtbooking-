'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import BookingModal from '../../components/BookingModal';
import { packagesAPI } from '../../lib/api';
import { packagesAPI as travelPackagesAPI, formatAEDCurrency } from '../../lib/travel-apis';
import { 
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  CheckIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowRightIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface VacationPackage {
  id: string;
  name: string;
  destination: string;
  description: string;
  duration_days: number;
  price: number;
  includes: string[];
  itinerary: string[];
  images: string[];
  max_participants: number;
}

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<VacationPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    destination: '',
    duration: '',
    max_price: '',
    participants: '2'
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<VacationPackage | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      
      // Try backend API first
      try {
        const response = await packagesAPI.getAll(20);
        if (response.data && response.data.length > 0) {
          setPackages(response.data);
          console.log(`✅ Loaded ${response.data.length} packages from backend`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend packages not available, trying travel APIs...');
      }
      
      // Try travel packages API
      try {
        const travelPackages = await travelPackagesAPI.getFeaturedPackages();
        if (travelPackages && travelPackages.length > 0) {
          setPackages(travelPackages);
          console.log(`✅ Loaded ${travelPackages.length} packages from travel API`);
          return;
        }
      } catch (travelError) {
        console.log('⚠️ Travel packages API also failed');
      }
      
      // No packages found from any source
      setPackages([]);
      toast.error('No packages available. Please try again later or contact support.');
      
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]);
      toast.error('Failed to load packages. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('🔍 Searching packages:', searchParams);
      
      // First try backend API search
      try {
        const response = await packagesAPI.search(searchParams);
        if (response.data && response.data.length > 0) {
          setPackages(response.data);
          toast.success(`Found ${response.data.length} packages from our inventory`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend package search failed, trying travel APIs...');
      }
      
      // Try travel packages API with search
      try {
        const travelResults = await travelPackagesAPI.searchPackages(searchParams);
        if (travelResults && travelResults.length > 0) {
          setPackages(travelResults);
          toast.success(`Found ${travelResults.length} packages from external partners`);
          return;
        }
      } catch (travelError) {
        console.log('⚠️ Travel packages search also failed');
      }
      
      // No packages found from any source
      setPackages([]);
      toast.error('No packages found for your search criteria. Try different filters.');
      
    } catch (error) {
      console.error('Search error:', error);
      setPackages([]);
      toast.error('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookPackage = (pkg: VacationPackage) => {
    setSelectedPackage(pkg);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Modern Header with Red Theme */}
      <div className="relative hero-gradient py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float floating-element"></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="mobile-heading text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              Amazing Vacation 
              <span className="gradient-text-red block">Packages</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-2xl mx-auto animate-slide-up">
              📦 Unforgettable Dubai experiences and adventures curated for you
            </p>
          </div>
        </div>
      </div>

      {/* Modern Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-16 relative z-20">
        <div className="glass-card mobile-card-perfect red-shadow animate-scale-in" style={{animationDelay: '0.3s'}}>
          <form onSubmit={handleSearch} className="space-y-4 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Destination</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  <input
                    type="text"
                    placeholder="Where do you want to go?"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                    className="input-field pl-12 hover:shadow-red-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                <select
                  value={searchParams.duration}
                  onChange={(e) => setSearchParams({...searchParams, duration: e.target.value})}
                  className="input-field hover:shadow-red-500/20"
                >
                  <option value="">Any duration</option>
                  <option value="1-5">1-5 days</option>
                  <option value="6-10">6-10 days</option>
                  <option value="11-15">11-15 days</option>
                  <option value="16+">16+ days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Max Price</label>
                <select
                  value={searchParams.max_price}
                  onChange={(e) => setSearchParams({...searchParams, max_price: e.target.value})}
                  className="input-field hover:shadow-red-500/20"
                >
                  <option value="">Any price</option>
                  <option value="1000">Under AED 1,000</option>
                  <option value="5000">Under AED 5,000</option>
                  <option value="10000">Under AED 10,000</option>
                  <option value="20000">Under AED 20,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Travelers</label>
                <select
                  value={searchParams.participants}
                  onChange={(e) => setSearchParams({...searchParams, participants: e.target.value})}
                  className="input-field hover:shadow-red-500/20"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'traveler' : 'travelers'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-mobile-perfect btn-glow flex items-center space-x-3 text-lg shadow-2xl red-glow btn-press"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span>{loading ? 'Searching... 📦' : 'Search Packages 📦'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modern Package Results */}
      <div className="max-w-7xl mx-auto mobile-container section-spacing">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Featured Vacation Packages</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Searching for packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <GlobeAltIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-600 text-xl font-medium">No packages found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="glass-card mobile-card card-hover red-shadow group cursor-pointer overflow-hidden animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                {/* Package Image */}
                <div className="h-64 bg-gradient-to-br from-red-100 to-red-200 relative overflow-hidden rounded-2xl mb-6">
                  <img
                    src={pkg.images[0] || 'https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg?w=500&h=500&fit=crop'}
                    alt={pkg.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute top-4 left-4 glass-card px-3 py-2 shadow-lg">
                    <div className="flex items-center space-x-1 text-sm font-bold text-gray-900">
                      <ClockIcon className="h-4 w-4 text-red-600" />
                      <span>{pkg.duration_days} days</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 red-gradient-bg text-white px-3 py-1 rounded-full shadow-lg">
                    <div className="flex items-center space-x-1 text-sm font-bold">
                      <span>{formatAEDCurrency(pkg.price)}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse-red">
                      Featured
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <HeartIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Package Info */}
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-gray-900 mb-3">{pkg.name}</h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                        <MapPinIcon className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-semibold">{pkg.destination}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed font-medium">{pkg.description}</p>
                  </div>

                  {/* Includes */}
                  <div className="mb-6">
                    <h4 className="font-black text-gray-900 mb-3">What's Included:</h4>
                    <div className="space-y-2">
                      {pkg.includes.slice(0, 4).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckIcon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium">{item}</span>
                        </div>
                      ))}
                      {pkg.includes.length > 4 && (
                        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-sm font-bold inline-block hover-lift">
                          +{pkg.includes.length - 4} more included
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="font-semibold">Max {pkg.max_participants} people</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <CalendarDaysIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="font-semibold">{pkg.duration_days} days adventure</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleBookPackage(pkg)}
                      className="btn-primary px-8 py-3 text-lg font-bold shadow-2xl red-glow w-full sm:w-auto hover-lift btn-press group"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>Book Package 📦</span>
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
        item={selectedPackage}
        itemType="package"
      />
    </div>
  );
};

export default PackagesPage;