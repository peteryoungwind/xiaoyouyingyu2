var app = getApp();

/**
 * Unified request wrapper for the WeChat Mini Program.
 * Automatically attaches Authorization header and handles 401 responses.
 * Base URL comes from app.globalData.baseUrl.
 */
function request(url, method, data) {
  return new Promise(function (resolve, reject) {
    var baseUrl = app.globalData.baseUrl;
    var token = app.globalData.token;
    var header = {
      'Content-Type': 'application/json'
    };

    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }

    wx.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: header,
      success: function (res) {
        if (res.statusCode === 401 || res.statusCode === 403) {
          require('./auth').handleAuthExpired();
          reject({ code: res.statusCode, message: '登录已过期，请重新登录' });
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

module.exports = {
  request: request,
  get: get,
  post: post,
  put: put,
  del: del,
  patch: patch
};
