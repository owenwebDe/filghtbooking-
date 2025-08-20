'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-simple';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { walletAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  WalletIcon,
  CreditCardIcon,
  StarIcon,
  GiftIcon,
  PlusIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  TrophyIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  XMarkIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  
  // Card form states
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    email: ''
  });

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

  // Payment methods configuration
  const paymentMethodOptions = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCardIcon,
      description: 'Visa, Mastercard, American Express',
      popular: true,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: BanknotesIcon,
      description: 'Direct bank transfer (instant)',
      popular: false,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: CurrencyDollarIcon,
      description: 'Pay with your PayPal account',
      popular: true,
      color: 'from-blue-600 to-purple-600'
    }
  ];

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Get card type from number
  const getCardType = (number: string) => {
    const num = number.replace(/\s/g, '');
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5') || num.startsWith('2')) return 'Mastercard';
    if (num.startsWith('3')) return 'American Express';
    return 'Card';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadWalletData();
      loadTransactions();
      loadPaymentMethods();
      loadRewards();
    }
  }, [user, authLoading, router]);

  const loadWalletData = async () => {
    try {
      const response = await walletAPI.getWallet();
      if (response.data) {
        setWalletData({
          balance: response.data.total_balance || 0,
          points: response.data.total_points || 0,
          cashback: response.data.cashback_earned || 0,
          tier: response.data.membership_tier || 'Bronze Member',
          nextTierPoints: 5000 - (response.data.total_points || 0),
          totalPoints: response.data.total_points || 0
        });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Set demo data for testing
      setWalletData({
        balance: 2847.50,
        points: 3480,
        cashback: 156.25,
        tier: 'Gold Member',
        nextTierPoints: 2520,
        totalPoints: 12480
      });
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await walletAPI.getTransactions();
      if (response.data) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Set demo transactions
      setTransactions([
        {
          id: '1',
          type: 'deposit',
          amount: 500,
          description: 'Wallet top-up via Credit Card',
          created_at: '2024-01-20T10:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'booking',
          amount: -450,
          description: 'Flight booking - Emirates EK001 (Dubai → London)',
          created_at: '2024-01-19T14:15:00Z',
          status: 'completed'
        },
        {
          id: '3',
          type: 'cashback',
          amount: 13.50,
          description: 'Cashback from hotel booking',
          created_at: '2024-01-18T09:22:00Z',
          status: 'completed'
        },
        {
          id: '4',
          type: 'deposit',
          amount: 1000,
          description: 'Wallet top-up via Bank Transfer',
          created_at: '2024-01-17T16:45:00Z',
          status: 'completed'
        },
        {
          id: '5',
          type: 'booking',
          amount: -350,
          description: 'Hotel booking - Burj Al Arab (2 nights)',
          created_at: '2024-01-16T11:30:00Z',
          status: 'completed'
        }
      ]);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await walletAPI.getPaymentMethods();
      if (response.data) {
        setPaymentMethods(response.data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([
        {
          id: '1',
          type: 'visa',
          name: 'Visa •••• 4321',
          isPrimary: true,
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          type: 'mastercard',
          name: 'Mastercard •••• 8765',
          isPrimary: false,
          created_at: '2024-01-10T00:00:00Z'
        }
      ]);
    }
  };

  const loadRewards = async () => {
    try {
      const response = await walletAPI.getRewards();
      if (response.data) {
        setRewards(response.data.rewards || []);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([
        {
          id: '1',
          name: 'Free Airport Lounge Access',
          points: 2000,
          category: 'Travel',
          canRedeem: true,
          description: 'Access to premium lounges worldwide'
        },
        {
          id: '2',
          name: 'Hotel Upgrade Voucher',
          points: 3500,
          category: 'Accommodation',
          canRedeem: false,
          description: 'Complimentary room upgrade at partner hotels'
        },
        {
          id: '3',
          name: 'Flight Discount 10%',
          points: 1500,
          category: 'Travel',
          canRedeem: true,
          description: 'Save 10% on your next flight booking'
        }
      ]);
    }
  };

  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(addAmount) < 10) {
      toast.error('Minimum top-up amount is AED 10');
      return;
    }

    if (parseFloat(addAmount) > 50000) {
      toast.error('Maximum top-up amount is AED 50,000');
      return;
    }

    setShowPaymentForm(true);
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      const amount = parseFloat(addAmount);

      if (!user) {
        throw new Error('Please log in to add funds to your wallet');
      }

      if (selectedPaymentMethod === 'card') {
        await processStripePayment(amount);
      } else {
        await simulatePaymentProcessing(selectedPaymentMethod);
        const response = await walletAPI.depositDemo(amount);
        
        if (response.data) {
          showSuccessMessage(amount);
          resetForm();
          await loadWalletData();
          await loadTransactions();
        }
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processStripePayment = async (amount: number) => {
    try {
      if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
        throw new Error('Please fill in all card details');
      }

      toast.loading('Processing payment...', { id: 'payment' });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use demo deposit for testing
      const response = await walletAPI.depositDemo(amount);
      
      toast.dismiss('payment');

      if (response.data) {
        showSuccessMessage(amount);
        resetForm();
        await loadWalletData();
        await loadTransactions();
      }
    } catch (error: any) {
      toast.dismiss('payment');
      throw new Error(error.message || 'Payment processing failed');
    }
  };

  const showSuccessMessage = (amount: number) => {
    toast.success(
      `🎉 Payment Successful! AED ${amount.toLocaleString()} added to your wallet`,
      { 
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          fontWeight: 'bold'
        }
      }
    );
  };

  const resetForm = () => {
    setAddAmount('');
    setShowAddFunds(false);
    setShowPaymentForm(false);
    setCardData({
      number: '',
      expiry: '',
      cvv: '',
      name: '',
      email: ''
    });
  };

  const simulatePaymentProcessing = async (method: string) => {
    toast.loading(`Processing ${method} payment...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss();
  };

  const getTierProgress = () => {
    return Math.min((walletData.totalPoints / (walletData.totalPoints + walletData.nextTierPoints)) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <WalletIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Digital Wallet</h1>
                <p className="text-sm text-gray-500">Manage your funds & rewards</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddFunds(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Funds
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">AED {walletData.balance.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reward Points</p>
                <p className="text-2xl font-bold text-gray-900">{walletData.points.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cashback</p>
                <p className="text-2xl font-bold text-gray-900">AED {walletData.cashback.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GiftIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-xl text-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Membership</p>
                <p className="text-xl font-bold text-white">{walletData.tier}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'transactions', name: 'Transactions', icon: DocumentTextIcon },
                { id: 'rewards', name: 'Rewards', icon: GiftIcon },
                { id: 'cards', name: 'Payment Methods', icon: CreditCardIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Sections */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-green-100' :
                            transaction.type === 'booking' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {transaction.type === 'deposit' ? (
                              <ArrowDownIcon className="h-5 w-5 text-green-600" />
                            ) : transaction.type === 'booking' ? (
                              <ArrowUpIcon className="h-5 w-5 text-red-600" />
                            ) : (
                              <GiftIcon className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}AED {Math.abs(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tier Progress */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{walletData.tier}</h3>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <TrophyIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress to next tier</span>
                    <span>{walletData.nextTierPoints.toLocaleString()} pts needed</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-1000" 
                      style={{width: `${getTierProgress()}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowAddFunds(true)}
                    className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Add Funds</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <GiftIcon className="h-6 w-6 text-green-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Rewards</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <CreditCardIcon className="h-6 w-6 text-purple-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Cards</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChartBarIcon className="h-6 w-6 text-gray-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Reports</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-green-100' :
                        transaction.type === 'booking' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <ArrowDownIcon className="h-6 w-6 text-green-600" />
                        ) : transaction.type === 'booking' ? (
                          <ArrowUpIcon className="h-6 w-6 text-red-600" />
                        ) : (
                          <GiftIcon className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}AED {Math.abs(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {reward.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{reward.points} pts</span>
                  <button
                    disabled={!reward.canRedeem}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      reward.canRedeem
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {reward.canRedeem ? 'Redeem' : 'Need More Points'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'cards' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
              <button className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Card
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">Added {formatDate(method.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {method.isPrimary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Primary
                        </span>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {!showPaymentForm ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Add Funds</h3>
                  <button
                    onClick={() => setShowAddFunds(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Amount (AED)</label>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[100, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setAddAmount(amount.toString())}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                  <div className="space-y-3">
                    {paymentMethodOptions.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedPaymentMethod === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{method.name}</span>
                                {method.popular && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{method.description}</p>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddFunds(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFunds}
                    disabled={!addAmount || parseFloat(addAmount) < 10}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowRightIcon className="h-5 w-5 rotate-180" />
                    </button>
                    <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddFunds(false);
                      setShowPaymentForm(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {selectedPaymentMethod === 'card' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({...cardData, expiry: formatExpiryDate(e.target.value)})}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total Amount:</span>
                    <span className="text-xl font-bold text-gray-900">AED {parseFloat(addAmount || '0').toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={processPayment}
                  disabled={loading || (selectedPaymentMethod === 'card' && (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name))}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Pay AED ${parseFloat(addAmount || '0').toLocaleString()}`}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  🔒 Secured with 256-bit SSL encryption
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}