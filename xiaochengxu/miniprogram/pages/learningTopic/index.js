const app = getApp();
const api = require('../../utils/api');

/**
 * Parse AI content string: strip markdown code fences, then JSON.parse.
 */
function parseAiContent(raw) {
  if (!raw) return null;
  var str = typeof raw === 'string' ? raw : (raw.content || '');
  if (typeof str !== 'string') return str;
  // Strip markdown code fences
  str = str.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Failed to parse AI content:', e, str);
    return null;
  }
}

Page({
  data: {
    topicId: null,
    topic: null,
    tagList: [],
    loading: true,

    // Mode
    mode: 'beginner', // beginner | advanced

    // Section collapse state
    warmupExpanded: true,
    vocabExpanded: false,
    expressionsExpanded: false,
    tasksExpanded: false,

    // Warmup
    warmupLoading: false,
    warmupData: null, // { introduction, introductionZh, warmupQuestions, keywords, speakingTips }

    // Vocabulary
    vocabLoading: false,
    vocabData: null, // { vocabulary: [...] }

    // Expressions
    expressionsLoading: false,
    expressionsData: null, // { expressions: [...] }

    // Tasks
    tasksLoading: false,
    tasksData: null, // { tasks: [...] }

    // Answer
    showAnswerPanel: false,
    currentTask: null,
    answerText: '',
    submittingAnswer: false,

    // Review
    showReview: false,
    reviewData: null // { score, strengths, improvements, corrections, encouragement }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ topicId: parseInt(options.id) });
      this.loadTopic(options.id);
    }
  },

  loadTopic(id) {
    this.setData({ loading: true });
    api.getLearningTopic(id).then(res => {
      const tagList = res.tags ? res.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
      this.setData({
        topic: res,
        tagList: tagList,
        loading: false
      });
    }).catch(err => {
      console.error('Load topic failed:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载主题失败', icon: 'none' });
    });
  },

  // --- Mode toggle ---
  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.mode) return;
    this.setData({
      mode: mode,
      warmupData: null,
      vocabData: null,
      expressionsData: null,
      tasksData: null,
      showAnswerPanel: false,
      showReview: false,
      currentTask: null,
      reviewData: null,
      answerText: ''
    });
  },

  // --- Section toggle ---
  toggleWarmup() { this.setData({ warmupExpanded: !this.data.warmupExpanded }); },
  toggleVocab() { this.setData({ vocabExpanded: !this.data.vocabExpanded }); },
  toggleExpressions() { this.setData({ expressionsExpanded: !this.data.expressionsExpanded }); },
  toggleTasks() { this.setData({ tasksExpanded: !this.data.tasksExpanded }); },

  // --- Warmup ---
  generateWarmup(isRefresh) {
    if (this.data.warmupLoading || !this.data.topic) return;
    this.setData({ warmupLoading: true, warmupExpanded: true });
    wx.showLoading({ title: '生成热身内容...', mask: true });

    const exclude = (isRefresh && this.data.warmupData) ? JSON.stringify(this.data.warmupData) : '';

    api.generateWarmup(
      this.data.topic.title,
      this.data.topic.titleZh || '',
      this.data.mode,
      exclude
    ).then(res => {
      const parsed = parseAiContent(res.content || res);
      this.setData({ warmupData: parsed, warmupLoading: false });
      wx.hideLoading();
    }).catch(err => {
      console.error('Generate warmup failed:', err);
      this.setData({ warmupLoading: false });
      wx.hideLoading();
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    });
  },

  onGenerateWarmup() { this.generateWarmup(false); },
  onRefreshWarmup() { this.generateWarmup(true); },

  // --- Vocabulary ---
  generateVocab(isRefresh) {
    if (this.data.vocabLoading || !this.data.topic) return;
    this.setData({ vocabLoading: true, vocabExpanded: true });
    wx.showLoading({ title: '生成词汇表...', mask: true });

    const exclude = (isRefresh && this.data.vocabData) ? JSON.stringify(this.data.vocabData) : '';

    api.generateVocabulary(
      this.data.topic.title,
      this.data.topic.titleZh || '',
      this.data.mode,
      exclude
    ).then(res => {
      const parsed = parseAiContent(res.content || res);
      this.setData({ vocabData: parsed, vocabLoading: false });
      wx.hideLoading();
    }).catch(err => {
      console.error('Generate vocabulary failed:', err);
      this.setData({ vocabLoading: false });
      wx.hideLoading();
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    });
  },

  onGenerateVocab() { this.generateVocab(false); },
  onRefreshVocab() { this.generateVocab(true); },

  // --- Expressions ---
  generateExpressions(isRefresh) {
    if (this.data.expressionsLoading || !this.data.topic) return;
    this.setData({ expressionsLoading: true, expressionsExpanded: true });
    wx.showLoading({ title: '生成表达模板...', mask: true });

    const exclude = (isRefresh && this.data.expressionsData) ? JSON.stringify(this.data.expressionsData) : '';

    api.generateExpressions(
      this.data.topic.title,
      this.data.topic.titleZh || '',
      this.data.mode,
      exclude
    ).then(res => {
      const parsed = parseAiContent(res.content || res);
      this.setData({ expressionsData: parsed, expressionsLoading: false });
      wx.hideLoading();
    }).catch(err => {
      console.error('Generate expressions failed:', err);
      this.setData({ expressionsLoading: false });
      wx.hideLoading();
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    });
  },

  onGenerateExpressions() { this.generateExpressions(false); },
  onRefreshExpressions() { this.generateExpressions(true); },

  // --- Tasks ---
  generateTasks(isRefresh) {
    if (this.data.tasksLoading || !this.data.topic) return;
    this.setData({ tasksLoading: true, tasksExpanded: true });
    wx.showLoading({ title: '生成练习任务...', mask: true });

    const exclude = (isRefresh && this.data.tasksData) ? JSON.stringify(this.data.tasksData) : '';

    api.generateTasks(
      this.data.topic.title,
      this.data.topic.titleZh || '',
      this.data.mode,
      exclude
    ).then(res => {
      const parsed = parseAiContent(res.content || res);
      this.setData({ tasksData: parsed, tasksLoading: false });
      wx.hideLoading();
    }).catch(err => {
      console.error('Generate tasks failed:', err);
      this.setData({ tasksLoading: false });
      wx.hideLoading();
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    });
  },

  onGenerateTasks() { this.generateTasks(false); },
  onRefreshTasks() { this.generateTasks(true); },

  // --- Answer ---
  onStartTask(e) {
    const index = e.currentTarget.dataset.index;
    const tasks = this.data.tasksData && this.data.tasksData.tasks;
    if (!tasks || !tasks[index]) return;
    this.setData({
      currentTask: tasks[index],
      showAnswerPanel: true,
      showReview: false,
      reviewData: null,
      answerText: ''
    });
    // Scroll to answer panel
    wx.pageScrollTo({ selector: '#answer-panel', offsetTop: -20 });
  },

  onAnswerInput(e) {
    this.setData({ answerText: e.detail.value });
  },

  onSubmitAnswer() {
    if (!this.data.answerText.trim()) {
      wx.showToast({ title: '请输入回答内容', icon: 'none' });
      return;
    }
    if (this.data.submittingAnswer) return;

    this.setData({ submittingAnswer: true });
    wx.showLoading({ title: 'AI点评中...', mask: true });

    api.reviewAnswer(
      this.data.topic.title,
      this.data.topic.titleZh || '',
      this.data.currentTask.title || this.data.currentTask.titleZh || '',
      this.data.answerText,
      this.data.mode
    ).then(res => {
      const parsed = parseAiContent(res.content || res);
      this.setData({
        reviewData: parsed,
        showReview: true,
        submittingAnswer: false
      });
      wx.hideLoading();
      // Scroll to review section
      wx.pageScrollTo({ selector: '#review-panel', offsetTop: -20 });
    }).catch(err => {
      console.error('Review answer failed:', err);
      this.setData({ submittingAnswer: false });
      wx.hideLoading();
      wx.showToast({ title: 'AI点评失败，请重试', icon: 'none' });
    });
  },

  onRetryTask() {
    this.setData({
      showReview: false,
      reviewData: null,
      answerText: ''
    });
    wx.pageScrollTo({ selector: '#answer-panel', offsetTop: -20 });
  },

  onCloseAnswerPanel() {
    this.setData({
      showAnswerPanel: false,
      currentTask: null,
      answerText: '',
      showReview: false,
      reviewData: null
    });
  }
});
