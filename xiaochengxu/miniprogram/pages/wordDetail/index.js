const api = require('../../utils/api');
const auth = require('../../utils/auth');
const audio = require('../../utils/audio');

Page({
  data: {
    id: null,
    word: null,
    loading: true,
    submitting: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.ensureAccess();
  },

  ensureAccess() {
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadWord();
  },

  loadWord() {
    this.setData({ loading: true });
    api.getWordDetail(this.data.id).then(res => {
      this.setData({ word: res, loading: false });
    }).catch(err => {
      console.error('Load word detail failed:', err);
      this.setData({ loading: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
    });
  },

  playAudio(e) {
    audio.play(e.currentTarget.dataset.url);
  },

  answer(e) {
    if (!this.data.word || this.data.submitting) return;
    const result = e.currentTarget.dataset.result;
    this.setData({ submitting: true });
    api.submitWordAnswer(this.data.word.id, result).then(() => {
      this.setData({ submitting: false });
      wx.showToast({ title: '已记录', icon: 'success' });
    }).catch(err => {
      console.error('Submit word detail answer failed:', err);
      this.setData({ submitting: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '提交失败');
    });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => wx.redirectTo({ url: '/pages/wordBooks/index' })
    });
  }
});
