'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-simple';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import { bookingsAPI } from '../../lib/api';
import { 
  PaperAirplaneIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  ChartBarIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  booking_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  check_in_date?: string;
  check_out_date?: string;
  item_details?: any;
}

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    upcomingTrips: 0,
    completedTrips: 0
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data from backend...');
      
      // Load real bookings from backend
      const response = await bookingsAPI.getMyBookings();
      const bookings = response.data || [];
      
      if (bookings.length > 0) {
        setRecentBookings(bookings.slice(0, 3)); // Show last 3 bookings
        
        // Calculate real stats from bookings
        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum: number, booking: Booking) => sum + booking.total_amount, 0);
        const upcomingTrips = bookings.filter((b: Booking) => b.status === 'confirmed').length;
        const completedTrips = bookings.filter((b: Booking) => b.status === 'completed').length;
        
        setStats({ totalBookings, totalSpent, upcomingTrips, completedTrips });
        console.log(`✅ Loaded ${totalBookings} bookings, total spent: ${totalSpent}`);
      } else {
        // No bookings found - show empty state
        setRecentBookings([]);
        setStats({ totalBookings: 0, totalSpent: 0, upcomingTrips: 0, completedTrips: 0 });
        console.log('📝 No bookings found for user');
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // API failed - show empty state with error message
      setRecentBookings([]);
      setStats({ totalBookings: 0, totalSpent: 0, upcomingTrips: 0, completedTrips: 0 });
      toast.error('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'flight': return <PaperAirplaneIcon className="h-5 w-5" />;
      case 'hotel': return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'package': return <GlobeAltIcon className="h-5 w-5" />;
      default: return <CalendarDaysIcon className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user.full_name}!</h1>
              <p className="text-blue-100">Ready for your next adventure?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/flights" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Book Flights</h3>
                  <p className="text-sm text-gray-600">Find and book your next flight</p>
                </div>
              </div>
            </Link>

            <Link href="/hotels" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Book Hotels</h3>
                  <p className="text-sm text-gray-600">Discover amazing places to stay</p>
                </div>
              </div>
            </Link>

            <Link href="/packages" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <GlobeAltIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Vacation Packages</h3>
                  <p className="text-sm text-gray-600">Explore curated travel experiences</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Travel Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upcoming Trips</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingTrips}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Trips</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedTrips}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
            <Link href="/bookings" className="text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your bookings...</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-4">Start planning your next adventure!</p>
              <Link href="/flights" className="btn-primary">
                Book Your First Trip
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getBookingIcon(booking.booking_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 capitalize">{booking.booking_type} Booking</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {booking.item_details?.name || booking.item_details?.airline || 'Booking'} 
                          {booking.item_details?.route && ` - ${booking.item_details.route}`}
                          {booking.item_details?.location && ` - ${booking.item_details.location}`}
                          {booking.item_details?.destination && ` - ${booking.item_details.destination}`}
                        </p>
                        <p className="text-xs text-gray-500">Booked on {formatDate(booking.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(booking.status)}
                        <span className="text-lg font-bold text-gray-900">${booking.total_amount}</span>
                      </div>
                      {booking.check_in_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(booking.check_in_date)} - {booking.check_out_date ? formatDate(booking.check_out_date) : 'Open'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;