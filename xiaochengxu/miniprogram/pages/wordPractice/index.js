const api = require('../../utils/api');
const auth = require('../../utils/auth');
const audio = require('../../utils/audio');

Page({
  data: {
    bookId: null,
    difficulty: 'BEGINNER',
    word: null,
    progress: null,
    loading: true,
    submitting: false,
    completed: false,
    detailVisible: false
  },

  onLoad(options) {
    this.setData({
      bookId: options.bookId,
      difficulty: options.difficulty || 'BEGINNER'
    });
    this.ensureAccess();
  },

  ensureAccess() {
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadNext();
  },

  loadNext() {
    this.setData({ loading: true, completed: false });
    api.getNextWords(this.data.bookId, this.data.difficulty, 1).then(res => {
      const words = res.words || [];
      this.setData({
        word: words.length > 0 ? words[0] : null,
        progress: res.progress,
        completed: words.length === 0,
        loading: false,
        submitting: false,
        detailVisible: false
      });
    }).catch(err => {
      console.error('Load next word failed:', err);
      this.setData({ loading: false, submitting: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
    });
  },

  answer(e) {
    if (!this.data.word || this.data.submitting) return;
    const result = e.currentTarget.dataset.result;
    this.setData({ submitting: true });
    api.submitWordAnswer(this.data.word.id, result).then(res => {
      if (result !== 'KNOWN') {
        this.setData({
          progress: res.bookProgress || this.data.progress,
          submitting: false,
          detailVisible: true
        });
        return;
      }
      this.loadNext();
    }).catch(err => {
      console.error('Submit word answer failed:', err);
      this.setData({ submitting: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '提交失败');
    });
  },

  playAudio(e) {
    audio.play(e.currentTarget.dataset.url);
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => wx.redirectTo({ url: '/pages/wordBooks/index' })
    });
  }
});
