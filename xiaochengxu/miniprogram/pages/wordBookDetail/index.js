const api = require('../../utils/api');
const auth = require('../../utils/auth');

function isForbiddenError(err) {
  return err && err.code === 403;
}

Page({
  data: {
    id: null,
    difficulty: 'BEGINNER',
    book: null,
    learnedWords: [],
    wordFilter: 'ALL',
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadBook();
  },

  loadBook() {
    this.setData({ loading: true });
    api.getWordBookDetail(this.data.id, this.data.difficulty).then(res => {
      this.setData({ book: res, loading: false });
      this.loadLearnedWords();
    }).catch(err => {
      console.error('Load word book failed:', err);
      this.setData({ loading: false });
      if (isForbiddenError(err)) {
        auth.handlePermissionDenied(err.message);
        return;
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  switchDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.difficulty, learnedWords: [], wordFilter: 'ALL' });
    this.loadBook();
  },

  loadLearnedWords() {
    api.getWordBookWords(this.data.id, this.data.difficulty).then(res => {
      this.setData({ learnedWords: res || [] });
    }).catch(err => {
      console.error('Load learned words failed:', err);
      if (isForbiddenError(err)) {
        auth.handlePermissionDenied(err.message);
      }
    });
  },

  switchWordFilter(e) {
    this.setData({ wordFilter: e.currentTarget.dataset.filter });
  },

  goToWordDetail(e) {
    wx.navigateTo({ url: '/pages/wordDetail/index?id=' + e.currentTarget.dataset.id });
  },

  startPractice() {
    wx.navigateTo({
      url: '/pages/wordPractice/index?bookId=' + this.data.id + '&difficulty=' + this.data.difficulty
    });
  }
});
