var api = require('./api');
var util = require('./util');

var app = getApp();
var authExpiredModalVisible = false;
var authExpiredNavigating = false;

function isLoginPage() {
  var pages = getCurrentPages();
  var currentPage = pages[pages.length - 1];
  return !!(currentPage && currentPage.route === 'pages/login/index');
}

function resetAuthExpiredPromptState() {
  authExpiredModalVisible = false;
  authExpiredNavigating = false;
}

function handleAuthExpired() {
  app.logout();

  if (isLoginPage() || authExpiredModalVisible || authExpiredNavigating) {
    return;
  }

  authExpiredModalVisible = true;
  wx.showModal({
    title: '登录已过期',
    content: '当前登录状态已失效，请重新登录后继续使用。',
    confirmText: '去登录',
    cancelText: '取消',
    success: function (res) {
      authExpiredModalVisible = false;
      if (!res.confirm || authExpiredNavigating || isLoginPage()) {
        return;
      }
      authExpiredNavigating = true;
      wx.navigateTo({
        url: '/pages/login/index',
        complete: function () {
          authExpiredNavigating = false;
        }
      });
    },
    fail: function () {
      authExpiredModalVisible = false;
    }
  });
}

function handlePermissionDenied(message) {
  wx.showToast({
    title: message || '请开通会员后继续使用',
    icon: 'none'
  });
  wx.switchTab({ url: '/pages/learning/index' });
}

/**
 * Check if user is logged in.
 * @returns {boolean} true if logged in, false otherwise
 */
function checkLoginAndRedirect() {
  return app.checkLogin();
}

/**
 * Check if user is a member (ADMIN or has active membership).
 * If not logged in, return false and let the page decide whether to prompt login.
 * If logged in but not a member, show the membership modal.
 * @returns {boolean} true if member, false otherwise
 */
function checkMemberAndShowModal() {
  if (!app.checkLogin()) {
    return false;
  }

  if (!app.isMember()) {
    // Get current page instance and trigger membership modal
    var pages = getCurrentPages();
    var currentPage = pages[pages.length - 1];
    if (currentPage && currentPage.setData) {
      currentPage.setData({ showMembershipModal: true });
    }
    return false;
  }
  return true;
}

/**
 * Refresh membership info from backend and update globalData.
 * @returns {Promise}
 */
function refreshMembership() {
  return api.getMembership().then(function (res) {
    var membership = util.resolveMembershipResponse(res);
    app.globalData.membershipActive = membership.active;
    app.globalData.membershipExpireAt = membership.expireAt;
    wx.setStorageSync('membershipActive', membership.active);
    wx.setStorageSync('membershipExpireAt', membership.expireAt);
    return res;
  }).catch(function (err) {
    console.error('Refresh membership failed:', err);
    throw err;
  });
}

module.exports = {
  checkLoginAndRedirect: checkLoginAndRedirect,
  checkMemberAndShowModal: checkMemberAndShowModal,
  refreshMembership: refreshMembership,
  handleAuthExpired: handleAuthExpired,
  handlePermissionDenied: handlePermissionDenied,
  resetAuthExpiredPromptState: resetAuthExpiredPromptState
};
