var http = require('./request');

// ==================== Auth ====================

function login(username, password) {
  return http.post('/auth/login', {
    username: username,
    password: password
  });
}

function register(username, password) {
  return http.post('/auth/register', {
    username: username,
    password: password
  });
}

function changeUsername(username) {
  return http.put('/auth/username', {
    username: username
  });
}

function changePassword(oldPassword, newPassword) {
  return http.put('/auth/password', {
    oldPassword: oldPassword,
    newPassword: newPassword
  });
}

function setupPassword(newPassword) {
  return http.put('/auth/password/setup', {
    newPassword: newPassword
  });
}

function wechatLogin(code) {
  return http.post('/auth/wechat-login', { code: code });
}

function getWechatPcLoginScene(ticketId) {
  return http.get('/auth/wechat-pc-login/scene/' + encodeURIComponent(ticketId));
}

function confirmWechatPcLogin(ticketId) {
  return http.post('/auth/wechat-pc-login/confirm', {
    ticketId: ticketId
  });
}

function cancelWechatPcLogin(ticketId) {
  return http.post('/auth/wechat-pc-login/cancel', {
    ticketId: ticketId
  });
}

// ==================== Topics ====================

function getTopics(params) {
  var parts = [];
  if (params) {
    if (params.page !== undefined) parts.push('page=' + params.page);
    if (params.size !== undefined) parts.push('size=' + params.size);
    if (params.keyword) parts.push('keyword=' + encodeURIComponent(params.keyword));
    if (params.tag) parts.push('tag=' + encodeURIComponent(params.tag));
    if (params.startDate) parts.push('startDate=' + params.startDate);
    if (params.endDate) parts.push('endDate=' + params.endDate);
  }
  var query = parts.length > 0 ? '?' + parts.join('&') : '';
  return http.get('/topics' + query);
}

function getTopic(id) {
  return http.get('/topics/' + id);
}

function getTagStats() {
  return http.get('/topics/tags');
}

function getStats() {
  return http.get('/topics/stats');
}

function getCalendar(year, month) {
  return http.get('/topics/calendar?year=' + year + '&month=' + month);
}

// ==================== Learning ====================

function getLearningTopic(id) {
  return http.get('/learning/topic/' + id);
}

function generateWarmup(titleEn, titleZh, mode, exclude) {
  return http.post('/learning/warmup', {
    titleEn: titleEn,
    titleZh: titleZh,
    mode: mode,
    exclude: exclude || ''
  });
}

function generateVocabulary(titleEn, titleZh, mode, exclude) {
  return http.post('/learning/vocabulary', {
    titleEn: titleEn,
    titleZh: titleZh,
    mode: mode,
    exclude: exclude || ''
  });
}

function generateExpressions(titleEn, titleZh, mode, exclude) {
  return http.post('/learning/expressions', {
    titleEn: titleEn,
    titleZh: titleZh,
    mode: mode,
    exclude: exclude || ''
  });
}

function generateTasks(titleEn, titleZh, mode, exclude) {
  return http.post('/learning/tasks', {
    titleEn: titleEn,
    titleZh: titleZh,
    mode: mode,
    exclude: exclude || ''
  });
}

function reviewAnswer(titleEn, titleZh, taskTitle, answer, mode) {
  return http.post('/learning/review', {
    titleEn: titleEn,
    titleZh: titleZh,
    taskTitle: taskTitle,
    answer: answer,
    mode: mode
  });
}

// ==================== Membership ====================

function getMembership() {
  return http.get('/user/membership');
}

function getMembershipContact() {
  return http.get('/user/membership-contact');
}

function redeemCode(code) {
  return http.post('/redeem-codes/redeem', {
    code: code
  });
}

module.exports = {
  // Auth
  login: login,
  register: register,
  changeUsername: changeUsername,
  changePassword: changePassword,
  setupPassword: setupPassword,
  wechatLogin: wechatLogin,
  getWechatPcLoginScene: getWechatPcLoginScene,
  confirmWechatPcLogin: confirmWechatPcLogin,
  cancelWechatPcLogin: cancelWechatPcLogin,
  // Topics
  getTopics: getTopics,
  getTopic: getTopic,
  getTagStats: getTagStats,
  getStats: getStats,
  getCalendar: getCalendar,
  // Learning
  getLearningTopic: getLearningTopic,
  generateWarmup: generateWarmup,
  generateVocabulary: generateVocabulary,
  generateExpressions: generateExpressions,
  generateTasks: generateTasks,
  reviewAnswer: reviewAnswer,
  // Membership
  getMembership: getMembership,
  getMembershipContact: getMembershipContact,
  redeemCode: redeemCode
};
