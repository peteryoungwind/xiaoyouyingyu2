const api = require('../../utils/api');
const auth = require('../../utils/auth');

function isForbiddenError(err) {
  return err && err.code === 403;
}

Page({
  data: {
    bookId: null,
    difficulty: 'BEGINNER',
    word: null,
    progress: null,
    loading: true,
    submitting: false,
    completed: false
  },

  onLoad(options) {
    this.setData({
      bookId: options.bookId,
      difficulty: options.difficulty || 'BEGINNER'
    });
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
        submitting: false
      });
    }).catch(err => {
      console.error('Load next word failed:', err);
      this.setData({ loading: false, submitting: false });
      if (isForbiddenError(err)) {
        auth.handlePermissionDenied(err.message);
        return;
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  answer(e) {
    if (!this.data.word || this.data.submitting) return;
    const result = e.currentTarget.dataset.result;
    this.setData({ submitting: true });
    api.submitWordAnswer(this.data.word.id, result).then(() => {
      this.loadNext();
    }).catch(err => {
      console.error('Submit word answer failed:', err);
      this.setData({ submitting: false });
      if (isForbiddenError(err)) {
        auth.handlePermissionDenied(err.message);
        return;
      }
      wx.showToast({ title: '提交失败', icon: 'none' });
    });
  },

  showDetail() {
    if (!this.data.word) return;
    wx.navigateTo({ url: '/pages/wordDetail/index?id=' + this.data.word.id });
  },

  playAudio(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '暂无音频', icon: 'none' });
      return;
    }
    const audio = wx.createInnerAudioContext();
    audio.src = url;
    audio.play();
  }
});
