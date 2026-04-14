const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ==================== 配置 ====================
const DB_CONFIG = {
  host: '139.196.43.133',
  port: 3306,
  user: 'root',
  password: 'pzq18217074393',
  database: 'xiaoyouyingyu',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectTimeout: 10000
};

const JWT_SECRET = 'your-256-bit-secret-key-change-in-production-please';
const JWT_EXPIRATION = '24h';

const AI_CONFIG = {
  apiKey: 'sk-Z6mBSV3LAK2yp1T67ThtU1PBJFvXy50m8zEJMMuVYALEG8af',
  apiUrl: 'https://api.gptgod.online/v1/chat/completions',
  model: 'gpt-4o'
};

// ==================== 数据库连接 ====================
let pool = null;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({ ...DB_CONFIG, waitForConnections: true, connectionLimit: 5 });
  }
  return pool;
}

async function query(sql, params) {
  const p = getPool();
  const [rows] = await p.execute(sql, params || []);
  return rows;
}

// ==================== JWT ====================
function generateToken(username, role) {
  return jwt.sign({ sub: username, role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

async function getUserFromToken(token) {
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const users = await query('SELECT * FROM users WHERE username = ?', [decoded.sub]);
  return users.length > 0 ? users[0] : null;
}

// ==================== 会员判定 ====================
function isMembershipActive(user) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.membership_expire_at && new Date(user.membership_expire_at) > new Date();
}

function buildAuthResponse(user, token) {
  const expireAt = user.membership_expire_at ? new Date(user.membership_expire_at).toISOString() : '';
  return {
    token,
    username: user.username,
    role: user.role,
    membershipExpireAt: expireAt,
    membershipActive: isMembershipActive(user)
  };
}

// ==================== 注册赠送会员 ====================
async function grantRegistrationGift(userId) {
  const now = new Date();
  const expireAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  await query(
    'UPDATE users SET membership_expire_at=?, membership_source=?, membership_updated_at=? WHERE id=?',
    [expireAt, 'REGISTER_GIFT', now, userId]
  );
  await query(
    'INSERT INTO membership_records (user_id, change_type, days, before_expire_at, after_expire_at, remark, created_at) VALUES (?,?,?,?,?,?,?)',
    [userId, 'REGISTER_GIFT', 3, null, expireAt, '新用户注册赠送3天会员', now]
  );
}

// ==================== AI 调用 ====================
async function getDefaultAiModel() {
  const models = await query('SELECT * FROM ai_models WHERE is_default = 1 LIMIT 1');
  if (models.length > 0) {
    return { apiUrl: models[0].api_url, apiKey: models[0].api_key, model: models[0].model_name };
  }
  return AI_CONFIG;
}

async function callAi(systemPrompt, userPrompt) {
  const config = await getDefaultAiModel();
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  const body = { model: config.model, messages };
  const resp = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.apiKey
    },
    body: JSON.stringify(body),
    timeout: 180000
  });
  const data = await resp.json();
  if (data.error) {
    return JSON.stringify({ error: data.error.message || 'AI 调用失败' });
  }
  return data.choices[0].message.content;
}

// ==================== 路由处理 ====================
exports.main = async (event) => {
  const { action, data = {}, token } = event;
  try {
    switch (action) {
      // ---- 认证 ----
      case 'auth/register': return await handleRegister(data);
      case 'auth/login': return await handleLogin(data);
      case 'auth/wechat-login': return await handleWechatLogin(event);
      case 'auth/password': return await handleChangePassword(data, token);
      case 'auth/bind-wechat': return await handleBindWechat(event, token);
      case 'auth/set-password': return await handleSetPassword(data, token);

      // ---- 主题 ----
      case 'topics/list': return await handleTopicsList(data, token);
      case 'topics/detail': return await handleTopicDetail(data);
      case 'topics/tags': return await handleTopicTags();
      case 'topics/stats': return await handleTopicStats();
      case 'topics/calendar': return await handleTopicCalendar(data);

      // ---- 学习中心 ----
      case 'learning/topic': return await handleLearningTopic(data, token);
      case 'learning/warmup': return await handleLearningWarmup(data, token);
      case 'learning/vocabulary': return await handleLearningVocabulary(data, token);
      case 'learning/expressions': return await handleLearningExpressions(data, token);
      case 'learning/tasks': return await handleLearningTasks(data, token);
      case 'learning/review': return await handleLearningReview(data, token);

      // ---- 会员 ----
      case 'user/membership': return await handleGetMembership(token);
      case 'user/membership-contact': return handleMembershipContact();

      // ---- 卡密 ----
      case 'redeem-codes/redeem': return await handleRedeemCode(data, token);

      default:
        return { success: false, error: '未知接口: ' + action };
    }
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: err.message || '服务器内部错误' };
  }
};

// ==================== 认证接口 ====================
async function handleRegister(data) {
  const { username, password } = data;
  if (!username || username.length < 3 || username.length > 50) {
    return { success: false, error: '用户名长度需为3-50个字符' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: '密码长度不能少于6个字符' };
  }
  const existing = await query('SELECT id FROM users WHERE username = ?', [username]);
  if (existing.length > 0) {
    return { success: false, error: '用户名已存在' };
  }
  const hashed = bcrypt.hashSync(password, 10);
  const now = new Date();
  const result = await query(
    'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)',
    [username, hashed, 'USER', now]
  );
  const userId = result.insertId;
  await grantRegistrationGift(userId);

  const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = users[0];
  const token = generateToken(user.username, user.role);
  return { success: true, data: buildAuthResponse(user, token) };
}

async function handleLogin(data) {
  const { username, password } = data;
  if (!username || !password) {
    return { success: false, error: '请输入用户名和密码' };
  }
  const users = await query('SELECT * FROM users WHERE username = ?', [username]);
  if (users.length === 0) {
    return { success: false, error: '用户名或密码错误' };
  }
  const user = users[0];
  if (!bcrypt.compareSync(password, user.password)) {
    return { success: false, error: '用户名或密码错误' };
  }
  const token = generateToken(user.username, user.role);
  return { success: true, data: buildAuthResponse(user, token) };
}

async function handleWechatLogin(event) {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { success: false, error: '获取微信身份失败' };
  }

  // 确保 user_wechat_auth 表存在
  await query(`CREATE TABLE IF NOT EXISTS user_wechat_auth (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    wechat_open_id VARCHAR(128) UNIQUE NOT NULL,
    wechat_union_id VARCHAR(128),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // 查找绑定
  const bindings = await query('SELECT * FROM user_wechat_auth WHERE wechat_open_id = ?', [OPENID]);
  let user;

  if (bindings.length > 0) {
    // 已绑定，直接登录
    const users = await query('SELECT * FROM users WHERE id = ?', [bindings[0].user_id]);
    if (users.length === 0) {
      return { success: false, error: '关联用户不存在' };
    }
    user = users[0];
  } else {
    // 自动注册
    const autoUsername = 'wx_' + OPENID.substring(0, 12) + '_' + Date.now().toString(36);
    const autoPassword = bcrypt.hashSync(OPENID + Date.now(), 10);
    const now = new Date();
    const result = await query(
      'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)',
      [autoUsername, autoPassword, 'USER', now]
    );
    const userId = result.insertId;
    await query(
      'INSERT INTO user_wechat_auth (user_id, wechat_open_id, created_at) VALUES (?, ?, ?)',
      [userId, OPENID, now]
    );
    await grantRegistrationGift(userId);
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    user = users[0];
  }

  const token = generateToken(user.username, user.role);
  return { success: true, data: buildAuthResponse(user, token) };
}

async function handleChangePassword(data, token) {
  const user = await getUserFromToken(token);
  if (!user) return { success: false, error: '请先登录' };

  const { oldPassword, newPassword } = data;
  if (!oldPassword || !newPassword) {
    return { success: false, error: '请输入原密码和新密码' };
  }
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return { success: false, error: '原密码错误' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: '新密码长度不能少于6个字符' };
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  await query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
  return { success: true, message: '密码修改成功' };
}

async function handleBindWechat(event, token) {
  const user = await getUserFromToken(token);
  if (!user) return { success: false, error: '请先登录' };

  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { success: false, error: '获取微信身份失败' };

  await query(`CREATE TABLE IF NOT EXISTS user_wechat_auth (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    wechat_open_id VARCHAR(128) UNIQUE NOT NULL,
    wechat_union_id VARCHAR(128),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  const existing = await query('SELECT * FROM user_wechat_auth WHERE wechat_open_id = ?', [OPENID]);
  if (existing.length > 0) {
    if (existing[0].user_id === user.id) {
      return { success: true, message: '已绑定当前账号' };
    }
    return { success: false, error: '该微信已绑定其他账号' };
  }

  const userBinding = await query('SELECT * FROM user_wechat_auth WHERE user_id = ?', [user.id]);
  if (userBinding.length > 0) {
    return { success: false, error: '当前账号已绑定其他微信' };
  }

  await query('INSERT INTO user_wechat_auth (user_id, wechat_open_id, created_at) VALUES (?, ?, ?)',
    [user.id, OPENID, new Date()]);
  return { success: true, message: '绑定成功' };
}

async function handleSetPassword(data, token) {
  const user = await getUserFromToken(token);
  if (!user) return { success: false, error: '请先登录' };

  const { username, password } = data;
  if (username && username.length >= 3) {
    const existing = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, user.id]);
    if (existing.length > 0) {
      return { success: false, error: '用户名已存在' };
    }
    await query('UPDATE users SET username = ? WHERE id = ?', [username, user.id]);
  }
  if (password && password.length >= 6) {
    const hashed = bcrypt.hashSync(password, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
  }
  const users = await query('SELECT * FROM users WHERE id = ?', [user.id]);
  const updatedUser = users[0];
  const newToken = generateToken(updatedUser.username, updatedUser.role);
  return { success: true, data: buildAuthResponse(updatedUser, newToken) };
}

// ==================== 主题接口 ====================
async function handleTopicsList(data, token) {
  const user = await getUserFromToken(token);
  const isGuest = !user;
  const { page = 0, size = 10, keyword, tag, startDate, endDate } = data;

  if (isGuest && keyword) {
    return { success: false, error: '请登录后使用搜索功能' };
  }

  let sql = 'SELECT * FROM topics WHERE 1=1';
  const params = [];

  if (keyword) {
    sql += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(title_zh) LIKE LOWER(?) OR LOWER(questions) LIKE LOWER(?))';
    const kw = '%' + keyword + '%';
    params.push(kw, kw, kw);
  }
  if (tag) {
    sql += ' AND tags LIKE ?';
    params.push('%' + tag + '%');
  }
  if (startDate) {
    sql += ' AND event_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND event_date <= ?';
    params.push(endDate);
  }

  // 统计总数
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const countResult = await query(countSql, params);
  const total = countResult[0].total;

  sql += ' ORDER BY event_date DESC LIMIT ? OFFSET ?';
  params.push(size, page * size);
  const topics = await query(sql, params);

  const content = topics.map(t => {
    if (isGuest) {
      return { id: t.id, title: t.title, eventDate: t.event_date, tags: t.tags || '' };
    }
    return {
      id: t.id, title: t.title, titleZh: t.title_zh, tags: t.tags || '',
      eventDate: t.event_date, questions: t.questions, creatorId: t.creator_id,
      createdAt: t.created_at
    };
  });

  return {
    success: true,
    data: {
      content,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      number: page,
      size
    }
  };
}

async function handleTopicDetail(data) {
  const { id } = data;
  const topics = await query('SELECT * FROM topics WHERE id = ?', [id]);
  if (topics.length === 0) {
    return { success: false, error: '主题不存在' };
  }
  const t = topics[0];
  return {
    success: true,
    data: {
      id: t.id, title: t.title, titleZh: t.title_zh, tags: t.tags || '',
      eventDate: t.event_date, questions: t.questions, creatorId: t.creator_id,
      createdAt: t.created_at
    }
  };
}

async function handleTopicTags() {
  const topics = await query('SELECT tags, title FROM topics WHERE tags IS NOT NULL AND tags != "" ORDER BY event_date DESC');
  const tagInfo = {};
  for (const t of topics) {
    const tags = t.tags.split(',').map(s => s.trim()).filter(Boolean);
    for (const tag of tags) {
      if (!tagInfo[tag]) {
        tagInfo[tag] = { count: 0, latestTitle: t.title };
      }
      tagInfo[tag].count++;
    }
  }
  return { success: true, data: tagInfo };
}

async function handleTopicStats() {
  const result = await query('SELECT MIN(event_date) as earliest FROM topics');
  let days = 0;
  if (result[0].earliest) {
    const earliest = new Date(result[0].earliest);
    const now = new Date();
    days = Math.floor((now - earliest) / (1000 * 60 * 60 * 24));
  }
  return { success: true, data: { days } };
}

async function handleTopicCalendar(data) {
  const { year, month } = data;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const topics = await query(
    'SELECT id, title, event_date FROM topics WHERE event_date BETWEEN ? AND ? ORDER BY event_date',
    [startDate, endDate]
  );

  const grouped = {};
  for (const t of topics) {
    const dateStr = t.event_date instanceof Date
      ? t.event_date.toISOString().split('T')[0]
      : String(t.event_date);
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push({ id: t.id, title: t.title });
  }
  return { success: true, data: grouped };
}

// ==================== 学习中心接口 ====================
async function requireMembership(token) {
  const user = await getUserFromToken(token);
  if (!user) return { ok: false, error: '请先登录' };
  if (!isMembershipActive(user)) {
    return { ok: false, error: '请开通会员后使用学习中心' };
  }
  return { ok: true, user };
}

async function handleLearningTopic(data, token) {
  const check = await requireMembership(token);
  if (!check.ok) return { success: false, error: check.error };
  return handleTopicDetail(data);
}

async function handleLearningWarmup(data, token) {
  const check = await requireMembership(token);
  if (!check.ok) return { success: false, error: check.error };

  const { titleEn, titleZh, mode, exclude } = data;
  const beginner = mode === 'beginner';
  const excludeRule = exclude ? `\n\n## 去重规则\n以下内容已生成过，不要重复：\n${exclude}` : '';

  const systemPrompt = `你是一位专业英语教育专家。根据给定的口语练习主题，生成热身内容。
## 模式：${beginner ? '初级' : '进阶'}
## 输出格式
必须返回严格的 JSON：
{
  "introduction": "主题简介（英文）",
  "introductionZh": "主题简介（中文）",
  "warmupQuestions": [{ "en": "问题?", "zh": "中文?" }],
  "keywords": [{ "word": "关键词", "zh": "中文" }],
  "speakingTips": ["角度提示"]
}
热身问题3个，关键词5-6个，角度提示3-4个。${beginner ? '简介简短，附中文辅助。' : '简介用自然英文。'}${excludeRule}
只返回 JSON。`;

  const content = await callAi(systemPrompt, `主题：${titleEn}（${titleZh}）`);
  return { success: true, data: { content } };
}

async function handleLearningVocabulary(data, token) {
  const check = await requireMembership(token);
  if (!check.ok) return { success: false, error: check.error };

  const { titleEn, titleZh, mode, exclude } = data;
  const beginner = mode === 'beginner';
  const excludeRule = exclude ? `\n\n## 去重规则\n以下词汇已生成过，不要重复：\n${exclude}` : '';

  const systemPrompt = `你是一位专业英语教育专家。根据给定的口语练习主题，生成词汇表。
## 模式：${beginner ? '初级' : '进阶'}
## 要求
- 生成12-15个相关词汇/短语
- 按分类组织：基础词汇、高频短语、观点表达词、连接词
${beginner ? '- 不要太基础的词汇，选择实用但有含金量的' : '- 增加地道表达和高阶词汇'}${excludeRule}
## 输出格式
必须返回严格的 JSON：
{
  "vocabulary": [{
    "word": "英文", "zh": "中文", "example": "例句",
    "exampleZh": "例句翻译", "category": "分类", "difficulty": "basic/intermediate/advanced"
  }]
}
只返回 JSON。`;

  const content = await callAi(systemPrompt, `主题：${titleEn}（${titleZh}）`);
  return { success: true, data: { content } };
}

async function handleLearningExpressions(data, token) {
  const check = await requireMembership(token);
  if (!check.ok) return { success: false, error: check.error };

  const { titleEn, titleZh, mode, exclude } = data;
  const beginner = mode === 'beginner';
  const excludeRule = exclude ? `\n\n## 去重规则\n以下表达已生成过，不要重复：\n${exclude}` : '';

  const systemPrompt = `你是一位专业英语教育专家。根据给定的口语练习主题，生成表达模板。
## 模式：${beginner ? '初级' : '进阶'}
## 要求
按功能分类：表达观点、说明原因、举例说明、对比比较、补充展开、总结结尾
每类2-3个表达
${beginner ? '- 句型简单，带中文提示' : '- 增加自然衔接和高阶句型'}${excludeRule}
## 输出格式
返回严格 JSON：
{
  "expressions": [{
    "category": "分类名", "template": "句型模板", "zh": "中文说明",
    "example": "完整例句", "exampleZh": "例句翻译"
  }]
}
只返回 JSON。`;

  const content = await callAi(systemPrompt, `主题：${titleEn}（${titleZh}）`);
  return { success: true, data: { content } };
}

async function handleLearningTasks(data, token) {
  const check = await requireMembership(token);
  if (!check.ok) return { success: false, error: check.error };

  const { titleEn, titleZh, mode, exclude } = data;
  const beginner = mode === 'beginner';
  const excludeRule = exclude ? `\n\n## 去重规则\n以下任务已生成过，不要重复：\n${exclude}` : '';

  const taskTypes = beginner
    ? '- 关键词开口\n- 句型填充\n- 短回答\n- 模仿替换\n- 看提示复述'
    : '- 限时表达\n- 观点展开\n- 立场转换\n- 追问挑战\n- 双角度分析';

  const systemPrompt = `你是一位专业英语教育专家。根据给定的口语练习主题，生成练习任务。
## 模式：${beginner ? '初级' : '进阶'}
## 任务类型
${taskTypes}${excludeRule}
## 输出格式
返回严格 JSON：
{
  "tasks": [{
    "title": "任务标题", "titleZh": "中文标题", "type": "任务类型",
    "description": "英文描述", "descriptionZh": "中文描述",
    "hints": ["提示"], "estimatedMinutes": 3, "difficulty": "easy/medium/hard"
  }]
}
生成4-5个任务，难度递进。只返回 JSON。`;

  const content = await callAi(systemPrompt, `主题：${titleEn}（${titleZh}）`);
  return { success: true, data: { content } };
}

async function handleLearningReview(data, token) {
  const check = await requireMembership(token);
  if (!check.ok) return { success: false, error: check.error };

  const { titleEn, titleZh, taskTitle, answer, mode } = data;
  const beginner = mode === 'beginner';

  const systemPrompt = `你是一位专业英语口语教练。请对用户的口语练习回答进行点评。
## 模式：${beginner ? '初级' : '进阶'}
## 点评要求
${beginner ? '- 聚焦关键错误\n- 语气鼓励\n- 建议具体' : '- 关注地道性、逻辑性\n- 提供高阶替换\n- 评估思维深度'}
## 输出格式
返回严格 JSON：
{
  "score": 85,
  "strengths": ["优点"],
  "improvements": ["改进建议"],
  "corrections": [{ "original": "原句", "corrected": "更好的表达", "explanation": "说明" }],
  "encouragement": "鼓励总结"
}
只返回 JSON。`;

  const content = await callAi(systemPrompt, `主题：${titleEn}（${titleZh}）\n任务：${taskTitle}\n\n用户回答：\n${answer}`);
  return { success: true, data: { content } };
}

// ==================== 会员接口 ====================
async function handleGetMembership(token) {
  const user = await getUserFromToken(token);
  if (!user) return { success: false, error: '请先登录' };

  const isAdmin = user.role === 'ADMIN';
  const active = isMembershipActive(user);
  let remainingDays = 0;
  if (user.membership_expire_at && new Date(user.membership_expire_at) > new Date()) {
    remainingDays = Math.ceil((new Date(user.membership_expire_at) - new Date()) / (1000 * 60 * 60 * 24));
  }

  return {
    success: true,
    data: {
      role: user.role,
      membershipActive: active,
      membershipExpireAt: user.membership_expire_at ? new Date(user.membership_expire_at).toISOString() : '',
      remainingDays,
      membershipSource: user.membership_source || '',
      isAdmin
    }
  };
}

function handleMembershipContact() {
  return {
    success: true,
    data: {
      message: '请联系管理员开通高级功能',
      contactName: '管理员',
      wechat: '915981048',
      phone: '',
      qrCodeUrl: ''
    }
  };
}

// ==================== 卡密接口 ====================
async function handleRedeemCode(data, token) {
  const user = await getUserFromToken(token);
  if (!user) return { success: false, error: '请先登录' };

  const { code } = data;
  if (!code || !code.trim()) {
    return { success: false, error: '请输入卡密' };
  }

  const codes = await query('SELECT * FROM redeem_codes WHERE code = ?', [code.trim()]);
  if (codes.length === 0) {
    return { success: false, error: '卡密不存在' };
  }

  const redeemCode = codes[0];
  if (redeemCode.status === 'USED') return { success: false, error: '卡密已被使用' };
  if (redeemCode.status === 'DISABLED') return { success: false, error: '卡密已禁用' };
  if (redeemCode.expire_at && new Date(redeemCode.expire_at) < new Date()) {
    return { success: false, error: '卡密已过期' };
  }

  const now = new Date();
  const beforeExpire = user.membership_expire_at ? new Date(user.membership_expire_at) : null;
  const base = (beforeExpire && beforeExpire > now) ? beforeExpire : now;
  const newExpire = new Date(base.getTime() + redeemCode.days * 24 * 60 * 60 * 1000);

  // 更新用户
  await query(
    'UPDATE users SET membership_expire_at=?, membership_source=?, membership_updated_at=? WHERE id=?',
    [newExpire, 'REDEEM_CODE', now, user.id]
  );

  // 更新卡密
  await query(
    'UPDATE redeem_codes SET status=?, used_by=?, used_at=? WHERE id=?',
    ['USED', user.id, now, redeemCode.id]
  );

  // 记录流水
  await query(
    'INSERT INTO membership_records (user_id, change_type, days, before_expire_at, after_expire_at, related_code_id, remark, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [user.id, 'REDEEM_CODE', redeemCode.days, beforeExpire, newExpire, redeemCode.id, '兑换卡密: ' + (redeemCode.name || code.trim()), now]
  );

  return {
    success: true,
    data: {
      message: '兑换成功',
      daysAdded: redeemCode.days,
      membershipExpireAt: newExpire.toISOString(),
      membershipActive: true
    }
  };
}
