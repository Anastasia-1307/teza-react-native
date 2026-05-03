// API Configuration
export const API_CONFIG = {
  // Development server - modifică doar aici
  BASE_URL: 'http://192.168.0.15:8000',
  
  // Alternative URLs
  LOCALHOST: Platform.OS === 'ios' ? 'http://localhost:8000' : 'http://10.0.2.2:8000',
  
  // Endpoints
  ENDPOINTS: {
    AUTH: '/auth',
    REGISTER: '/register',
    LOGOUT: '/logout',
  }
};

// Helper pentru a obține URL-ul complet
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint] || endpoint}`;
};
