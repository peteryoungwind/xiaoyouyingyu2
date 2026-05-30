const api = require('../../utils/api');
const auth = require('../../utils/auth');

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
    if (!auth.checkLoginAndRedirect()) {
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
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
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
