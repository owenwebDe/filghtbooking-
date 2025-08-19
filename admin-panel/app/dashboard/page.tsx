'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  AirplaneIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { flightsAPI, hotelsAPI, packagesAPI, bookingsAPI, paymentsAPI } from '../../lib/api';

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    flights: 0,
    hotels: 0,
    packages: 0,
    bookings: 0,
    payments: 0,
    revenue: 0
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [flightsRes, hotelsRes, packagesRes, bookingsRes, paymentsRes] = await Promise.all([
          flightsAPI.getAll(1000),
          hotelsAPI.getAll(1000),
          packagesAPI.getAll(1000),
          bookingsAPI.getAll(),
          paymentsAPI.getAll()
        ]);

        const revenue = paymentsRes.data
          .filter((payment: any) => payment.status === 'completed')
          .reduce((sum: number, payment: any) => sum + payment.amount, 0);

        setStats({
          flights: flightsRes.data.length,
          hotels: hotelsRes.data.length,
          packages: packagesRes.data.length,
          bookings: bookingsRes.data.length,
          payments: paymentsRes.data.length,
          revenue
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Flights',
      value: stats.flights,
      icon: AirplaneIcon,
      color: 'bg-blue-500',
      href: '/flights'
    },
    {
      title: 'Total Hotels',
      value: stats.hotels,
      icon: BuildingLibraryIcon,
      color: 'bg-green-500',
      href: '/hotels'
    },
    {
      title: 'Vacation Packages',
      value: stats.packages,
      icon: GlobeAltIcon,
      color: 'bg-purple-500',
      href: '/packages'
    },
    {
      title: 'Total Bookings',
      value: stats.bookings,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      href: '/bookings'
    },
    {
      title: 'Payments',
      value: stats.payments,
      icon: CreditCardIcon,
      color: 'bg-red-500',
      href: '/payments'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: CreditCardIcon,
      color: 'bg-green-600',
      href: '/payments'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 fixed h-full">
        <Sidebar />
      </div>
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.full_name}! Here's what's happening today.</p>
          </div>

          {dashboardLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${card.color}`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <a href={card.href} className="text-primary-600 text-sm font-medium hover:text-primary-700 mt-4 inline-block">
                      View details →
                    </a>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <a href="/flights" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <AirplaneIcon className="h-8 w-8 text-primary-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Manage Flights</h3>
                    <p className="text-sm text-gray-500">Add, edit, or remove flights</p>
                  </a>
                  
                  <a href="/hotels" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <BuildingLibraryIcon className="h-8 w-8 text-primary-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Manage Hotels</h3>
                    <p className="text-sm text-gray-500">Add, edit, or remove hotels</p>
                  </a>
                  
                  <a href="/packages" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <GlobeAltIcon className="h-8 w-8 text-primary-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Manage Packages</h3>
                    <p className="text-sm text-gray-500">Create vacation packages</p>
                  </a>
                  
                  <a href="/bookings" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <DocumentTextIcon className="h-8 w-8 text-primary-600 mb-2" />
                    <h3 className="font-medium text-gray-900">View Bookings</h3>
                    <p className="text-sm text-gray-500">Monitor and manage bookings</p>
                  </a>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;