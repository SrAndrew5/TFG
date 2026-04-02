import { createContext, useContext, useState } from 'react';

const NotificationsContext = createContext(null);

// Notificaciones iniciales — solo se cargan UNA vez al montar la app
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'calendar',
    title: '¡Reserva confirmada!',
    body: 'Tu servicio de Peluquería ha sido agendado para mañana a las 16:30h.',
    time: 'Hace 5 min',
    read: false,
  },
  {
    id: 2,
    type: 'space',
    title: 'Nuevo Espacio Flex',
    body: "Se ha habilitado la 'Sala Juntas' en la planta alta. ¡Échale un vistazo!",
    time: 'Hace 3 horas',
    read: false,
  },
];

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const remove = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, markAllRead, markRead, remove }}
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
