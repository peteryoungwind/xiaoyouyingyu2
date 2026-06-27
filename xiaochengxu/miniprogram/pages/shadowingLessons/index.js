const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    learned: false,
    lessons: [],
    page: 0,
    size: 10,
    totalPages: 0,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: '',
    isLoggedIn: false
  },

  onLoad() {
    this.setData({ isLoggedIn: app.checkLogin() });
    this.loadLessons(true);
  },

  onShow() {
    this.setData({ isLoggedIn: app.checkLogin() });
  },

  switchTab(e) {
    const learned = e.currentTarget.dataset.learned === 'true';
    if (learned === this.data.learned) return;
    this.setData({ learned: learned, lessons: [], page: 0, hasMore: true, error: '' });
    this.loadLessons(true);
  },

  loadLessons(reset) {
    if (this.data.loading || this.data.loadingMore) return;
    const page = reset ? 0 : this.data.page;
    this.setData(reset ? { loading: true, error: '' } : { loadingMore: true });

    api.getShadowingLessons({
      learned: this.data.learned,
      page: page,
      size: this.data.size
    }).then(res => {
      const items = (res.content || []).map(item => ({
        id: item.id,
        title: item.title || '',
        titleZh: item.titleZh || '',
        description: item.description || '',
        category: item.category || '',
        topic: item.topic || '',
        sourceName: item.sourceName || '',
        thumbnailUrl: item.thumbnailUrl || '',
        publishedDate: item.publishedDate || '',
        sentenceCount: item.sentenceCount || 0,
        expressionCount: item.expressionCount || 0,
        learned: item.learned
      }));
      this.setData({
        lessons: reset ? items : this.data.lessons.concat(items),
        page: page + 1,
        totalPages: res.totalPages || 0,
        hasMore: (page + 1) < (res.totalPages || 0),
        loading: false,
        loadingMore: false,
        error: ''
      });
    }).catch(err => {
      console.error('Load shadowing lessons failed:', err);
      this.setData({
        loading: false,
        loadingMore: false,
        error: err.message || '加载失败'
      });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    });
  },

  retry() {
    this.loadLessons(true);
  },

  goToDetail(e) {
    wx.navigateTo({ url: '/pages/shadowingLessonDetail/index?id=' + e.currentTarget.dataset.id });
  },

  goToUnlearned() {
    this.setData({ learned: false, lessons: [], page: 0, hasMore: true, error: '' });
    this.loadLessons(true);
  },

  onPullDownRefresh() {
    this.loadLessons(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadLessons(false);
    }
  },

  onShareAppMessage() {
    return {
      title: '小柚英语｜跟读精听',
      path: '/pages/shadowingLessons/index'
    };
  }
});
