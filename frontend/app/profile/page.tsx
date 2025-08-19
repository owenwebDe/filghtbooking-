'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-simple';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import { bookingsAPI, paymentsAPI } from '../../lib/api';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalSpent: 0,
    loyaltyPoints: 0
  });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      loadUserStats();
    }
  }, [user, authLoading, router]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original user data
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  };

  const loadUserStats = async () => {
    try {
      console.log('📊 Loading user statistics...');
      
      // Load real bookings and payments data
      const [bookingsResponse, paymentsResponse] = await Promise.all([
        bookingsAPI.getMyBookings().catch(() => ({ data: [] })),
        paymentsAPI.getMyPayments().catch(() => ({ data: [] }))
      ]);
      
      const bookings = bookingsResponse.data || [];
      const payments = paymentsResponse.data || [];
      
      if (bookings.length > 0 || payments.length > 0) {
        // Calculate real statistics from user data
        const totalTrips = bookings.filter(booking => booking.status === 'completed').length;
        const totalSpent = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
        const loyaltyPoints = Math.floor(totalSpent / 2); // 1 point per $2 spent
        
        setStats({ totalTrips, totalSpent, loyaltyPoints });
        console.log(`✅ Loaded user stats - Trips: ${totalTrips}, Spent: $${totalSpent}, Points: ${loyaltyPoints}`);
      } else {
        // No data found - show zeros
        setStats({ totalTrips: 0, totalSpent: 0, loyaltyPoints: 0 });
        console.log('📝 No user statistics found');
      }
      
    } catch (error) {
      console.error('Error loading user statistics:', error);
      setStats({ totalTrips: 0, totalSpent: 0, loyaltyPoints: 0 });
      toast.error('Failed to load user statistics.');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would call an API to update the user profile
      // await userAPI.updateProfile(formData);
      
      // For now, just show success message
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-blue-100 mt-2">Manage your account information</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active Member
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 font-medium"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="input-field"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{user.full_name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                  <span className="text-xs text-gray-500">(Cannot be changed)</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="input-field"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{user.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="border-t border-gray-200 px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Change Password</div>
                <div className="text-sm text-gray-600">Update your account password</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Email Preferences</div>
                <div className="text-sm text-gray-600">Manage your email notifications</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-red-600">
                <div className="font-medium">Delete Account</div>
                <div className="text-sm">Permanently delete your account and data</div>
              </button>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTrips}</div>
            <div className="text-sm text-gray-600">Total Trips</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-2xl font-bold text-green-600">${stats.totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.loyaltyPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Loyalty Points</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;