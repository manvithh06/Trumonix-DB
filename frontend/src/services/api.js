import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trumonix_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('trumonix_token')
      localStorage.removeItem('trumonix_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/users/me'),
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  create:        (data)                      => api.post('/transactions/', data),
  getMyTxns:     (page = 1, status = '')     => api.get(`/transactions/my?page=${page}&per_page=10${status ? `&status_filter=${status}` : ''}`),
  getMySummary:  ()                          => api.get('/transactions/my/summary'),
  getAllTxns:     (page = 1, status = '')     => api.get(`/transactions/all?page=${page}&per_page=20${status ? `&status_filter=${status}` : ''}`),
  getAdminSummary: ()                        => api.get('/transactions/admin/summary'),
  getById:       (id)                        => api.get(`/transactions/${id}`),
  review:        (id, data)                  => api.patch(`/transactions/${id}/review`, data),
  delete:         (id) => api.delete(`/transactions/${id}`),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  listAll:    ()       => api.get('/users/'),
  getUser:    (id)     => api.get(`/users/${id}`),
  updateMe:   (data)   => api.put('/users/me', data),
  deactivate: (id)     => api.patch(`/users/${id}/deactivate`),
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  getMy:  (page = 1) => api.get(`/audit/my?page=${page}`),
  getAll: (page = 1) => api.get(`/audit/all?page=${page}`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview:        () => api.get('/analytics/overview'),
  riskDistribution: () => api.get('/analytics/risk-distribution'),
  topRiskFactors:  () => api.get('/analytics/top-risk-factors'),
  recentAlerts:    () => api.get('/analytics/recent-alerts'),
}


export const notificationsApi = {
  getAll:    ()   => api.get('/notifications/'),
  markRead:  (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export const blacklistApi = {
  getAll: ()     => api.get('/blacklist/'),
  add:    (data) => api.post('/blacklist/', data),
  remove: (id)   => api.delete(`/blacklist/${id}`),
}

export const loginAttemptsApi = {
  getAll:      (page = 1)  => api.get(`/login-attempts/?page=${page}`),
  getFailedOnly: (page = 1) => api.get(`/login-attempts/?page=${page}&failed_only=true`),
}

export default api
