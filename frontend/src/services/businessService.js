import api from '../api/client';

/**
 * Capa de servicios para el módulo SaaS — concentra todas las llamadas a /api/businesses.
 * El cliente axios ya inyecta cookies httpOnly y maneja el redirect 401.
 */

// ── Público / propietario ─────────────────────────────────────────

export function registerBusiness(payload) {
  return api.post('/businesses/register', payload);
}

export function getMyBusiness() {
  return api.get('/businesses/me');
}

export function updateMyBusiness(payload) {
  return api.put('/businesses/me', payload);
}

export function getBusinessAppointments(params = {}) {
  return api.get('/businesses/appointments', { params });
}

export function updateBusinessAppointmentStatus(id, estado, motivo) {
  return api.patch(`/businesses/appointments/${id}/status`, motivo ? { estado, motivo } : { estado });
}

export function getBusinessStats() {
  return api.get('/businesses/stats');
}

// ── Público (sin auth) — Explorador de negocios ──────────────────

export function getPublicBusinesses(filters = {}) {
  return api.get('/businesses', { params: filters });
}

export function getPublicBusinessBySlug(slug) {
  return api.get(`/businesses/${slug}`);
}

export function getBusinessAvailability(slug, params = {}) {
  return api.get(`/businesses/${slug}/availability`, { params });
}

// ── Owner: Fotos y logo ──────────────────────────────────────────

export function uploadBusinessLogo(file) {
  const fd = new FormData();
  fd.append('logo', file);
  return api.post('/businesses/me/logo', fd);
}

export function uploadBusinessPhoto(file) {
  const fd = new FormData();
  fd.append('photo', file);
  return api.post('/businesses/me/photos', fd);
}

export function deleteBusinessPhoto(url) {
  return api.delete('/businesses/me/photos', { data: { url } });
}

// ── Owner: Servicios ─────────────────────────────────────────────

export function getMyServices() {
  return api.get('/businesses/services');
}

export function createService(data) {
  return api.post('/businesses/services', data);
}

export function updateService(id, data) {
  return api.put(`/businesses/services/${id}`, data);
}

export function deleteService(id) {
  return api.delete(`/businesses/services/${id}`);
}

// ── Owner: Empleados ──────────────────────────────────────────────

export function getMyEmployees() {
  return api.get('/businesses/employees');
}

export function createEmployee(data) {
  return api.post('/businesses/employees', data);
}

export function updateEmployee(id, data) {
  return api.put(`/businesses/employees/${id}`, data);
}

export function deleteEmployee(id) {
  return api.delete(`/businesses/employees/${id}`);
}

// ── Owner: Disponibilidad de empleados ───────────────────────────

export function getEmployeeAvailability(employeeId) {
  return api.get(`/availability/${employeeId}`);
}

export function addEmployeeAvailability(data) {
  return api.post('/availability', data);
}

export function deleteEmployeeAvailability(id) {
  return api.delete(`/availability/${id}`);
}

// ── Owner: Asignación de servicios a empleados ───────────────────

export function getEmployeeDetail(employeeId) {
  return api.get(`/employees/${employeeId}`);
}

export function assignServiceToEmployee(employeeId, servicioId) {
  return api.post(`/employees/${employeeId}/services`, { servicio_id: servicioId });
}

export function removeServiceFromEmployee(employeeId, servicioId) {
  return api.delete(`/employees/${employeeId}/services/${servicioId}`);
}

// ── Owner: Reservas de espacios ──────────────────────────────────

export function getBusinessResourceBookings(params = {}) {
  return api.get('/businesses/resource-bookings', { params });
}

export function updateBusinessResourceBookingStatus(id, estado) {
  return api.patch(`/businesses/resource-bookings/${id}/status`, { estado });
}

// ── Administración (rol ADMIN) ────────────────────────────────────


export function getAdminBusinesses(filters = {}) {
  return api.get('/admin/businesses', { params: filters });
}

export function getAdminBusinessById(id) {
  return api.get(`/admin/businesses/${id}`);
}

export function approveBusiness(id) {
  return api.patch(`/admin/businesses/${id}/approve`);
}

export function rejectBusiness(id, motivo) {
  return api.patch(`/admin/businesses/${id}/reject`, { motivo });
}

export function suspendBusiness(id, motivo) {
  return api.patch(`/admin/businesses/${id}/suspend`, { motivo });
}

export function reactivateBusiness(id) {
  return api.patch(`/admin/businesses/${id}/reactivate`);
}

// ── Helpers de presentación ──────────────────────────────────────

export const TIPO_NEGOCIO_OPTIONS = [
  { value: 'PELUQUERIA',      label: 'Peluquería' },
  { value: 'BARBERIA',       label: 'Barbería' },
  { value: 'COWORKING',       label: 'Coworking' },
  { value: 'SPA',             label: 'Spa' },
  { value: 'CENTRO_ESTETICA', label: 'Centro de estética' },
  { value: 'GIMNASIO',        label: 'Gimnasio' },
  { value: 'OTRO',            label: 'Otro' },
];

export const ESTADO_BUSINESS_META = {
  PENDIENTE:  { label: 'Pendiente',  className: 'bg-warning-bg text-warning-text border border-warning-border' },
  ACTIVO:     { label: 'Activo',     className: 'bg-success-bg text-success-text border border-success-border' },
  SUSPENDIDO: { label: 'Suspendido', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
  RECHAZADO:  { label: 'Rechazado',  className: 'bg-danger-bg text-danger-text border border-danger-border' },
};
