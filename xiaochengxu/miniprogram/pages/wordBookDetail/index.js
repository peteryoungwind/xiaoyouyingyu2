const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    id: null,
    difficulty: 'BEGINNER',
    book: null,
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.ensureAccess();
  },

  ensureAccess() {
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadBook();
  },

  loadBook() {
    this.setData({ loading: true });
    api.getWordBookDetail(this.data.id, this.data.difficulty).then(res => {
      this.setData({ book: res, loading: false });
    }).catch(err => {
      console.error('Load word book failed:', err);
      this.setData({ loading: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
    });
  },

  switchDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.difficulty });
    this.loadBook();
  },

  startPractice() {
    wx.navigateTo({
      url: '/pages/wordPractice/index?bookId=' + this.data.id + '&difficulty=' + this.data.difficulty
    });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => wx.redirectTo({ url: '/pages/wordBooks/index' })
    });
  }
});
