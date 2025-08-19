import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  firebaseLogin: (token: any) => apiClient.post('/auth/firebase-login', token),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const flightsAPI = {
  getAll: (limit?: number) => apiClient.get('/flights/', { params: { limit } }),
  getById: (id: string) => apiClient.get(`/flights/${id}`),
  create: (data: any) => apiClient.post('/flights/', data),
  update: (id: string, data: any) => apiClient.put(`/flights/${id}`, data),
  delete: (id: string) => apiClient.delete(`/flights/${id}`),
};

export const hotelsAPI = {
  getAll: (limit?: number) => apiClient.get('/hotels/', { params: { limit } }),
  getById: (id: string) => apiClient.get(`/hotels/${id}`),
  create: (data: any) => apiClient.post('/hotels/', data),
  update: (id: string, data: any) => apiClient.put(`/hotels/${id}`, data),
  delete: (id: string) => apiClient.delete(`/hotels/${id}`),
};

export const packagesAPI = {
  getAll: (limit?: number) => apiClient.get('/packages/', { params: { limit } }),
  getById: (id: string) => apiClient.get(`/packages/${id}`),
  create: (data: any) => apiClient.post('/packages/', data),
  update: (id: string, data: any) => apiClient.put(`/packages/${id}`, data),
  delete: (id: string) => apiClient.delete(`/packages/${id}`),
};

export const bookingsAPI = {
  getAll: () => apiClient.get('/bookings/'),
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  updateStatus: (id: string, status: any) => apiClient.put(`/bookings/${id}/status`, status),
};

export const paymentsAPI = {
  getAll: () => apiClient.get('/payments/'),
  getById: (id: string) => apiClient.get(`/payments/${id}`),
  refund: (id: string, amount?: number) => apiClient.post(`/payments/${id}/refund`, { amount }),
};

export default apiClient;