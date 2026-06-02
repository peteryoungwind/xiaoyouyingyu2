const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    configLoading: false,
    topicsLoading: false,
    config: null,
    mode: 'TEACHING',
    difficulty: 'BEGINNER',
    topicSource: 'SYSTEM',
    topicId: null,
    selectedTopic: null,
    customTopic: '',
    keyword: '',
    topics: [],
    page: 0,
    size: 5,
    hasMore: true,
    searched: false,
    error: ''
  },

  onLoad(options) {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    if (options.topicId) {
      this.setData({ topicId: Number(options.topicId), topicSource: 'SYSTEM' });
    }
    this.loadConfig();
    this.loadTopics(true);
  },

  loadConfig() {
    this.setData({ configLoading: true, error: '' });
    api.getAiDialogConfig().then(res => {
      this.setData({ config: res, configLoading: false });
      if (res && res.enabled === false) {
        this.setData({ error: 'AI 对话暂不可用，请稍后再试' });
      }
    }).catch(err => {
      this.setData({ configLoading: false, error: err.message || '配置加载失败' });
    });
  },

  loadTopics(reset) {
    if (this.data.topicsLoading) return;
    var page = reset ? 0 : this.data.page;
    var keyword = this.data.keyword.trim();
    this.setData({ topicsLoading: true });
    api.getTopics({
      page: page,
      size: keyword ? 10 : 5,
      keyword: keyword
    }).then(res => {
      var list = (res.content || []).map(t => {
        var tags = util.parseTags(t.tags);
        return {
          id: t.id,
          title: t.title,
          titleZh: t.titleZh,
          tagsText: tags.join(' · ')
        };
      });
      var selected = this.data.selectedTopic;
      if (!selected && this.data.topicId) {
        selected = list.find(t => t.id === this.data.topicId) || null;
      }
      this.setData({
        topics: reset ? list : this.data.topics.concat(list),
        page: page + 1,
        hasMore: !!keyword && (page + 1) < (res.totalPages || 0),
        selectedTopic: selected,
        topicsLoading: false
      });
    }).catch(err => {
      this.setData({ topicsLoading: false, error: err.message || '主题加载失败' });
    });
  },

  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.value });
  },

  setDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.value });
  },

  setTopicSource(e) {
    this.setData({ topicSource: e.currentTarget.dataset.value });
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.setData({ searched: !!this.data.keyword.trim() });
    this.loadTopics(true);
  },

  onCustomTopicInput(e) {
    this.setData({ customTopic: e.detail.value.slice(0, 100) });
  },

  selectTopic(e) {
    var id = Number(e.currentTarget.dataset.id);
    var selected = this.data.topics.find(t => t.id === id);
    this.setData({ topicId: id, selectedTopic: selected });
  },

  startDialog() {
    if (!this.data.config || this.data.config.enabled === false) {
      wx.showToast({ title: 'AI 对话暂不可用', icon: 'none' });
      return;
    }
    if (this.data.topicSource === 'SYSTEM' && !this.data.topicId) {
      wx.showToast({ title: '请选择主题', icon: 'none' });
      return;
    }
    if (this.data.topicSource === 'CUSTOM' && !this.data.customTopic.trim()) {
      wx.showToast({ title: '请输入主题', icon: 'none' });
      return;
    }
    var params = [
      'mode=' + this.data.mode,
      'difficulty=' + this.data.difficulty,
      'topicSource=' + this.data.topicSource
    ];
    if (this.data.topicSource === 'SYSTEM') {
      params.push('topicId=' + this.data.topicId);
      if (this.data.selectedTopic) {
        params.push('topicTitle=' + encodeURIComponent(this.data.selectedTopic.title || ''));
        params.push('topicTitleZh=' + encodeURIComponent(this.data.selectedTopic.titleZh || ''));
      }
    } else {
      params.push('customTopic=' + encodeURIComponent(this.data.customTopic.trim()));
    }
    wx.navigateTo({ url: '/pages/aiDialogChat/index?' + params.join('&') });
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadTopics(false);
  }
});
