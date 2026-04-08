const API_BASE = '/api';
const BACKEND_BASE = process.env.NODE_ENV === 'production'
  ? 'https://xiaoyou-ky.top/api'
  : 'http://localhost:8080/api';

async function request(url: string, options?: RequestInit & { direct?: boolean }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { direct, ...fetchOptions } = options || {};
  const base = direct ? BACKEND_BASE : API_BASE;
  const res = await fetch(`${base}${url}`, { ...fetchOptions, headers: { ...headers, ...fetchOptions?.headers } });
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

  // Admin - Topics
  createTopic: (data: any) =>
    request('/admin/topics', { method: 'POST', body: JSON.stringify(data) }),
  updateTopic: (id: number, data: any) =>
    request(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTopic: (id: number) =>
    request(`/admin/topics/${id}`, { method: 'DELETE' }),

  // Admin - Users
  getUsers: () => request('/admin/users'),
  deleteUser: (id: number) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (id: number, role: string) =>
    request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // Admin - AI (legacy)
  aiGenerate: (prompt: string, history?: any[]) =>
    request('/admin/ai/generate', { method: 'POST', body: JSON.stringify({ prompt, history }), direct: true }),

  // Admin - AI New Flow
  aiGenerateTitles: (prompt?: string, modelId?: number) =>
    request('/admin/ai/generate-titles', {
      method: 'POST',
      body: JSON.stringify({ prompt: prompt || '', modelId }),
      direct: true,
    }),
  aiGenerateQuestions: (titleEn: string, titleZh: string, modelId?: number) =>
    request('/admin/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ titleEn, titleZh, modelId: modelId?.toString() }),
      direct: true,
    }),

  // Admin - AI Models
  getAiModels: () => request('/admin/ai/models'),
  createAiModel: (data: { name: string; apiUrl: string; apiKey: string; modelName: string; isDefault?: boolean }) =>
    request('/admin/ai/models', { method: 'POST', body: JSON.stringify(data) }),
  updateAiModel: (id: number, data: { name: string; apiUrl: string; apiKey: string; modelName: string; isDefault?: boolean }) =>
    request(`/admin/ai/models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAiModel: (id: number) =>
    request(`/admin/ai/models/${id}`, { method: 'DELETE' }),

  // Learning Center
  getLearningTopic: (id: number) => request(`/learning/topic/${id}`, { direct: true }),
  generateWarmup: (titleEn: string, titleZh: string, mode: string, exclude?: string) =>
    request('/learning/warmup', { method: 'POST', body: JSON.stringify({ titleEn, titleZh, mode, exclude }), direct: true }),
  generateVocabulary: (titleEn: string, titleZh: string, mode: string, exclude?: string) =>
    request('/learning/vocabulary', { method: 'POST', body: JSON.stringify({ titleEn, titleZh, mode, exclude }), direct: true }),
  generateExpressions: (titleEn: string, titleZh: string, mode: string, exclude?: string) =>
    request('/learning/expressions', { method: 'POST', body: JSON.stringify({ titleEn, titleZh, mode, exclude }), direct: true }),
  generateTasks: (titleEn: string, titleZh: string, mode: string, exclude?: string) =>
    request('/learning/tasks', { method: 'POST', body: JSON.stringify({ titleEn, titleZh, mode, exclude }), direct: true }),
  reviewAnswer: (titleEn: string, titleZh: string, taskTitle: string, answer: string, mode: string) =>
    request('/learning/review', { method: 'POST', body: JSON.stringify({ titleEn, titleZh, taskTitle, answer, mode }), direct: true }),

  // Membership
  getMembership: () => request('/user/membership', { direct: true }),
  getMembershipContact: () => request('/user/membership-contact', { direct: true }),
  redeemCode: (code: string) =>
    request('/redeem-codes/redeem', { method: 'POST', body: JSON.stringify({ code }), direct: true }),

  // Admin - Redeem Codes
  generateRedeemCodes: (data: { name: string; count: number; days: number; expireAt?: string; remark?: string }) =>
    request('/admin/redeem-codes', { method: 'POST', body: JSON.stringify(data) }),
  getRedeemCodes: (params: Record<string, string>) =>
    request(`/admin/redeem-codes?${new URLSearchParams(params)}`),
  disableRedeemCode: (id: number) =>
    request(`/admin/redeem-codes/${id}/disable`, { method: 'PATCH' }),

  // Admin - Membership
  setMembershipExpireAt: (userId: number, expireAt: string, remark?: string) =>
    request(`/admin/users/${userId}/membership-expire-at`, { method: 'PATCH', body: JSON.stringify({ expireAt, remark }) }),
  addMembershipDays: (userId: number, days: number, remark?: string) =>
    request(`/admin/users/${userId}/membership-add-days`, { method: 'POST', body: JSON.stringify({ days, remark }) }),
  getMembershipRecords: (userId: number) =>
    request(`/admin/users/${userId}/membership-records`),
};
