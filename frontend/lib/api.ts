import axios from 'axios';
import { apiCache } from './cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // For guest booking flow - redirect to login with current URL for continuation
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = encodeURIComponent(currentPath);
      
      // Only redirect if not already on login/register pages
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = `/login?redirect=${redirectUrl}`;
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: any) => apiClient.post('/auth/register', userData),
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  firebaseLogin: (token: any) => apiClient.post('/auth/firebase-login', token),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const flightsAPI = {
  search: (params: any) => apiClient.get('/flights/search', { params }),
  getAll: (limit?: number) => apiClient.get('/flights/', { params: { limit } }),
  getById: (id: string) => apiClient.get(`/flights/${id}`),
  create: (data: any) => apiClient.post('/flights/', data),
  update: (id: string, data: any) => apiClient.put(`/flights/${id}`, data),
  delete: (id: string) => apiClient.delete(`/flights/${id}`),
};

export const hotelsAPI = {
  search: (params: any) => apiClient.get('/hotels/search', { params }),
  getAll: (limit?: number) => apiClient.get('/hotels/', { params: { limit } }),
  getById: (id: string) => apiClient.get(`/hotels/${id}`),
  create: (data: any) => apiClient.post('/hotels/', data),
  update: (id: string, data: any) => apiClient.put(`/hotels/${id}`, data),
  delete: (id: string) => apiClient.delete(`/hotels/${id}`),
};

export const packagesAPI = {
  search: (params: any) => apiClient.get('/packages/search', { params }),
  getAll: (limit?: number) => apiClient.get('/packages/', { params: { limit } }),
  getById: (id: string) => apiClient.get(`/packages/${id}`),
  create: (data: any) => apiClient.post('/packages/', data),
  update: (id: string, data: any) => apiClient.put(`/packages/${id}`, data),
  delete: (id: string) => apiClient.delete(`/packages/${id}`),
};

export const bookingsAPI = {
  create: (data: any) => apiClient.post('/bookings/', data),
  getMyBookings: () => {
    const cacheKey = 'my-bookings';
    const cached = apiCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    
    return apiClient.get('/bookings/my-bookings').then(response => {
      apiCache.set(cacheKey, response, 2); // Cache for 2 minutes
      return response;
    });
  },
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  getAll: () => apiClient.get('/bookings/'),
  updateStatus: (id: string, status: any) => apiClient.put(`/bookings/${id}/status`, status),
};

export const paymentsAPI = {
  createPaymentIntent: (bookingId: string) => 
    apiClient.post('/payments/create-payment-intent', null, { params: { booking_id: bookingId } }),
  confirmPayment: (data: any) => apiClient.post('/payments/confirm-payment', data),
  getMyPayments: () => apiClient.get('/payments/my-payments'),
  getById: (id: string) => apiClient.get(`/payments/${id}`),
  getAll: () => apiClient.get('/payments/'),
  refund: (id: string, amount?: number) => apiClient.post(`/payments/${id}/refund`, { amount }),
};

export const walletAPI = {
  getWallet: () => apiClient.get('/wallet/'),
  deposit: (data: { amount: number, payment_method_id: string }) => 
    apiClient.post('/wallet/deposit', data),
  depositStripe: (amount: number) => 
    apiClient.post('/wallet/deposit/stripe', { amount }),
  depositDemo: (amount: number) => 
    apiClient.post('/wallet/deposit/demo', { amount }),
  confirmDepositStripe: (payment_intent_id: string) => 
    apiClient.post('/wallet/deposit/stripe/confirm', { payment_intent_id }),
  withdraw: (data: { amount: number, payment_method_id: string }) => 
    apiClient.post('/wallet/withdraw', data),
  getTransactions: () => apiClient.get('/wallet/transactions'),
  addPaymentMethod: (data: any) => apiClient.post('/wallet/payment-methods', data),
  getPaymentMethods: () => apiClient.get('/wallet/payment-methods'),
  getRewards: () => apiClient.get('/wallet/rewards'),
  redeemReward: (rewardId: string) => apiClient.post(`/wallet/rewards/${rewardId}/redeem`),
  earnPoints: (data: { booking_id: string, amount: number }) => 
    apiClient.post('/wallet/points/earn', data),
  getTiers: () => apiClient.get('/wallet/tiers'),
};

export default apiClient;