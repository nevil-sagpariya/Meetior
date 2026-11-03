/**
 * Meetior API Client Service
 * Connects frontend React components to backend REST API endpoints.
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

export function getAuthToken() {
  return localStorage.getItem('meetior_token') || '';
}

export function setAuthToken(token) {
  if (token) localStorage.setItem('meetior_token', token);
  else localStorage.removeItem('meetior_token');
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(BASE_URL + endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
}

export const API = {
      register: (payload) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
      login: (payload) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
      getMe: () => apiFetch('/api/auth/me'),
      updateProfile: (payload) => apiFetch('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
      logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),

      getEvents: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/api/events${qs ? '?' + qs : ''}`);
      },
      getEventById: (id) => apiFetch(`/api/events/${id}`),
      createEvent: (formData) => apiFetch('/api/events', { method: 'POST', body: formData }),
      updateEvent: (id, data) => {
        const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
        return apiFetch(`/api/events/${id}`, {
          method: 'PATCH',
          body: isForm ? data : JSON.stringify(data)
        });
      },
      cancelEvent: (id) => apiFetch(`/api/events/${id}`, { method: 'DELETE' }),
      interact: (id, type) => {
        const ep = type.toLowerCase() === 'saved' ? 'save' : type.toLowerCase();
        return apiFetch(`/api/events/${id}/${ep}`, { method: 'PUT' });
      },
      removeInteract: (id, type) => {
        const ep = type.toLowerCase() === 'saved' ? 'save' : type.toLowerCase();
        return apiFetch(`/api/events/${id}/${ep}`, { method: 'DELETE' });
      },

      registerEvent: (id) => apiFetch(`/api/events/${id}/register`, { method: 'POST' }),
      cancelRegistration: (id) => apiFetch(`/api/events/${id}/registration`, { method: 'DELETE' }),
      getMyBookings: () => apiFetch('/api/users/me/bookings'),
      getMySaved: () => apiFetch('/api/users/me/saved-events'),
      getTicket: (id) => apiFetch(`/api/tickets/${id}`),
      getStates: () => apiFetch('/api/locations/states'),
      getDistricts: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/api/locations/districts${qs ? '?' + qs : ''}`);
      },
      getCities: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/api/locations/cities${qs ? '?' + qs : ''}`);
      },
      lookupPincode: (pin) => apiFetch(`/api/locations/pincode/${pin}`),
      getDiscoveryCities: () => apiFetch('/api/locations/discovery-cities'),
      createPaymentOrder: (registration_id) => apiFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ registration_id }) }),
      verifyPayment: (payload) => apiFetch('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),
      payViaDemoWallet: (payload) => apiFetch('/api/payments/demo-wallet-pay', { method: 'POST', body: JSON.stringify(payload) }),
      getUpiQr: (amount, regId, upiId) => apiFetch(`/api/payments/upi-qr?amount=${encodeURIComponent(amount)}&reg_id=${encodeURIComponent(regId || 0)}${upiId ? '&upi_id=' + encodeURIComponent(upiId) : ''}`),

      getDemands: (city) => apiFetch('/api/demands' + (city && city !== 'all' ? `?city=${encodeURIComponent(city)}` : '')),
      createDemand: (payload) => apiFetch('/api/demands', { method: 'POST', body: JSON.stringify(payload) }),
      supportDemand: (id) => apiFetch(`/api/demands/${id}/support`, { method: 'POST' }),

      requestSecondChance: (id, message) => apiFetch(`/api/events/${id}/second-chance`, { method: 'POST', body: JSON.stringify({ message }) }),

      getMyOrganizedEvents: () => apiFetch('/api/organizer/events'),
      getOrganizerPayments: () => apiFetch('/api/organizer/payments'),
      checkIn: (eventId, qr_token) => apiFetch(`/api/organizer/events/${eventId}/check-in`, { method: 'POST', body: JSON.stringify({ qr_token }) }),
      getAttendance: (eventId) => apiFetch(`/api/organizer/events/${eventId}/attendance`),

      getNotifications: () => apiFetch('/api/notifications'),
      markNotifRead: (id) => apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
      markAllNotifsRead: () => apiFetch('/api/notifications/read-all', { method: 'PATCH' }),

      getEventReviews: (eventId) => apiFetch(`/api/events/${eventId}/reviews`),
      submitReview: (eventId, rating, comment) => apiFetch(`/api/events/${eventId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
      getSecondChance: (id) => apiFetch(`/api/events/${id}/second-chance`),
      requestSecondChance: (id, message) => apiFetch(`/api/events/${id}/second-chance`, { method: 'POST', body: JSON.stringify({ message }) }),

      getCategories: () => apiFetch('/api/categories'),
      submitReport: (target_type, target_id, reason, description) => apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ target_type, target_id, reason, description }) }),

      // Super Admin Authentication & Security
      adminLogin: (payload) => apiFetch('/api/admin/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
      adminVerifyMfa: (payload) => apiFetch('/api/admin/auth/verify-mfa', { method: 'POST', body: JSON.stringify(payload) }),
      adminLogout: () => apiFetch('/api/admin/auth/logout', { method: 'POST' }),
      getAdminProfile: () => apiFetch('/api/admin/auth/me'),
      setupAdminMfa: () => apiFetch('/api/admin/auth/mfa/setup', { method: 'POST' }),
      confirmAdminMfa: (mfa_code) => apiFetch('/api/admin/auth/mfa/confirm', { method: 'POST', body: JSON.stringify({ mfa_code }) }),
      disableAdminMfa: () => apiFetch('/api/admin/auth/mfa/disable', { method: 'POST' }),

      // Super Admin Management & Moderation Modules
      getAdminOverview: (params = '') => apiFetch(`/api/admin/overview${params}`),
      getAdminAttendees: (params = '') => apiFetch(`/api/admin/attendees${params}`),
      getAdminAttendeeDetails: (id) => apiFetch(`/api/admin/attendees/${id}`),
      getAdminUsers: (params = '') => apiFetch(`/api/admin/attendees${params}`),
      updateUserStatus: (userId, account_status, reason = '') => apiFetch(`/api/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ account_status, reason }) }),
      getAdminOrganizers: (params = '') => apiFetch(`/api/admin/organizers${params}`),
      getAdminOrganizerDetails: (id) => apiFetch(`/api/admin/organizers/${id}`),
      getAdminOrganizerEarnings: (params = '') => apiFetch(`/api/admin/finance/organizer-earnings${params}`),
      getAdminEvents: (params = '') => apiFetch(`/api/admin/events${params}`),
      getAdminEventDetails: (id) => apiFetch(`/api/admin/events/${id}`),
      moderateEvent: (eventId, moderation_status, reason = '', notify_organizer = true) => apiFetch(`/api/admin/events/${eventId}/moderate`, { method: 'PATCH', body: JSON.stringify({ moderation_status, reason, notify_organizer }) }),
      getAdminAttendance: (params = '') => apiFetch(`/api/admin/attendance${params}`),
      getAdminReviews: (params = '') => apiFetch(`/api/admin/reviews${params}`),
      moderateReview: (reviewId, status, reason = '') => apiFetch(`/api/admin/reviews/${reviewId}/moderate`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
      getAdminPayments: (params = '') => apiFetch(`/api/admin/payments${params}`),
      getAdminFinanceReports: (params = '') => apiFetch(`/api/admin/finance/reports${params}`),
      getAdminReports: (params = '') => apiFetch(`/api/admin/reports${params}`),
      updateReport: (reportId, status, resolution_notes = '') => apiFetch(`/api/admin/reports/${reportId}/status`, { method: 'PATCH', body: JSON.stringify({ status, resolution_notes }) }),
      getCategories: () => apiFetch('/api/categories'),
      createCategory: (data) => apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
      updateCategory: (id, data) => apiFetch(`/api/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      getLocationAudit: () => apiFetch('/api/admin/locations/audit'),
      getAdminAlerts: () => apiFetch('/api/admin/notifications/alerts'),
      sendAdminBroadcast: (payload) => apiFetch('/api/admin/broadcast', { method: 'POST', body: JSON.stringify(payload) }),
      getAdminAuditLogs: (params = '') => apiFetch(`/api/admin/audit-logs${params}`),
      getRolesAndPermissions: () => apiFetch('/api/admin/roles-permissions'),
      createAdminUser: (payload) => apiFetch('/api/admin/users/create-admin', { method: 'POST', body: JSON.stringify(payload) }),
      updateAdminRole: (id, admin_role) => apiFetch(`/api/admin/users/${id}/admin-role`, { method: 'PATCH', body: JSON.stringify({ admin_role }) }),
      getPlatformSettings: () => apiFetch('/api/admin/settings'),
      updatePlatformSettings: (settings) => apiFetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ settings }) }),
      // Admin Add & Remove Data
      deleteAdminUser: (userId) => apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' }),
      createAdminUserAccount: (payload) => apiFetch('/api/admin/users/create', { method: 'POST', body: JSON.stringify(payload) }),
      deleteAdminEvent: (eventId) => apiFetch(`/api/admin/events/${eventId}`, { method: 'DELETE' }),
      createAdminEvent: (payload) => apiFetch('/api/admin/events/create', { method: 'POST', body: JSON.stringify(payload) }),
      deleteAdminCategory: (catId) => apiFetch(`/api/admin/categories/${catId}`, { method: 'DELETE' }),
      cleanAdminDemoData: () => apiFetch('/api/admin/data/clean-demo', { method: 'POST' }),
      seedAdminDemoData: () => apiFetch('/api/admin/data/seed-demo', { method: 'POST' })
    };

    // ============================================================================

export default API;
