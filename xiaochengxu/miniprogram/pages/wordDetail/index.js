const api = require('../../utils/api');
const auth = require('../../utils/auth');
const audio = require('../../utils/audio');

Page({
  data: {
    id: null,
    word: null,
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
  }
});
