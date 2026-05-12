import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.items);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carga inicial al cambiar de usuario
  useEffect(() => {
    refresh();
  }, [refresh]);

  // WebSocket — conectar cuando hay sesión, desconectar al salir
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket.emit('register', user.id);
    });

    socket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on('connect_error', () => {
      // Socket.io reintentará automáticamente; no necesitamos hacer nada
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Polling de respaldo cada 5 min — por si el socket no está disponible
  useEffect(() => {
    if (!user) return undefined;
    const interval = setInterval(refresh, 5 * 60_000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  const addNotification = async ({ type = 'info', title, body }) => {
    try {
      const res = await api.post('/notifications', { type, title, body });
      // El socket recibirá la notificación en tiempo real si hay conexión activa.
      // Si no, la añadimos manualmente para no perderla.
      if (!socketRef.current?.connected) {
        setNotifications((prev) => [res.data.data, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    } catch {
      // Silenciar — la notificación es secundaria al flujo de negocio.
    }
  };

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      refresh();
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all');
    } catch {
      refresh();
    }
  };

  const remove = async (id) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      refresh();
    }
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, addNotification, markAllRead, markRead, remove, refresh }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
