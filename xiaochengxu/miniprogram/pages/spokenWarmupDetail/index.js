const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

function parseAiContent(raw) {
  if (!raw) return null;
  var str = typeof raw === 'string' ? raw : (raw.content || raw);
  if (typeof str !== 'string') return str;
  str = str.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Parse spoken warmup AI content failed:', e, str);
    return null;
  }
}

function initialBatches() {
  return {
    beginner: { warmup: [], vocabulary: [], sentencePatterns: [], idiomaticExpressions: [], tasks: [] },
    advanced: { warmup: [], vocabulary: [], sentencePatterns: [], idiomaticExpressions: [], tasks: [] }
  };
}

Page({
  data: {
    topicId: null,
    topic: null,
    tagList: [],
    loading: true,
    mode: 'beginner',
    expanded: {
      warmup: true,
      vocabulary: false,
      sentencePatterns: false,
      idiomaticExpressions: false,
      tasks: false
    },
    loadingMap: {
      warmup: false,
      vocabulary: false,
      sentencePatterns: false,
      idiomaticExpressions: false,
      tasks: false,
      review: false,
      speech: false
    },
    currentContent: {
      warmup: null,
      vocabulary: null,
      sentencePatterns: null,
      idiomaticExpressions: null,
      tasks: null
    },
    selectedTask: null,
    inputMode: 'voice',
    recording: false,
    answerText: '',
    reviewData: null,
    errorMap: {}
  },

  onLoad(options) {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    this.generatedBatches = initialBatches();
    this.setupRecorder();
    if (options.id) {
      this.setData({ topicId: Number(options.id) });
      this.loadTopic(options.id);
    }
  },

  onUnload() {
    if (this.recorder) {
      this.recorder.stop();
    }
  },

  setupRecorder() {
    this.recorder = wx.getRecorderManager();
    this.recorder.onStop((res) => {
      this.setData({ recording: false });
      if (res && res.tempFilePath) {
        this.transcribeAudio(res.tempFilePath);
      }
    });
    this.recorder.onError((err) => {
      console.error('Record failed:', err);
      this.setData({ recording: false });
      wx.showToast({ title: '录音失败，请重试或切换文字', icon: 'none' });
    });
  },

  async loadTopic(id) {
    this.setData({ loading: true });
    try {
      const topic = await api.getSpokenWarmupTopic(id);
      const normalizedTags = util.normalizeKnownTags(topic.tags);
      this.setData({
        topic: topic,
        tagList: normalizedTags.length > 0 ? normalizedTags : util.parseTags(topic.tags),
        loading: false
      });
    } catch (err) {
      console.error('Load spoken warmup topic failed:', err);
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '主题加载失败', icon: 'none' });
    }
  },

  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.mode) return;
    this.setData({
      mode: mode,
      currentContent: this.currentContentForMode(mode),
      selectedTask: null,
      answerText: '',
      reviewData: null,
      inputMode: 'voice'
    });
  },

  currentContentForMode(mode) {
    const batches = this.generatedBatches && this.generatedBatches[mode];
    if (!batches) {
      return { warmup: null, vocabulary: null, sentencePatterns: null, idiomaticExpressions: null, tasks: null };
    }
    return {
      warmup: this.lastBatch(batches.warmup),
      vocabulary: this.lastBatch(batches.vocabulary),
      sentencePatterns: this.lastBatch(batches.sentencePatterns),
      idiomaticExpressions: this.lastBatch(batches.idiomaticExpressions),
      tasks: this.lastBatch(batches.tasks)
    };
  },

  lastBatch(list) {
    return list && list.length ? list[list.length - 1] : null;
  },

  toggleSection(e) {
    const section = e.currentTarget.dataset.section;
    this.setData({ ['expanded.' + section]: !this.data.expanded[section] });
  },

  buildExclude(section) {
    const batches = (this.generatedBatches[this.data.mode] || {})[section] || [];
    if (!batches.length) return '';
    const recent = batches.slice(-3);
    const text = JSON.stringify(recent);
    return text.length > 4000 ? text.slice(text.length - 4000) : text;
  },

  async generateSection(section, apiCall, isRefresh) {
    if (!this.data.topic || this.data.loadingMap[section]) return;
    this.setData({
      ['loadingMap.' + section]: true,
      ['expanded.' + section]: true,
      ['errorMap.' + section]: ''
    });
    try {
      const exclude = isRefresh ? this.buildExclude(section) : '';
      const res = await apiCall(this.data.topic.title, this.data.topic.titleZh || '', this.data.mode, exclude);
      const parsed = parseAiContent(res.content || res);
      if (!parsed || parsed.error) {
        throw new Error(parsed && parsed.error ? parsed.error : 'AI 返回格式异常');
      }
      this.generatedBatches[this.data.mode][section].push(parsed);
      const content = this.data.currentContent;
      content[section] = parsed;
      this.setData({
        currentContent: content,
        ['loadingMap.' + section]: false
      });
    } catch (err) {
      console.error('Generate section failed:', section, err);
      this.setData({
        ['loadingMap.' + section]: false,
        ['errorMap.' + section]: err.message || '生成失败，请重试'
      });
    }
  },

  onGenerateWarmup() { this.generateSection('warmup', api.generateSpokenWarmup, false); },
  onRefreshWarmup() { this.generateSection('warmup', api.generateSpokenWarmup, true); },
  onGenerateVocabulary() { this.generateSection('vocabulary', api.generateSpokenWarmupVocabulary, false); },
  onRefreshVocabulary() { this.generateSection('vocabulary', api.generateSpokenWarmupVocabulary, true); },
  onGenerateSentencePatterns() { this.generateSection('sentencePatterns', api.generateSentencePatterns, false); },
  onRefreshSentencePatterns() { this.generateSection('sentencePatterns', api.generateSentencePatterns, true); },
  onGenerateIdiomaticExpressions() { this.generateSection('idiomaticExpressions', api.generateIdiomaticExpressions, false); },
  onRefreshIdiomaticExpressions() { this.generateSection('idiomaticExpressions', api.generateIdiomaticExpressions, true); },
  onGenerateTasks() { this.generateSection('tasks', api.generateSpokenWarmupTasks, false); },
  onRefreshTasks() { this.generateSection('tasks', api.generateSpokenWarmupTasks, true); },

  onSelectTask(e) {
    const index = e.currentTarget.dataset.index;
    const tasks = this.data.currentContent.tasks && this.data.currentContent.tasks.tasks;
    if (!tasks || !tasks[index]) return;
    this.setData({
      selectedTask: tasks[index],
      inputMode: 'voice',
      answerText: '',
      reviewData: null
    });
    wx.pageScrollTo({ selector: '#practice-input', offsetTop: -20 });
  },

  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ inputMode: mode });
  },

  onAnswerInput(e) {
    this.setData({ answerText: e.detail.value });
  },

  startRecord() {
    if (this.data.recording || this.data.loadingMap.speech) return;
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({ recording: true });
        this.recorder.start({ duration: 60000, format: 'mp3' });
      },
      fail: () => {
        wx.showModal({
          title: '需要录音权限',
          content: '语音输入需要录音权限，你也可以切换为文字输入。',
          confirmText: '去设置',
          cancelText: '文字输入',
          success: (res) => {
            if (res.confirm) wx.openSetting();
            else this.setData({ inputMode: 'text' });
          }
        });
      }
    });
  },

  stopRecord() {
    if (!this.data.recording) return;
    this.recorder.stop();
  },

  async transcribeAudio(filePath) {
    this.setData({ ['loadingMap.speech']: true });
    wx.showLoading({ title: '识别语音中...', mask: true });
    try {
      const res = await api.spokenWarmupSpeechToText(filePath, {
        topicId: String(this.data.topicId || ''),
        mode: this.data.mode
      });
      const text = res && res.text ? res.text : '';
      if (!text.trim()) {
        throw new Error('未识别到内容，请重录');
      }
      this.setData({
        answerText: text,
        ['loadingMap.speech']: false
      });
      wx.hideLoading();
    } catch (err) {
      console.error('Speech to text failed:', err);
      this.setData({ ['loadingMap.speech']: false });
      wx.hideLoading();
      wx.showToast({ title: err.message || '识别失败，请重试或切换文字', icon: 'none' });
    }
  },

  async submitReview() {
    const answer = (this.data.answerText || '').trim();
    if (!answer) {
      wx.showToast({ title: '请先输入或识别回答', icon: 'none' });
      return;
    }
    if (!this.data.selectedTask || this.data.loadingMap.review) return;
    this.setData({ ['loadingMap.review']: true, reviewData: null });
    wx.showLoading({ title: 'AI 点评中...', mask: true });
    try {
      const task = this.data.selectedTask;
      const res = await api.reviewWarmupAnswer({
        titleEn: this.data.topic.title,
        titleZh: this.data.topic.titleZh || '',
        mode: this.data.mode,
        taskTitle: task.title || task.titleZh || '',
        taskDescription: task.prompt || task.description || task.promptZh || task.descriptionZh || '',
        answer: answer,
        inputMode: this.data.inputMode
      });
      const parsed = parseAiContent(res.content || res);
      if (!parsed || parsed.error) {
        throw new Error(parsed && parsed.error ? parsed.error : 'AI 返回格式异常');
      }
      this.setData({ reviewData: parsed, ['loadingMap.review']: false });
      wx.hideLoading();
      wx.pageScrollTo({ selector: '#review-panel', offsetTop: -20 });
    } catch (err) {
      console.error('Review failed:', err);
      this.setData({ ['loadingMap.review']: false });
      wx.hideLoading();
      wx.showToast({ title: err.message || '点评失败，请重试', icon: 'none' });
    }
  }
});
