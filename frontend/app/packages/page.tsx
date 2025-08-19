'use client';

import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import { packagesAPI } from '../../lib/api';
import { packagesAPI as travelPackagesAPI, formatAEDCurrency } from '../../lib/travel-apis';
import { 
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  CheckIcon,
  MapPinIcon
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
    // Store package data and redirect to booking
    localStorage.setItem('selected_package', JSON.stringify(pkg));
    router.push(`/booking/package/${pkg.id}`);
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
              Amazing Vacation 
              <span className="text-yellow-600">Packages</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              📦 Unforgettable Dubai experiences and adventures curated for you
            </p>
          </div>
        </div>
      </div>

      {/* Modern Search Form */}
      <div className="max-w-7xl mx-auto mobile-container -mt-12">
        <div className="glass-card mobile-card-perfect yellow-shadow">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={searchParams.duration}
                  onChange={(e) => setSearchParams({...searchParams, duration: e.target.value})}
                  className="input-field"
                >
                  <option value="">Any duration</option>
                  <option value="1-5">1-5 days</option>
                  <option value="6-10">6-10 days</option>
                  <option value="11-15">11-15 days</option>
                  <option value="16+">16+ days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <select
                  value={searchParams.max_price}
                  onChange={(e) => setSearchParams({...searchParams, max_price: e.target.value})}
                  className="input-field"
                >
                  <option value="">Any price</option>
                  <option value="1000">Under AED 1,000</option>
                  <option value="5000">Under AED 5,000</option>
                  <option value="10000">Under AED 10,000</option>
                  <option value="20000">Under AED 20,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
                <select
                  value={searchParams.participants}
                  onChange={(e) => setSearchParams({...searchParams, participants: e.target.value})}
                  className="input-field"
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
                className="btn-primary btn-mobile-perfect flex items-center space-x-3 text-lg shadow-2xl yellow-glow"
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
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Featured Vacation Packages</h2>
          <div className="inline-flex items-center bg-yellow-100 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            📦 Curated Dubai experiences
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <GlobeAltIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No packages found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div key={pkg.id} className="glass-card mobile-card card-hover yellow-shadow group cursor-pointer overflow-hidden">
                {/* Package Image */}
                <div className="h-64 bg-gradient-to-br from-yellow-100 to-yellow-200 relative overflow-hidden rounded-2xl mb-6">
                  <img
                    src={pkg.images[0] || 'https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg?w=500&h=500&fit=crop'}
                    alt={pkg.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute top-4 left-4 glass-card px-3 py-2 shadow-lg">
                    <div className="flex items-center space-x-1 text-sm font-bold text-gray-900">
                      <ClockIcon className="h-4 w-4 text-yellow-600" />
                      <span>{pkg.duration_days} days</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full shadow-lg">
                    <div className="flex items-center space-x-1 text-sm font-bold">
                      <span>{formatAEDCurrency(pkg.price)}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      Featured
                    </div>
                  </div>
                </div>

                {/* Package Info */}
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-gray-900 mb-3">{pkg.name}</h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
                        <MapPinIcon className="h-3 w-3 text-gray-900" />
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
                          <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckIcon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium">{item}</span>
                        </div>
                      ))}
                      {pkg.includes.length > 4 && (
                        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-sm font-bold inline-block">
                          +{pkg.includes.length - 4} more included
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-2.5 w-2.5 text-gray-900" />
                        </div>
                        <span className="font-semibold">Max {pkg.max_participants} people</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <CalendarDaysIcon className="h-2.5 w-2.5 text-gray-900" />
                        </div>
                        <span className="font-semibold">{pkg.duration_days} days adventure</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleBookPackage(pkg)}
                      className="btn-primary px-8 py-3 text-lg font-bold shadow-2xl yellow-glow w-full sm:w-auto"
                    >
                      Book Package 📦
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

export default PackagesPage;