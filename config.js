export const API_CONFIG = {
  // Modificați această valoare în funcție de unde rulați serverul
  BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://your-production-api.com',
  
  // Alternativ, puteți folosi variabile de mediu
  // BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
};

export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
