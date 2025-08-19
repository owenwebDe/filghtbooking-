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
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  booking_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  check_in_date?: string;
  check_out_date?: string;
  passengers?: number;
  special_requests?: string;
  item_details?: any;
}

const BookingsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadBookings();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, filter, sortBy]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading user bookings from backend...');
      
      const response = await bookingsAPI.getMyBookings();
      const bookings = response.data || [];
      
      if (bookings.length > 0) {
        setBookings(bookings);
        console.log(`✅ Loaded ${bookings.length} bookings from backend`);
      } else {
        // No bookings found - show empty state
        setBookings([]);
        console.log('📝 No bookings found for user');
      }
      
    } catch (error) {
      console.error('Error loading bookings:', error);
      // API failed - show empty state with error message
      setBookings([]);
      toast.error('Failed to load your bookings. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(booking => booking.status === filter);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-high':
          return b.total_amount - a.total_amount;
        case 'amount-low':
          return a.total_amount - b.total_amount;
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'flight': return <PaperAirplaneIcon className="h-6 w-6" />;
      case 'hotel': return <BuildingOfficeIcon className="h-6 w-6" />;
      case 'package': return <GlobeAltIcon className="h-6 w-6" />;
      default: return <CalendarDaysIcon className="h-6 w-6" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-100 text-blue-600';
      case 'hotel': return 'bg-green-100 text-green-600';
      case 'package': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  const handleDownloadTicket = (booking: Booking) => {
    toast.success('Ticket download started');
    // Implement ticket download logic
  };

  const getFilterCount = (status: string) => {
    if (status === 'all') return bookings.length;
    return bookings.filter(booking => booking.status === status).length;
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
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-blue-100 mt-2">Manage and track all your travel bookings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            {/* Status Filter */}
            <div className="flex items-center space-x-1">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 mr-3">Filter:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'confirmed', label: 'Confirmed' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'cancelled', label: 'Cancelled' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.label} ({getFilterCount(filterOption.key)})
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount-high">Amount (High to Low)</option>
                <option value="amount-low">Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <GlobeAltIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No bookings found' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't made any bookings yet. Start planning your next adventure!" 
                : `You don't have any ${filter} bookings.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/flights')}
                className="btn-primary"
              >
                Book Your First Trip
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Booking Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getBookingTypeColor(booking.booking_type)}`}>
                        {getBookingIcon(booking.booking_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">
                            {booking.booking_type} Booking
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Booking ID: {booking.id}</p>
                        <p className="text-xs text-gray-500">Booked on {formatDate(booking.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        {getStatusIcon(booking.status)}
                        <span className="text-xl font-bold text-gray-900">${booking.total_amount}</span>
                      </div>
                      {booking.passengers && (
                        <p className="text-xs text-gray-500">{booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="border-t border-gray-200 pt-4">
                    {booking.booking_type === 'flight' && booking.item_details && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.item_details.airline} {booking.item_details.flight_number}
                          </p>
                          <p className="text-sm text-gray-600">{booking.item_details.route}</p>
                          {booking.item_details.departure_time && (
                            <p className="text-xs text-gray-500">
                              {formatDateTime(booking.item_details.departure_time)} - {formatDateTime(booking.item_details.arrival_time)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {booking.booking_type === 'hotel' && booking.item_details && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{booking.item_details.name}</p>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{booking.item_details.location}</span>
                          </div>
                          {booking.check_in_date && booking.check_out_date && (
                            <p className="text-xs text-gray-500">
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {booking.booking_type === 'package' && booking.item_details && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{booking.item_details.name}</p>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{booking.item_details.destination}</span>
                          </div>
                          <p className="text-xs text-gray-500">{booking.item_details.duration}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        {(booking.status === 'confirmed' || booking.status === 'completed') && (
                          <button
                            onClick={() => handleDownloadTicket(booking)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            <span>Download Ticket</span>
                          </button>
                        )}
                      </div>
                      
                      {booking.status === 'pending' && (
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          Cancel Booking
                        </button>
                      )}
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

export default BookingsPage;