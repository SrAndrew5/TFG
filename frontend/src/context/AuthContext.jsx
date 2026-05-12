import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [onLoginSuccess, setOnLoginSuccess] = useState(null);

  // La cookie httpOnly es la única fuente de verdad.
  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { usuario } = res.data.data;
    setUser(usuario);
    if (onLoginSuccess) {
      onLoginSuccess();
      setOnLoginSuccess(null);
    }
    setLoginModalOpen(false);
    return usuario;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignorar */ }
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const openLoginModal = (onSuccess = null) => {
    setOnLoginSuccess(() => onSuccess);
    setLoginModalOpen(true);
  };

  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN';

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, isAdmin, updateUser,
      loginModalOpen, setLoginModalOpen, openLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
