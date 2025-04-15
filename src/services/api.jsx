import axios from 'axios';

const baseURL = import.meta.env.VITE_BASE_URL_API
//const baseURL = 'http://127.0.0.1:5000/api';

console.log('Base URL:', baseURL);

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Adicionado para ignorar aviso do Ngrok
    },
});

// Interceptor para incluir o token de autenticação em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
