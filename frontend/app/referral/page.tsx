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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white py-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/15 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/20 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float floating-element" style={{animationDelay: '2s'}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 red-gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-red shadow-2xl">
              <GiftIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight animate-scale-in">
              Referral Rewards 
              <span className="block text-yellow-300 drop-shadow-2xl">Portal</span>
            </h1>
            <p className="text-xl text-red-100 max-w-3xl mx-auto mb-8 font-medium animate-slide-up">
              💰 Earn money by referring friends and family to FlightBooking. Get rewarded for every successful referral and booking!
            </p>
            <div className="glass-card bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl mx-auto red-shadow-lg border border-white/20 hover-lift animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-red-100 mb-2 font-bold">✨ Your Referral Code</p>
                  <p className="text-3xl font-black text-yellow-300 tracking-wider">{referralCode}</p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="glass-card bg-white/90 backdrop-blur-sm text-red-600 hover:bg-white px-8 py-4 rounded-2xl font-black transition-all flex items-center space-x-3 shadow-2xl hover-lift btn-press border-2 border-white/50"
                >
                  {copied ? <CheckCircleIcon className="h-6 w-6 text-green-600" /> : <DocumentDuplicateIcon className="h-6 w-6" />}
                  <span>{copied ? '✅ Copied!' : '📋 Copy Code'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/95 backdrop-blur-lg shadow-2xl border-b border-red-100 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center md:justify-start space-x-2 md:space-x-8 py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon, emoji: '📊' },
              { id: 'refer', label: 'Refer Friends', icon: ShareIcon, emoji: '🤝' },
              { id: 'history', label: 'Referral History', icon: UserGroupIcon, emoji: '📋' },
              { id: 'rewards', label: 'Reward Tiers', icon: TrophyIcon, emoji: '🏆' },
              { id: 'earnings', label: 'Earnings', icon: CurrencyDollarIcon, emoji: '💰' }
            ].map(({ id, label, icon: Icon, emoji }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-4 md:px-6 border-b-3 font-bold text-sm flex items-center space-x-2 transition-all duration-300 hover-lift rounded-t-xl ${
                  activeTab === id
                    ? 'border-red-500 text-red-600 bg-red-50 red-shadow'
                    : 'border-transparent text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden text-lg">{emoji}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-red-50 via-white to-red-50 min-h-screen">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 animate-fade-in">
              <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg p-8 border border-red-100 hover-lift animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-2">👥 Total Referrals</p>
                    <p className="text-4xl font-black gradient-text-red">{userStats.totalReferrals}</p>
                  </div>
                  <div className="w-16 h-16 red-gradient-bg rounded-2xl flex items-center justify-center animate-pulse-red">
                    <UserGroupIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg p-8 border border-red-100 hover-lift animate-scale-in" style={{animationDelay: '0.1s'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-2">✅ Successful Bookings</p>
                    <p className="text-4xl font-black text-green-600">{userStats.successfulBookings}</p>
                  </div>
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <CheckCircleIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg p-8 border border-red-100 hover-lift animate-scale-in" style={{animationDelay: '0.2s'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-2">💰 Total Earnings</p>
                    <p className="text-4xl font-black gradient-text-red">{userStats.totalEarnings}</p>
                  </div>
                  <div className="w-16 h-16 red-gradient-bg rounded-2xl flex items-center justify-center animate-pulse-red">
                    <CurrencyDollarIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg p-8 border border-red-100 hover-lift animate-scale-in" style={{animationDelay: '0.3s'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-2">⏳ Pending Rewards</p>
                    <p className="text-4xl font-black text-orange-600">{userStats.pendingRewards}</p>
                  </div>
                  <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <SparklesIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-card red-gradient-bg rounded-3xl shadow-2xl p-8 text-white hover-lift animate-scale-in" style={{animationDelay: '0.4s'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-red-100 mb-2">🏆 Current Level</p>
                    <p className="text-2xl font-black text-yellow-300">{userStats.level}</p>
                  </div>
                  <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center animate-pulse">
                    <TrophyIcon className="h-8 w-8 text-yellow-900" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
              <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg p-8 border border-red-100 hover-lift">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 red-gradient-bg rounded-xl flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">📋 Recent Referrals</h2>
                </div>
                <div className="space-y-4">
                  {referralHistory.slice(0, 5).map((referral, index) => (
                    <div key={referral.id} className="glass-card bg-white/60 p-6 border border-red-100 rounded-2xl hover-lift animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-gray-900 text-lg">{referral.name}</p>
                          <p className="text-sm text-gray-600 font-medium">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-green-600 text-xl">{referral.reward}</p>
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            referral.status === 'Booked' ? 'bg-green-100 text-green-800' :
                            referral.status === 'Registered' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {referral.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg p-8 border border-red-100 hover-lift">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 red-gradient-bg rounded-xl flex items-center justify-center">
                    <ShareIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">🚀 Quick Share</h2>
                </div>
                <div className="space-y-4">
                  {socialSharing.map((social, index) => (
                    <button
                      key={social.platform}
                      onClick={social.platform === 'Copy Link' ? copyReferralLink : undefined}
                      className={`w-full flex items-center justify-center space-x-3 ${social.color} hover:opacity-90 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover-lift btn-press animate-slide-up`}
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <social.icon className="h-6 w-6" />
                      <span>{social.text}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-8 glass-card bg-red-50 p-6 rounded-2xl border border-red-200">
                  <p className="text-sm font-bold text-red-700 mb-3">🔗 Your referral link:</p>
                  <p className="text-sm text-gray-700 break-all glass-card bg-white/80 p-4 rounded-xl border border-red-100 font-mono">
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

            <div className="glass-card red-gradient-bg rounded-3xl p-10 text-white text-center shadow-2xl border border-red-300 hover-lift animate-scale-in">
              <h3 className="text-3xl font-black mb-6">🚀 Ready to Start Earning?</h3>
              <p className="text-lg mb-6">Copy your referral code and start sharing with your network today!</p>
              <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-6">
                <p className="text-sm mb-2">Your Referral Code</p>
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-2xl font-bold text-yellow-300">{referralCode}</span>
                  <button
                    onClick={copyReferralCode}
                    className="bg-white text-red-600 hover:bg-red-50 px-6 py-3 rounded-2xl font-black transition-all hover-lift shadow-lg"
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
          <div className="glass-card bg-white/80 backdrop-blur-sm rounded-3xl red-shadow-lg border border-red-100 animate-fade-in">
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

            <div className="glass-card red-gradient-bg rounded-3xl p-10 text-white shadow-2xl border border-red-300 animate-scale-in hover-lift">
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