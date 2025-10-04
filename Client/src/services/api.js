import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },

  // Get summary statistics
  getSummary: async () => {
    try {
      const response = await axios.get(`${API_URL}/summary`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch summary data:', error);
      throw error;
    }
  },

  // Get transactions with optional filtering
  getTransactions: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/transactions`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  },

  // Get monthly transaction data
  getMonthlyData: async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions/monthly`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
      throw error;
    }
  },

  // Get vendor statistics
  getVendorStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/vendors`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch vendor statistics:', error);
      throw error;
    }
  },

  // Get status summary
  getStatusSummary: async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch status summary:', error);
      throw error;
    }
  },

  // Search transactions
  searchTransactions: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/search`, { 
        params: { query } 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search transactions:', error);
      throw error;
    }
  }
};

export default api;