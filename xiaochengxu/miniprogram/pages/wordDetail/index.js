const api = require('../../utils/api');
const auth = require('../../utils/auth');

function isForbiddenError(err) {
  return err && err.code === 403;
}

Page({
  data: {
    id: null,
    word: null,
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadWord();
  },

  loadWord() {
    this.setData({ loading: true });
    api.getWordDetail(this.data.id).then(res => {
      this.setData({ word: res, loading: false });
    }).catch(err => {
      console.error('Load word detail failed:', err);
      this.setData({ loading: false });
      if (isForbiddenError(err)) {
        auth.handlePermissionDenied(err.message);
        return;
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
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
