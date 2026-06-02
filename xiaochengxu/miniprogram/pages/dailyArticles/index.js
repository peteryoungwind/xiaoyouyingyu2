const app = getApp();
const api = require('../../utils/api');

function isAuthExpiredError(err) {
  return err && err.code === 401;
}

Page({
  data: {
    read: false,
    articles: [],
    page: 0,
    size: 10,
    totalPages: 0,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: ''
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    this.loadArticles(true);
  },

  onShow() {
    if (!app.checkLogin()) {
      return;
    }
  },

  switchTab(e) {
    const read = e.currentTarget.dataset.read === 'true';
    if (read === this.data.read) return;
    this.setData({ read: read, articles: [], page: 0, hasMore: true, error: '' });
    this.loadArticles(true);
  },

  loadArticles(reset) {
    if (this.data.loading || this.data.loadingMore) return;
    const page = reset ? 0 : this.data.page;
    this.setData(reset ? { loading: true, error: '' } : { loadingMore: true });

    api.getDailyArticles({
      read: this.data.read,
      page: page,
      size: this.data.size
    }).then(res => {
      const items = (res.content || []).map(item => ({
        id: item.id,
        title: item.title,
        titleZh: item.titleZh,
        publishedDate: item.publishedDate || '',
        read: item.read
      }));
      this.setData({
        articles: reset ? items : this.data.articles.concat(items),
        page: page + 1,
        totalPages: res.totalPages || 0,
        hasMore: (page + 1) < (res.totalPages || 0),
        loading: false,
        loadingMore: false,
        error: ''
      });
    }).catch(err => {
      console.error('Load daily articles failed:', err);
      this.setData({
        loading: false,
        loadingMore: false,
        error: isAuthExpiredError(err) ? '' : (err.message || '加载失败')
      });
      if (!isAuthExpiredError(err)) {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    });
  },

  retry() {
    this.loadArticles(true);
  },

  goToDetail(e) {
    wx.navigateTo({ url: '/pages/dailyArticleDetail/index?id=' + e.currentTarget.dataset.id });
  },

  onPullDownRefresh() {
    this.loadArticles(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadArticles(false);
    }
  }
});
