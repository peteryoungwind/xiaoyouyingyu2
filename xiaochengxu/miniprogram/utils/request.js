/**
 * Unified request wrapper for the WeChat Mini Program.
 * Automatically attaches Authorization header and handles 401 responses.
 * Base URL comes from app.globalData.baseUrl.
 */
function getRuntimeApp() {
  var app = getApp();
  if (!app || !app.globalData) {
    throw new Error('小程序尚未完成初始化，请稍后重试');
  }
  if (!app.globalData.baseUrl && typeof app.initBaseUrlByEnv === 'function') {
    app.initBaseUrlByEnv();
  }
  return app;
}

function request(url, method, data) {
  return new Promise(function (resolve, reject) {
    var app;
    try {
      app = getRuntimeApp();
    } catch (e) {
      reject({ code: -1, message: e.message || '小程序初始化失败', detail: e });
      return;
    }

    var baseUrl = app.globalData.baseUrl;
    var token = app.globalData.token || wx.getStorageSync('token');
    var header = {
      'Content-Type': 'application/json'
    };

    if (token) {
      if (!app.globalData.token) {
        app.globalData.token = token;
      }
      header['Authorization'] = 'Bearer ' + token;
    }

    wx.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: header,
      success: function (res) {
        if (res.statusCode === 401) {
          console.warn('HTTP 401', method, url, res.data);
        } else if (res.statusCode === 403) {
          console.warn('HTTP 403', method, url, res.data);
        }

        if (res.statusCode === 401) {
          require('./auth').handleAuthExpired();
          reject({ code: res.statusCode, message: '登录已过期，请重新登录' });
          return;
        }

        if (res.statusCode === 403) {
          var forbiddenMsg = '请求失败，请稍后重试';
          if (res.data && res.data.error) {
            forbiddenMsg = res.data.error;
          } else if (res.data && res.data.message) {
            forbiddenMsg = res.data.message;
          }
          reject({ code: res.statusCode, message: forbiddenMsg, data: res.data });
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          var errMsg = '请求失败';
          if (res.data && res.data.error) {
            errMsg = res.data.error;
          } else if (res.data && res.data.message) {
            errMsg = res.data.message;
          }
          reject({ code: res.statusCode, message: errMsg, data: res.data });
        }
      },
      fail: function (err) {
        reject({ code: -1, message: '网络请求失败', detail: err });
      }
    });
  });
}

function get(url, data) {
  return request(url, 'GET', data);
}

function post(url, data) {
  return request(url, 'POST', data);
}

function put(url, data) {
  return request(url, 'PUT', data);
}

function del(url) {
  return request(url, 'DELETE');
}

function patch(url, data) {
  return request(url, 'PATCH', data);
}

function upload(url, filePath, name, formData) {
  return new Promise(function (resolve, reject) {
    var app;
    try {
      app = getRuntimeApp();
    } catch (e) {
      reject({ code: -1, message: e.message || '小程序初始化失败', detail: e });
      return;
    }

    var baseUrl = app.globalData.baseUrl;
    var token = app.globalData.token || wx.getStorageSync('token');
    var header = {};
    var uploadFormData = Object.assign({}, formData || {});
    if (!uploadFormData.filename) {
      uploadFormData.filename = audioFilename(filePath, uploadFormData.audioFormat);
    }
    if (!uploadFormData.contentType) {
      uploadFormData.contentType = audioContentType(filePath, uploadFormData.audioFormat);
    }
    if (token) {
      if (!app.globalData.token) {
        app.globalData.token = token;
      }
      header['Authorization'] = 'Bearer ' + token;
    }

    wx.uploadFile({
      url: baseUrl + url,
      filePath: filePath,
      name: name || 'file',
      formData: uploadFormData,
      header: header,
      success: function (res) {
        var data = res.data;
        try {
          data = data ? JSON.parse(data) : {};
        } catch (e) {}

        if (res.statusCode === 401) {
          require('./auth').handleAuthExpired();
          reject({ code: res.statusCode, message: '登录已过期，请重新登录', data: data });
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
          return;
        }

        var errMsg = '上传失败';
        if (data && data.error) {
          errMsg = data.error;
        } else if (data && data.message) {
          errMsg = data.message;
        }
        reject({ code: res.statusCode, message: errMsg, data: data });
      },
      fail: function (err) {
        console.error('Upload request failed:', url, err);
        reject({ code: -1, message: '上传失败，请检查网络', detail: err });
      }
    });
  });
}

function audioFilename(filePath, formatHint) {
  var normalizedHint = normalizeAudioFormat(formatHint);
  if (!filePath) return 'recording.' + (normalizedHint || 'mp3');
  var parts = String(filePath).split('/');
  var name = parts[parts.length - 1] || 'recording.' + (normalizedHint || 'mp3');
  return name.indexOf('.') >= 0 ? name : name + '.' + (normalizedHint || 'mp3');
}

function audioContentType(filePath, formatHint) {
  var normalizedHint = normalizeAudioFormat(formatHint);
  if (normalizedHint === 'wav') return 'audio/wav';
  if (normalizedHint === 'm4a' || normalizedHint === 'mp4') return 'audio/mp4';
  if (normalizedHint === 'aac') return 'audio/aac';
  if (normalizedHint === 'webm') return 'audio/webm';
  var lower = String(filePath || '').toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.webm')) return 'audio/webm';
  return 'audio/mpeg';
}

function normalizeAudioFormat(formatHint) {
  var value = String(formatHint || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'mpeg') return 'mp3';
  if (value === 'mp3' || value === 'wav' || value === 'm4a' || value === 'mp4' || value === 'aac' || value === 'webm') {
    return value;
  }
  return '';
}

module.exports = {
  request: request,
  get: get,
  post: post,
  put: put,
  del: del,
  patch: patch,
  upload: upload
};
