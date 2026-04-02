export function formatRelativeDate(isoString, timeString) {
  if (!isoString) return '';
  
  const dateObj = new Date(isoString);
  const today = new Date();
  
  const isSameDay = (d1, d2) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let label = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  
  if (isSameDay(dateObj, today)) {
    label = 'Hoy';
  } else if (isSameDay(dateObj, yesterday)) {
    label = 'Ayer';
  } else if (isSameDay(dateObj, tomorrow)) {
    label = 'Mañana';
  }

  return timeString ? `${label}, ${timeString}` : label;
}
