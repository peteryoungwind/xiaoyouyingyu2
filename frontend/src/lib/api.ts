const API_BASE = '/api';

async function request(url: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...headers, ...options?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  // Topics
  getTopics: (params: Record<string, string>) =>
    request(`/topics?${new URLSearchParams(params)}`),
  getTopic: (id: number) => request(`/topics/${id}`),
  getTagStats: () => request('/topics/tags'),
  getStats: () => request('/topics/stats'),
  getCalendar: (year: number, month: number) =>
    request(`/topics/calendar?year=${year}&month=${month}`),

  // Admin
  createTopic: (data: any) =>
    request('/admin/topics', { method: 'POST', body: JSON.stringify(data) }),
  updateTopic: (id: number, data: any) =>
    request(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTopic: (id: number) =>
    request(`/admin/topics/${id}`, { method: 'DELETE' }),
  getUsers: () => request('/admin/users'),
  deleteUser: (id: number) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
  aiGenerate: (prompt: string, history?: any[]) =>
    request('/admin/ai/generate', { method: 'POST', body: JSON.stringify({ prompt, history }) }),
};
