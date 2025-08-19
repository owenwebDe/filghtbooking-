'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AuthGuard from '../../components/AuthGuard';
import {
  UserGroupIcon,
  GiftIcon,
  ShareIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

export default function ReferralPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [referralCode] = useState('TRAVEL2024XYZ');
  const [copied, setCopied] = useState(false);

  const userStats = {
    totalReferrals: 24,
    successfulBookings: 18,
    totalEarnings: '$2,850',
    pendingRewards: '$450',
    level: 'Gold Referrer'
  };

  const referralHistory = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@email.com', status: 'Booked', reward: '$150', date: '2024-01-15' },
    { id: 2, name: 'Mike Chen', email: 'mike@email.com', status: 'Registered', reward: '$50', date: '2024-01-14' },
    { id: 3, name: 'Emily Davis', email: 'emily@email.com', status: 'Booked', reward: '$150', date: '2024-01-12' },
    { id: 4, name: 'Alex Wilson', email: 'alex@email.com', status: 'Pending', reward: '$50', date: '2024-01-10' },
    { id: 5, name: 'Lisa Zhang', email: 'lisa@email.com', status: 'Booked', reward: '$150', date: '2024-01-08' }
  ];

  const rewardTiers = [
    { level: 'Bronze', referrals: '1-9', bonus: '$50', bookingBonus: '$100', color: 'bg-orange-100 text-orange-800' },
    { level: 'Silver', referrals: '10-24', bonus: '$75', bookingBonus: '$125', color: 'bg-gray-100 text-gray-800' },
    { level: 'Gold', referrals: '25-49', bonus: '$100', bookingBonus: '$150', color: 'bg-yellow-100 text-yellow-800' },
    { level: 'Platinum', referrals: '50+', bonus: '$150', bookingBonus: '$200', color: 'bg-purple-100 text-purple-800' }
  ];

  const socialSharing = [
    { platform: 'WhatsApp', icon: DevicePhoneMobileIcon, color: 'bg-green-500', text: 'Share on WhatsApp' },
    { platform: 'Email', icon: EnvelopeIcon, color: 'bg-blue-500', text: 'Share via Email' },
    { platform: 'Copy Link', icon: ClipboardDocumentIcon, color: 'bg-gray-500', text: 'Copy Referral Link' }
  ];

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralLink = () => {
    const link = `https://flightbooking.com/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <GiftIcon className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Referral Rewards Portal
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Earn money by referring friends and family to FlightBooking. Get rewarded for every successful referral and booking!
            </p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Your Referral Code</p>
                  <p className="text-2xl font-bold text-yellow-400">{referralCode}</p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2"
                >
                  {copied ? <CheckCircleIcon className="h-5 w-5" /> : <DocumentDuplicateIcon className="h-5 w-5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
              { id: 'refer', label: 'Refer Friends', icon: ShareIcon },
              { id: 'history', label: 'Referral History', icon: UserGroupIcon },
              { id: 'rewards', label: 'Reward Tiers', icon: TrophyIcon },
              { id: 'earnings', label: 'Earnings', icon: CurrencyDollarIcon }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-green-500 text-green-600'
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                    <p className="text-3xl font-bold text-blue-600">{userStats.totalReferrals}</p>
                  </div>
                  <UserGroupIcon className="h-10 w-10 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful Bookings</p>
                    <p className="text-3xl font-bold text-green-600">{userStats.successfulBookings}</p>
                  </div>
                  <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold text-purple-600">{userStats.totalEarnings}</p>
                  </div>
                  <CurrencyDollarIcon className="h-10 w-10 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Rewards</p>
                    <p className="text-3xl font-bold text-orange-600">{userStats.pendingRewards}</p>
                  </div>
                  <SparklesIcon className="h-10 w-10 text-orange-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-100">Current Level</p>
                    <p className="text-xl font-bold">{userStats.level}</p>
                  </div>
                  <TrophyIcon className="h-10 w-10 text-yellow-100" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Referrals</h2>
                <div className="space-y-4">
                  {referralHistory.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{referral.name}</p>
                        <p className="text-sm text-gray-600">{referral.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{referral.reward}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          referral.status === 'Booked' ? 'bg-green-100 text-green-800' :
                          referral.status === 'Registered' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {referral.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Share</h2>
                <div className="space-y-4">
                  {socialSharing.map((social) => (
                    <button
                      key={social.platform}
                      onClick={social.platform === 'Copy Link' ? copyReferralLink : undefined}
                      className={`w-full flex items-center justify-center space-x-3 ${social.color} hover:opacity-90 text-white py-4 rounded-lg font-semibold transition-all`}
                    >
                      <social.icon className="h-6 w-6" />
                      <span>{social.text}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Your referral link:</p>
                  <p className="text-xs text-gray-500 break-all bg-white p-2 rounded border">
                    https://flightbooking.com/register?ref={referralCode}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Refer Friends Tab */}
        {activeTab === 'refer' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Refer Friends & Earn Rewards</h2>
              <p className="text-lg text-gray-600">Share your love for travel and earn money with every successful referral</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShareIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">1. Share</h3>
                <p className="text-gray-600">Share your referral code or link with friends and family</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">2. They Join</h3>
                <p className="text-gray-600">Your friends register and make their first booking</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">3. You Earn</h3>
                <p className="text-gray-600">Get rewarded for every successful referral and booking</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Start Earning?</h3>
              <p className="text-lg mb-6">Copy your referral code and start sharing with your network today!</p>
              <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-6">
                <p className="text-sm mb-2">Your Referral Code</p>
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-2xl font-bold text-yellow-300">{referralCode}</span>
                  <button
                    onClick={copyReferralCode}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition-all"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {socialSharing.map((social) => (
                  <button
                    key={social.platform}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                  >
                    <social.icon className="h-5 w-5" />
                    <span>{social.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Referral History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Referral History</h2>
                <div className="flex space-x-4">
                  <select className="border border-gray-300 rounded-lg px-4 py-2">
                    <option>All Status</option>
                    <option>Booked</option>
                    <option>Registered</option>
                    <option>Pending</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Search referrals..." 
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referralHistory.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {referral.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {referral.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          referral.status === 'Booked' ? 'bg-green-100 text-green-800' :
                          referral.status === 'Registered' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {referral.reward}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {referral.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reward Tiers Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Reward Tiers</h2>
              <p className="text-lg text-gray-600">The more you refer, the more you earn. Unlock higher tiers for better rewards!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewardTiers.map((tier, index) => (
                <div key={tier.level} className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  tier.level === userStats.level ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mb-4 ${tier.color}`}>
                      {tier.level}
                    </div>
                    {tier.level === userStats.level && (
                      <div className="mb-2">
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 text-xs font-bold rounded-full">
                          CURRENT LEVEL
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.referrals} Referrals</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Registration Bonus</p>
                        <p className="text-2xl font-bold text-blue-600">{tier.bonus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Booking Bonus</p>
                        <p className="text-2xl font-bold text-green-600">{tier.bookingBonus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
              <div className="text-center">
                <TrophyIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Exclusive Platinum Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <h4 className="font-bold mb-2">Priority Support</h4>
                    <p className="text-blue-100">24/7 dedicated support line</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Special Rates</h4>
                    <p className="text-blue-100">Access to exclusive deals</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Monthly Bonuses</h4>
                    <p className="text-blue-100">Additional performance rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Earnings Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earned</p>
                    <p className="text-3xl font-bold text-green-600">{userStats.totalEarnings}</p>
                  </div>
                  <CurrencyDollarIcon className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mt-2">Lifetime earnings</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-3xl font-bold text-blue-600">$650</p>
                  </div>
                  <ArrowTrendingUpIcon className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-sm text-green-600 mt-2">+25% from last month</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-3xl font-bold text-purple-600">$2,400</p>
                  </div>
                  <SparklesIcon className="h-12 w-12 text-purple-600" />
                </div>
                <button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  Withdraw
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings History</h3>
              <div className="space-y-4">
                {referralHistory.filter(r => r.status === 'Booked').map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Referral: {earning.name}</p>
                      <p className="text-sm text-gray-600">{earning.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{earning.reward}</p>
                      <p className="text-sm text-gray-600">Booking Commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}