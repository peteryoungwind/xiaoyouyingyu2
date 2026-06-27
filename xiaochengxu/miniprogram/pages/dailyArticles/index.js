const app = getApp();
const api = require('../../utils/api');

function isAuthExpiredError(err) {
  return err && err.code === 401;
}

var COVER_KICKERS = ['DAILY', 'READ', 'NEWS', 'CITY'];
var COVER_MARKS = ['READ', 'A1', 'TOPIC', 'VIEW'];

function buildArticleCover(article, index) {
  var title = article.title || '';
  var words = title.split(/\s+/).filter(Boolean);
  var coverTitle = words.slice(0, 2).join('\n').toUpperCase();
  return {
    kicker: COVER_KICKERS[index % COVER_KICKERS.length],
    title: coverTitle || 'DAILY\nREAD',
    mark: COVER_MARKS[index % COVER_MARKS.length],
    theme: 'theme-' + (index % 3)
  };
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
      const baseIndex = reset ? 0 : this.data.articles.length;
      const items = (res.content || []).map((item, index) => ({
        id: item.id,
        title: item.title,
        titleZh: item.titleZh,
        read: item.read,
        cover: buildArticleCover(item, baseIndex + index)
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
