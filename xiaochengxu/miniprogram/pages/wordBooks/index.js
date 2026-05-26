const api = require('../../utils/api');
const auth = require('../../utils/auth');
const app = getApp();

function isForbiddenError(err) {
  return err && err.code === 403;
}

Page({
  data: {
    loading: true,
    books: []
  },

  onLoad() {
    this.ensureAccess();
  },

  onShow() {
    this.ensureAccess();
  },

  ensureAccess() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    this.loadBooks();
  },

  loadBooks() {
    this.setData({ loading: true });
    api.getWordBooks().then(res => {
      this.setData({ books: res || [], loading: false });
    }).catch(err => {
      console.error('Load word books failed:', err);
      this.setData({ loading: false });
      if (isForbiddenError(err)) {
        auth.handlePermissionDenied(err.message);
        return;
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  goToBook(e) {
    wx.navigateTo({ url: '/pages/wordBookDetail/index?id=' + e.currentTarget.dataset.id });
  },

  onPullDownRefresh() {
    this.loadBooks();
    wx.stopPullDownRefresh();
  }
});
