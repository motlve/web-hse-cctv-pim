import axios from 'axios';

console.log('VITE API URL =>', import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================
// REQUEST INTERCEPTOR
// =====================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    console.log('API REQUEST:', config.method?.toUpperCase(), config.baseURL + config.url);

    console.log('TOKEN:', token);

    if (token) {
      config.headers = {
        ...config.headers,

        Authorization: `Bearer ${token}`,
      };
    }

    console.log('FINAL HEADER:', config.headers);

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =====================================
// RESPONSE INTERCEPTOR
// =====================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    console.error('API ERROR:', error.response?.status, error.response?.data);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');

      window.dispatchEvent(new Event('session-expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
