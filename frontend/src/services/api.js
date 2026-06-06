// Servicio centralizado para llamadas al backend
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('sumerce_token');
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // No agregar Content-Type si es FormData (multer lo necesita en multipart)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const error = new Error((data && data.error) || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  // Offers
  listOffers: (filters = {}) => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v !== '' && v != null)
    ).toString();
    return request(`/offers${qs ? `?${qs}` : ''}`);
  },
  getOffer: (id) => request(`/offers/${id}`),
  myOffers: () => request('/offers/mine'),
  createOffer: (formData) => request('/offers', { method: 'POST', body: formData }),
  updateOffer: (id, body) => request(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteOffer: (id) => request(`/offers/${id}`, { method: 'DELETE' }),
  contactOffer: (id) => request(`/offers/${id}/contact`, { method: 'POST' }),

  // Locations
  getDepartments: () => request('/locations/departments'),
  getCities: (dep) => request(`/locations/cities/${encodeURIComponent(dep)}`),

  // Admin
  adminStats: () => request('/admin/stats'),
  adminUsers: () => request('/admin/users'),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  adminOffers: () => request('/admin/offers'),
};
