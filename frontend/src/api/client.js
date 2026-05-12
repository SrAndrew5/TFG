import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Interceptor RESPONSE: Manejo de 401 y Refresh Token ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // Caso especial: Cuenta suspendida (403)
    if (status === 403 && code === 'ACCOUNT_SUSPENDED') {
      const motivo = error.response?.data?.motivo || '';
      const dest = `/cuenta-suspendida${motivo ? `?motivo=${encodeURIComponent(motivo)}` : ''}`;
      if (window.location.pathname !== '/cuenta-suspendida') {
        window.location.href = dest;
      }
      return Promise.reject(error);
    }

    // Manejo de 401 (Unauthorized / Expired)
    if (status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
      
      // Si ya estamos intentando refrescar, encolar esta petición
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token
        // El refresh token está en una cookie httpOnly, el navegador lo envía solo
        await api.post('/auth/refresh');
        
        isRefreshing = false;
        processQueue(null);
        
        // Reintentar la petición original
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Si falla el refresh (ej: refresh token expirado), ir a login
        const publicRoutes = ['/login', '/register', '/explorar', '/', '/negocio', '/registro-empresa', '/resources', '/book-resource'];
        const isPublic = publicRoutes.some(route => window.location.pathname.startsWith(route));
        
        if (!isPublic && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
