const API_BASE = '/api';
const BACKEND_BASE = process.env.NODE_ENV === 'production'
  ? 'https://xiaoyou-ky.top/api'
  : 'http://localhost:8080/api';

interface RequestInitOptions extends RequestInit {
  direct?: boolean;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
  }
}

let authExpiredNotified = false;

export function resetAuthExpiredNotification() {
  authExpiredNotified = false;
}

export function isAuthExpiredError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.code === 'AUTH_EXPIRED');
}

export type TopicSubmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface TopicSubmissionListItem {
  id: number;
  title: string;
  username: string;
  category?: string;
  status: TopicSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicSubmissionDetail extends TopicSubmissionListItem {
  reason?: string;
  extraInfo?: string;
}

async function request(url: string, options?: RequestInitOptions) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { direct, ...fetchOptions } = options || {};
  const base = direct ? BACKEND_BASE : API_BASE;

  let res: Response;
  try {
    res = await fetch(`${base}${url}`, { ...fetchOptions, headers: { ...headers, ...fetchOptions?.headers } });
  } catch {
    throw new Error('服务连接失败，请稍后重试');
  }

  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || data?.message || (res.status >= 500 ? '服务异常，请稍后重试' : '') || text || `请求失败（${res.status}）`;
    if (res.status === 401 && typeof window !== 'undefined') {
      ['token', 'username', 'role', 'membershipExpireAt', 'membershipActive', 'membershipPermanent', 'hasPassword'].forEach(key => {
        localStorage.removeItem(key);
      });
      if (!authExpiredNotified) {
        authExpiredNotified = true;
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: {
            message: '登录已过期，请重新登录',
            code: 'AUTH_EXPIRED',
          },
        }));
      }
      throw new ApiError('登录已过期，请重新登录', { status: 401, code: 'AUTH_EXPIRED' });
    }
    throw new ApiError(message, { status: res.status });
  }

  return data;
}

async function upload(url: string, file: File, fieldName = 'file', options?: RequestInitOptions) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = new FormData();
  body.append(fieldName, file);

  const { direct, ...fetchOptions } = options || {};
  const base = direct ? BACKEND_BASE : API_BASE;

  let res: Response;
  try {
    res = await fetch(`${base}${url}`, { ...fetchOptions, method: 'POST', body, headers: { ...headers, ...fetchOptions?.headers } });
  } catch {
    throw new Error('服务连接失败，请稍后重试');
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || data?.message || text || `请求失败（${res.status}）`;
    throw new ApiError(message, { status: res.status });
  }

  return data;
}

export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  createWechatPcLoginSession: () =>
    request('/auth/wechat-pc-login/session', { method: 'POST' }) as Promise<{
      ticketId: string;
      pollToken: string;
      expiresAt: string;
      qrContent: string;
    }>,
  pollWechatPcLoginSession: (ticketId: string, pollToken: string) =>
    request(`/auth/wechat-pc-login/session/${ticketId}?pollToken=${encodeURIComponent(pollToken)}`) as Promise<{
      status: 'PENDING' | 'CONFIRMED';
      token?: string;
      username?: string;
      role?: string;
      membershipExpireAt?: string;
      membershipActive?: boolean;
      membershipPermanent?: boolean;
      hasPassword?: boolean;
    }>,
  cancelWechatPcLoginSession: (ticketId: string) =>
    request('/auth/wechat-pc-login/cancel', { method: 'POST', body: JSON.stringify({ ticketId }) }),

  // Topics
  getTopics: (params: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value);
      }
    });
    const query = searchParams.toString();
    return request(query ? `/topics?${query}` : '/topics');
  },
  getTopic: (id: number) => request(`/topics/${id}`),
  getTagStats: () => request('/topics/tags'),
  getStats: () => request('/topics/stats'),
  getCalendar: (year: number, month: number) =>
    request(`/topics/calendar?year=${year}&month=${month}`),

  // Admin - Daily Articles
  getAdminDailyArticles: (params: Record<string, string> = {}) =>
    request(`/admin/daily-articles?${new URLSearchParams(params)}`),
  getAdminDailyArticle: (id: number) =>
    request(`/admin/daily-articles/${id}`),
  createDailyArticle: (data: any) =>
    request('/admin/daily-articles', { method: 'POST', body: JSON.stringify(data) }),
  updateDailyArticle: (id: number, data: any) =>
    request(`/admin/daily-articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateDailyArticleStatus: (id: number, status: string) =>
    request(`/admin/daily-articles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteDailyArticle: (id: number) =>
    request(`/admin/daily-articles/${id}`, { method: 'DELETE' }),
  publishTodayDailyArticle: () =>
    request('/admin/daily-articles/publish-today', { method: 'POST' }),
  uploadDailyArticleAudio: (file: File) =>
    upload('/admin/daily-articles/upload-audio', file),

  // Admin - Topics
  createTopic: (data: any) =>
    request('/admin/topics', { method: 'POST', body: JSON.stringify(data) }),
  updateTopic: (id: number, data: any) =>
    request(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTopic: (id: number) =>
    request(`/admin/topics/${id}`, { method: 'DELETE' }),

  // Admin - Topic Submissions
  getAdminTopicSubmissions: (params: Record<string, string> = {}) =>
    request(`/admin/topic-submissions?${new URLSearchParams(params)}`) as Promise<{
      content: TopicSubmissionListItem[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>,
  getAdminTopicSubmission: (id: number) =>
    request(`/admin/topic-submissions/${id}`) as Promise<TopicSubmissionDetail>,
  updateAdminTopicSubmissionStatus: (id: number, status: TopicSubmissionStatus) =>
    request(`/admin/topic-submissions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }) as Promise<TopicSubmissionDetail>,

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

  // Admin - Word Practice
  getWordBooks: (params: Record<string, string> = {}) =>
    request(`/admin/word-books?${new URLSearchParams(params)}`),
  createWordBook: (data: any) =>
    request('/admin/word-books', { method: 'POST', body: JSON.stringify(data) }),
  updateWordBook: (id: number, data: any) =>
    request(`/admin/word-books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishWordBook: (id: number) =>
    request(`/admin/word-books/${id}/publish`, { method: 'PATCH' }),
  offlineWordBook: (id: number) =>
    request(`/admin/word-books/${id}/offline`, { method: 'PATCH' }),
  deleteWordBook: (id: number) =>
    request(`/admin/word-books/${id}`, { method: 'DELETE' }),
  getWords: (bookId: number, params: Record<string, string> = {}) =>
    request(`/admin/word-books/${bookId}/words?${new URLSearchParams(params)}`),
  createWord: (bookId: number, data: any, ttsModelId?: number) =>
    request(`/admin/word-books/${bookId}/words${ttsModelId ? `?ttsModelId=${ttsModelId}` : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  updateWord: (wordId: number, data: any) =>
    request(`/admin/words/${wordId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWord: (wordId: number) =>
    request(`/admin/words/${wordId}`, { method: 'DELETE' }),
  generateWordsByScene: (bookId: number, data: any) =>
    request(`/admin/word-books/${bookId}/generate-by-scene`, { method: 'POST', body: JSON.stringify(data), direct: true }),
  generateWordsByTopics: (bookId: number, data: any) =>
    request(`/admin/word-books/${bookId}/generate-by-topics`, { method: 'POST', body: JSON.stringify(data), direct: true }),
  createWordGenerationTaskByScene: (data: any) =>
    request('/admin/word-books/generation-tasks/scene', { method: 'POST', body: JSON.stringify(data), direct: true }),
  createWordGenerationTaskByTopics: (data: any) =>
    request('/admin/word-books/generation-tasks/topics', { method: 'POST', body: JSON.stringify(data), direct: true }),
  getWordGenerationTasks: () =>
    request('/admin/word-books/generation-tasks'),
  getWordGenerationTask: (taskId: number) =>
    request(`/admin/word-books/generation-tasks/${taskId}`),
  batchPublishWords: (ids: number[]) =>
    request('/admin/words/batch-publish', { method: 'POST', body: JSON.stringify({ ids }) }),
  batchOfflineWords: (ids: number[]) =>
    request('/admin/words/batch-offline', { method: 'POST', body: JSON.stringify({ ids }) }),
  batchDeleteWords: (ids: number[]) =>
    request('/admin/words/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  batchSortWords: (items: Array<{ id: number; sortOrder: number }>) =>
    request('/admin/words/batch-sort', { method: 'POST', body: JSON.stringify({ items }) }),
  batchRegenerateWordAudio: (ids: number[], ttsModelId?: number) =>
    request('/admin/words/batch-regenerate-audio', { method: 'POST', body: JSON.stringify({ ids, ttsModelId }) }),
  getTtsModels: () => request('/admin/tts-models'),
  createTtsModel: (data: any) =>
    request('/admin/tts-models', { method: 'POST', body: JSON.stringify(data) }),
  updateTtsModel: (id: number, data: any) =>
    request(`/admin/tts-models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTtsModel: (id: number) =>
    request(`/admin/tts-models/${id}`, { method: 'DELETE' }),
  setDefaultTtsModel: (id: number) =>
    request(`/admin/tts-models/${id}/default`, { method: 'PATCH' }),
  getAiDialogConfig: () => request('/admin/ai-dialog/config'),
  updateAiDialogConfig: (data: any) =>
    request('/admin/ai-dialog/config', { method: 'PUT', body: JSON.stringify(data), direct: true }),
  resetAiDialogPrompts: () =>
    request('/admin/ai-dialog/config/reset-prompts', { method: 'POST', direct: true }),

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
  getMembershipPlansForUser: () => request('/membership/plans', { direct: true }),
  createMembershipOrder: (planId: number) =>
    request('/membership/orders', { method: 'POST', body: JSON.stringify({ planId }), direct: true }),
  getMembershipOrder: (orderNo: string) => request(`/membership/orders/${orderNo}`, { direct: true }),
  getMembershipContact: () => request('/user/membership-contact', { direct: true }),
  redeemCode: (code: string) =>
    request('/redeem-codes/redeem', { method: 'POST', body: JSON.stringify({ code }), direct: true }),

  // Word Practice
  getPracticeWordBooks: () => request('/word-practice/books', { direct: true }),
  getPracticeWordBook: (bookId: number, difficulty = 'BEGINNER') =>
    request(`/word-practice/books/${bookId}?difficulty=${difficulty}`, { direct: true }),
  getNextPracticeWords: (bookId: number, difficulty = 'BEGINNER', limit = 1) =>
    request(`/word-practice/books/${bookId}/next?difficulty=${difficulty}&limit=${limit}`, { direct: true }),
  getPracticeWord: (wordId: number) =>
    request(`/word-practice/words/${wordId}`, { direct: true }),
  submitPracticeAnswer: (wordId: number, result: 'KNOWN' | 'FUZZY' | 'UNKNOWN') =>
    request(`/word-practice/words/${wordId}/answer`, { method: 'POST', body: JSON.stringify({ result }), direct: true }),

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
  getAdminMembershipPlans: () => request('/admin/membership/plans'),
  createAdminMembershipPlan: (data: any) =>
    request('/admin/membership/plans', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminMembershipPlan: (id: number, data: any) =>
    request(`/admin/membership/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAdminMembershipPlanStatus: (id: number, status: string) =>
    request(`/admin/membership/plans/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminMembershipOrders: (params: Record<string, string>) =>
    request(`/admin/membership/orders?${new URLSearchParams(params)}`),
  getAdminMembershipOrder: (id: number) =>
    request(`/admin/membership/orders/${id}`),
  grantUserMembership: (userId: number, data: any) =>
    request(`/admin/membership/users/${userId}/grant`, { method: 'POST', body: JSON.stringify(data) }),
};
