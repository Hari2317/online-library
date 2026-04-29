import axios from 'axios';

const api = axios.create({
  baseURL: 'https://online-library-r7u8.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
