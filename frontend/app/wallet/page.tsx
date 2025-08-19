'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-simple';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '../../components/Footer';
import { walletAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  WalletIcon,
  CreditCardIcon,
  StarIcon,
  GiftIcon,
  PlusIcon,
  MinusIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    points: 0,
    cashback: 0,
    tier: 'Bronze Member',
    nextTierPoints: 5000,
    totalPoints: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [membershipTiers, setMembershipTiers] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadWalletData();
    }
  }, [user, authLoading, router]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      console.log('💳 Loading wallet data from backend...');
      
      // Load all wallet data from backend APIs
      const [
        walletResponse,
        transactionsResponse, 
        paymentMethodsResponse,
        rewardsResponse,
        tiersResponse
      ] = await Promise.all([
        walletAPI.getWallet().catch(() => ({ data: null })),
        walletAPI.getTransactions().catch(() => ({ data: [] })),
        walletAPI.getPaymentMethods().catch(() => ({ data: [] })),
        walletAPI.getRewards().catch(() => ({ data: [] })),
        walletAPI.getTiers().catch(() => ({ data: [] }))
      ]);
      
      // Set wallet data from backend
      if (walletResponse.data) {
        const wallet = walletResponse.data;
        setWalletData({
          balance: wallet.balance || 0,
          points: wallet.points || 0,
          cashback: wallet.cashback || 0,
          tier: wallet.current_tier || 'Bronze Member',
          nextTierPoints: wallet.points_to_next_tier || 5000,
          totalPoints: wallet.total_points_earned || 0
        });
        console.log('✅ Loaded wallet data from backend:', wallet);
      } else {
        // Wallet not found, create default
        setWalletData({
          balance: 0,
          points: 0,
          cashback: 0,
          tier: 'Bronze Member',
          nextTierPoints: 5000,
          totalPoints: 0
        });
        console.log('📝 No wallet found, using defaults');
      }
      
      // Set transactions from backend
      const transactions = transactionsResponse.data || [];
      setTransactions(transactions.slice(0, 20)); // Show last 20 transactions
      
      // Set payment methods from backend
      const paymentMethods = paymentMethodsResponse.data || [];
      setPaymentMethods(paymentMethods);
      
      // Set rewards from backend
      const rewards = rewardsResponse.data || [];
      setRewards(rewards);
      
      // Set membership tiers from backend
      const tiers = tiersResponse.data || [];
      setMembershipTiers(tiers.length > 0 ? tiers : [
        { name: 'Bronze', pointsRequired: 0, benefits: ['1% Cashback', 'Basic Support'], color: 'bg-orange-100 text-orange-800', current: true },
        { name: 'Silver', pointsRequired: 5000, benefits: ['2% Cashback', 'Priority Support'], color: 'bg-gray-100 text-gray-800', current: false },
        { name: 'Gold', pointsRequired: 15000, benefits: ['3% Cashback', 'Free Upgrades', 'Lounge Access'], color: 'bg-yellow-100 text-yellow-800', current: false },
        { name: 'Platinum', pointsRequired: 30000, benefits: ['5% Cashback', 'Concierge Service', 'Premium Support'], color: 'bg-purple-100 text-purple-800', current: false }
      ]);
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data. Please check your connection and try again.');
      
      // Set default empty state
      setWalletData({
        balance: 0,
        points: 0,
        cashback: 0,
        tier: 'Bronze Member',
        nextTierPoints: 5000,
        totalPoints: 0
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };


  const handleAddFunds = async () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      try {
        const amount = parseFloat(addAmount);
        
        // For now, use default payment method or first available
        const defaultPaymentMethod = paymentMethods.find(pm => pm.is_primary) || 
                                    paymentMethods[0] || 
                                    { id: 'default' };
        
        toast.loading('Processing deposit...');
        
        const response = await walletAPI.deposit({
          amount: amount,
          payment_method_id: defaultPaymentMethod.id
        });
        
        if (response.status === 200 || response.status === 201) {
          toast.dismiss();
          toast.success(`Successfully added $${amount} to your wallet!`);
          setShowAddFunds(false);
          setAddAmount('');
          // Reload wallet data to show updated balance
          await loadWalletData();
        } else {
          throw new Error('Deposit failed');
        }
      } catch (error) {
        toast.dismiss();
        console.error('Error adding funds:', error);
        toast.error('Failed to add funds. Please try again or contact support.');
      }
    }
  };

  const handleRedeemReward = async (rewardId: string, rewardName: string, pointsCost: number) => {
    try {
      if (walletData.points < pointsCost) {
        toast.error('Insufficient points for this reward');
        return;
      }

      toast.loading('Redeeming reward...');
      
      const response = await walletAPI.redeemReward(rewardId);
      
      if (response.status === 200 || response.status === 201) {
        toast.dismiss();
        toast.success(`Successfully redeemed ${rewardName}!`);
        // Reload wallet data to show updated points
        await loadWalletData();
      } else {
        throw new Error('Redemption failed');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward. Please try again.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'booking': return ArrowDownIcon;
      case 'deposit': return ArrowUpIcon;
      case 'cashback': return GiftIcon;
      case 'points': return StarIcon;
      case 'refund': return ArrowUpIcon;
      default: return BanknotesIcon;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'booking': return 'text-red-600';
      case 'deposit': return 'text-green-600';
      case 'cashback': return 'text-purple-600';
      case 'points': return 'text-blue-600';
      case 'refund': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <WalletIcon className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Membership Wallet
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Manage your travel funds, earn points, and unlock exclusive rewards with your FlightBooking membership wallet
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                <p className="text-3xl font-bold text-blue-600">${walletData.balance.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <WalletIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <button 
              onClick={() => setShowAddFunds(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-all"
            >
              Add Funds
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Reward Points</p>
                <p className="text-3xl font-bold text-purple-600">{walletData.points.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <StarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {walletData.nextTierPoints} points to next tier
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cashback</p>
                <p className="text-3xl font-bold text-green-600">${walletData.cashback}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <GiftIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium">
              +15% this month
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: WalletIcon },
              { id: 'transactions', label: 'Transactions', icon: ClockIcon },
              { id: 'rewards', label: 'Rewards', icon: GiftIcon },
              { id: 'membership', label: 'Membership', icon: TrophyIcon },
              { id: 'payment', label: 'Payment Methods', icon: CreditCardIcon }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
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
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Membership Status */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{walletData.tier}</h3>
                  <p className="text-yellow-100">Your current membership tier</p>
                </div>
                <TrophyIcon className="h-16 w-16 text-yellow-200" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to Platinum</span>
                  <span>{((walletData.totalPoints - 15000) / (30000 - 15000) * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-yellow-600 rounded-full h-3">
                  <div 
                    className="bg-white rounded-full h-3 transition-all duration-300"
                    style={{ width: `${((walletData.totalPoints - 15000) / (30000 - 15000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Add Funds</h3>
                <p className="text-sm text-gray-600">Top up your wallet balance</p>
              </button>

              <button className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowDownIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Withdraw</h3>
                <p className="text-sm text-gray-600">Transfer to bank account</p>
              </button>

              <button className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GiftIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Redeem Points</h3>
                <p className="text-sm text-gray-600">Use points for rewards</p>
              </button>

              <button className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Earn Points</h3>
                <p className="text-sm text-gray-600">Discover earning opportunities</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <Link href="#" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => {
                  const IconComponent = getTransactionIcon(transaction.type);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full bg-gray-100`}>
                          <IconComponent className={`h-5 w-5 ${getTransactionColor(transaction.type)}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {transaction.amount !== 0 && (
                          <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </p>
                        )}
                        {transaction.points > 0 && (
                          <p className="text-sm text-purple-600">+{transaction.points} points</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
                <div className="flex space-x-4">
                  <select className="border border-gray-300 rounded-lg px-4 py-2">
                    <option>All Transactions</option>
                    <option>Deposits</option>
                    <option>Bookings</option>
                    <option>Cashback</option>
                    <option>Points</option>
                  </select>
                  <input 
                    type="date" 
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const IconComponent = getTransactionIcon(transaction.type);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full bg-gray-100`}>
                          <IconComponent className={`h-6 w-6 ${getTransactionColor(transaction.type)}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{transaction.date}</p>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {transaction.amount !== 0 && (
                          <p className={`text-lg font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </p>
                        )}
                        {transaction.points > 0 && (
                          <p className="text-purple-600 font-medium">+{transaction.points} points</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Redeem Your Points</h2>
              <p className="text-lg text-gray-600">You have {walletData.points.toLocaleString()} points to spend on exclusive rewards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-2">
                        {reward.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{reward.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">{reward.points.toLocaleString()} points</span>
                    </div>
                    <button 
                      onClick={() => handleRedeemReward(reward.id, reward.name, reward.points)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        walletData.points >= reward.points
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={walletData.points < reward.points}
                    >
                      {walletData.points >= reward.points ? 'Redeem' : 'Not Enough Points'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Membership Tab */}
        {activeTab === 'membership' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Membership Tiers</h2>
              <p className="text-lg text-gray-600">Unlock better benefits as you travel more with FlightBooking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipTiers.map((tier) => (
                <div key={tier.name} className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  tier.current ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mb-4 ${tier.color}`}>
                      {tier.name}
                    </div>
                    {tier.current && (
                      <div className="mb-4">
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 text-xs font-bold rounded-full">
                          CURRENT TIER
                        </span>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {tier.pointsRequired.toLocaleString()} points
                    </p>
                    <div className="space-y-2">
                      {tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center justify-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
              <div className="text-center">
                <SparklesIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">How to Earn Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-bold mb-2">Book Flights</h4>
                    <p className="text-blue-100">Earn 1 point per $2 spent</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Refer Friends</h4>
                    <p className="text-blue-100">Get 500 points per referral</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Complete Profile</h4>
                    <p className="text-blue-100">Bonus 1000 points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>Add Payment Method</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  method.primary ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.primary && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs font-semibold rounded-full">
                          Primary
                        </span>
                      )}
                      <button className="text-gray-500 hover:text-gray-700">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {!method.primary && (
                    <button className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-all">
                      Set as Primary
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Security & Privacy</h3>
                  <p className="text-blue-800 text-sm">
                    All payment information is encrypted and securely stored. We never store your full card details on our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Funds to Wallet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setAddAmount(amount.toString())}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-all"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-all"
                >
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}