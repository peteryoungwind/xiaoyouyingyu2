const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    topics: [],
    tags: [],
    selectedTag: '',
    keyword: '',
    page: 0,
    size: 10,
    totalPages: 0,
    loading: false,
    loadingMore: false,
    isLoggedIn: false
  },

  onLoad() {
    this.loadTags();
    this.loadTopics(true);
  },

  onShow() {
    this.setData({ isLoggedIn: app.checkLogin() });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    // Check if there's a pending filter from another page
    var pending = app.globalData._pendingTopicFilter;
    if (pending) {
      delete app.globalData._pendingTopicFilter;
      if (pending.type === 'tag') {
        this.setData({ selectedTag: pending.value, keyword: '', page: 0 });
      } else if (pending.type === 'keyword') {
        this.setData({ keyword: pending.value, selectedTag: '', page: 0 });
      }
      this.loadTopics(true);
    }
  },

  setTagFilter(tag) {
    this.setData({ selectedTag: tag, keyword: '', page: 0 });
    this.loadTopics(true);
  },

  setKeywordFilter(keyword) {
    this.setData({ keyword: keyword, selectedTag: '', page: 0 });
    this.loadTopics(true);
  },

  async loadTags() {
    try {
      const tagsData = await api.getTagStats();
      const tags = util.buildOrderedTagList(tagsData);
      this.setData({ tags });
    } catch (e) { console.error(e); }
  },

  async loadTopics(reset = false) {
    if (this.data.loading) return;
    const page = reset ? 0 : this.data.page;
    this.setData({ loading: reset, loadingMore: !reset });

    try {
      const params = { page, size: this.data.size };
      if (this.data.keyword) params.keyword = this.data.keyword;
      if (this.data.selectedTag) params.tag = this.data.selectedTag;

      const res = await api.getTopics(params);
      const newTopics = (res.content || []).map(t => {
        const normalizedTags = util.normalizeKnownTags(t.tags);
        const tagList = normalizedTags.length > 0 ? normalizedTags : util.parseTags(t.tags);
        let questionCountText = '';
        if (t.questions) {
          try {
            const questions = typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions;
            if (Array.isArray(questions) && questions.length > 0) {
              questionCountText = questions.length + ' 个讨论问题';
            }
          } catch (err) {}
        }
        return {
          ...t,
          eventDate: util.formatDate(t.eventDate),
          tagList,
          questionCountText
        };
      });

      this.setData({
        topics: reset ? newTopics : [...this.data.topics, ...newTopics],
        page: page + 1,
        totalPages: res.totalPages || 0,
        loading: false,
        loadingMore: false
      });
    } catch (e) {
      console.error(e);
      if (e.message && e.message.includes('登录')) {
        wx.showToast({ title: '请登录后搜索', icon: 'none' });
      }
      this.setData({ loading: false, loadingMore: false });
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    if (!app.checkLogin() && this.data.keyword) {
      wx.showModal({
        title: '提示', content: '请先登录后使用搜索功能',
        confirmText: '去登录', cancelText: '取消',
        success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/login/index' }); }
      });
      return;
    }
    this.loadTopics(true);
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag: this.data.selectedTag === tag ? '' : tag,
      page: 0
    });
    this.loadTopics(true);
  },

  onReachBottom() {
    if (this.data.page < this.data.totalPages) {
      this.loadTopics(false);
    }
  },

  onPullDownRefresh() {
    this.loadTopics(true).then(() => wx.stopPullDownRefresh());
  },

  goToDetail(e) {
    wx.navigateTo({ url: '/pages/topicDetail/index?id=' + e.currentTarget.dataset.id });
  },

  goToCalendar() {
    wx.navigateTo({ url: '/pages/calendar/index' });
  }
});
