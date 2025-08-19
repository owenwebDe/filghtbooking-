'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../components/Footer';
import AuthGuard from '../../components/AuthGuard';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CalendarIcon,
  BanknotesIcon,
  StarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface MonthlyData {
  revenue: number;
  bookings: number;
}

interface AnalyticsData {
  monthly_data: Record<string, MonthlyData>;
}

export default function FranchisePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [franchiseStats, setFranchiseStats] = useState(null);
  const [franchisePartners, setFranchisePartners] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchFranchiseData();
  }, []);

  const fetchFranchiseData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch franchise stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/franchise/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setFranchiseStats({
          totalRevenue: `$${stats.total_revenue.toLocaleString()}`,
          totalBookings: stats.total_bookings,
          activePartners: stats.active_partners,
          monthlyGrowth: `+${stats.monthly_growth.toFixed(1)}%`
        });
        setRecentBookings(stats.recent_bookings || []);
      }

      // Fetch franchise partners
      const partnersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/franchise/partners`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (partnersResponse.ok) {
        const partners = await partnersResponse.json();
        setFranchisePartners(partners);
      }

      // Fetch analytics data
      const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/franchise/analytics/revenue`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (analyticsResponse.ok) {
        const analytics: AnalyticsData = await analyticsResponse.json();
        const monthlyDataArray = Object.entries(analytics.monthly_data || {}).map(([month, data]: [string, MonthlyData]) => ({
          month: month.split('-')[1],
          revenue: data.revenue,
          bookings: data.bookings
        }));
        setMonthlyData(monthlyDataArray);
      }

    } catch (error) {
      console.error('Error fetching franchise data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Franchise Management Portal
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Manage your travel franchise network, track performance, and grow your business with our comprehensive dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
              { id: 'partners', label: 'Partners', icon: UsersIcon },
              { id: 'bookings', label: 'Bookings', icon: DocumentTextIcon },
              { id: 'revenue', label: 'Revenue', icon: CurrencyDollarIcon },
              { id: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
        <>
        {/* Stats Cards */}
        {activeTab === 'dashboard' && franchiseStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{franchiseStats.totalRevenue}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">{franchiseStats.monthlyGrowth}</span>
                  <span className="text-gray-600 text-sm"> vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{franchiseStats.totalBookings.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-blue-600 text-sm font-medium">+12.3%</span>
                  <span className="text-gray-600 text-sm"> vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Partners</p>
                    <p className="text-3xl font-bold text-gray-900">{franchiseStats.activePartners}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-purple-600 text-sm font-medium">+8 new</span>
                  <span className="text-gray-600 text-sm"> this month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Global Reach</p>
                    <p className="text-3xl font-bold text-gray-900">45+</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <GlobeAltIcon className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-orange-600 text-sm font-medium">Countries</span>
                  <span className="text-gray-600 text-sm"> served</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
                  <Link href="/bookings" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{booking.destination}</p>
                        <p className="text-sm text-gray-600">ID: {booking.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{booking.amount}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Performance Chart</h2>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                    <option>Last 6 months</option>
                    <option>Last year</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{data.month}</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${(data.revenue / 150000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        ${data.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Franchise Partners</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>Add Partner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {franchisePartners.map((partner) => (
                <div key={partner.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">{partner.location}</span>
                      </div>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{partner.bookings}</p>
                          <p className="text-xs text-gray-600">Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{partner.revenue}</p>
                          <p className="text-xs text-gray-600">Revenue</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`h-4 w-4 ${i < Math.floor(partner.rating) ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{partner.rating}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 p-2">
                        <PhoneIcon className="h-5 w-5" />
                      </button>
                      <button className="text-green-600 hover:text-green-700 p-2">
                        <EnvelopeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
                <div className="flex space-x-4">
                  <select className="border border-gray-300 rounded-lg px-4 py-2">
                    <option>All Status</option>
                    <option>Confirmed</option>
                    <option>Pending</option>
                    <option>Processing</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Search bookings..." 
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {booking.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700 mr-4">View</button>
                        <button className="text-green-600 hover:text-green-700">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-green-600">$245,000</p>
                  </div>
                  <BanknotesIcon className="h-12 w-12 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                    <p className="text-3xl font-bold text-blue-600">$36,750</p>
                  </div>
                  <CurrencyDollarIcon className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Deal Size</p>
                    <p className="text-3xl font-bold text-purple-600">$1,563</p>
                  </div>
                  <ArrowTrendingUpIcon className="h-12 w-12 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Breakdown by Partner</h3>
              <div className="space-y-4">
                {franchisePartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{partner.name}</p>
                      <p className="text-sm text-gray-600">{partner.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{partner.revenue}</p>
                      <p className="text-sm text-gray-600">{partner.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Destinations</h3>
                <div className="space-y-3">
                  {['Paris, France', 'Tokyo, Japan', 'Dubai, UAE', 'London, UK', 'Bali, Indonesia'].map((destination, index) => (
                    <div key={destination} className="flex items-center justify-between">
                      <span className="text-gray-600">{destination}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${100 - (index * 15)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{100 - (index * 15)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Trends</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Booking Value</span>
                    <span className="font-bold text-green-600">+12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer Retention</span>
                    <span className="font-bold text-blue-600">87.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Partner Satisfaction</span>
                    <span className="font-bold text-purple-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Market Share</span>
                    <span className="font-bold text-orange-600">23.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}