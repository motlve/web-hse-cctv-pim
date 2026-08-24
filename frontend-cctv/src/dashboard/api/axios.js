import axios from 'axios';

console.log('MODE:', import.meta.env.MODE);

const api = axios.create({
  // lewat nginx-main ke backend-cctv
  baseURL: '/api',

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
      config.headers.Authorization = `Bearer ${token}`;
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
