var app = getApp();

function getAssetBaseUrl() {
  var baseUrl = (app.globalData && app.globalData.baseUrl) || '';
  return baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function resolveAudioUrl(url) {
  if (!url) return '';
  if (/^(https?:)?\/\//.test(url) || /^wxfile:\/\//.test(url) || /^cloud:\/\//.test(url)) {
    return url;
  }

  var assetBaseUrl = getAssetBaseUrl();
  if (!assetBaseUrl) return url;

  if (url.charAt(0) === '/') {
    return assetBaseUrl + url;
  }
  return assetBaseUrl + '/' + url;
}

function play(url) {
  var audioUrl = resolveAudioUrl(url);
  if (!audioUrl) {
    wx.showToast({ title: '暂无音频', icon: 'none' });
    return;
  }

  var audio = wx.createInnerAudioContext();
  audio.src = audioUrl;
  audio.onEnded(function () {
    audio.destroy();
  });
  audio.onError(function (err) {
    console.error('Play word audio failed:', err, audioUrl);
    wx.showToast({ title: '音频播放失败', icon: 'none' });
    audio.destroy();
  });
  audio.play();
}

module.exports = {
  play: play,
  resolveAudioUrl: resolveAudioUrl
};
