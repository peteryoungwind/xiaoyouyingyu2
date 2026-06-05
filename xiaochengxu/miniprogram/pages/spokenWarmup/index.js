const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    topics: [],
    tags: [],
    keyword: '',
    selectedTag: '',
    startDate: '',
    endDate: '',
    page: 0,
    size: 10,
    totalPages: 0,
    loading: false,
    loadingMore: false,
    error: ''
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    this.loadTags();
    this.loadTopics(true);
  },

  async loadTags() {
    try {
      const stats = await api.getTagStats();
      this.setData({ tags: util.buildOrderedTagList(stats || {}) });
    } catch (err) {
      console.error('Load warmup tags failed:', err);
    }
  },

  async loadTopics(reset) {
    if (this.data.loading || this.data.loadingMore) return;
    const page = reset ? 0 : this.data.page;
    this.setData({ loading: reset, loadingMore: !reset, error: '' });
    try {
      const params = { page, size: this.data.size };
      if (this.data.keyword) params.keyword = this.data.keyword;
      if (this.data.selectedTag) params.tag = this.data.selectedTag;
      if (this.data.startDate) params.startDate = this.data.startDate;
      if (this.data.endDate) params.endDate = this.data.endDate;
      const res = await api.getTopics(params);
      const newTopics = (res.content || []).map(t => {
        const normalizedTags = util.normalizeKnownTags(t.tags);
        return {
          id: t.id,
          title: t.title,
          titleZh: t.titleZh,
          eventDate: util.formatDate(t.eventDate),
          tagList: normalizedTags.length > 0 ? normalizedTags : util.parseTags(t.tags)
        };
      });
      this.setData({
        topics: reset ? newTopics : this.data.topics.concat(newTopics),
        page: page + 1,
        totalPages: res.totalPages || 0,
        loading: false,
        loadingMore: false
      });
    } catch (err) {
      console.error('Load warmup topics failed:', err);
      this.setData({
        loading: false,
        loadingMore: false,
        error: err.message || '加载失败，点击重试'
      });
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.setData({ page: 0 });
    this.loadTopics(true);
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag || '';
    this.setData({
      selectedTag: this.data.selectedTag === tag ? '' : tag,
      page: 0
    });
    this.loadTopics(true);
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value, page: 0 });
    this.loadTopics(true);
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value, page: 0 });
    this.loadTopics(true);
  },

  clearDates() {
    this.setData({ startDate: '', endDate: '', page: 0 });
    this.loadTopics(true);
  },

  retry() {
    this.loadTopics(true);
  },

  goToDetail(e) {
    wx.navigateTo({ url: '/pages/spokenWarmupDetail/index?id=' + e.currentTarget.dataset.id });
  },

  onReachBottom() {
    if (this.data.page < this.data.totalPages) {
      this.loadTopics(false);
    }
  },

  onPullDownRefresh() {
    this.loadTopics(true).then(() => wx.stopPullDownRefresh());
  }
});
