var api = require('./api');
var util = require('./util');

var app = getApp();

/**
 * Check if user is logged in. If not, redirect to login page.
 * @returns {boolean} true if logged in, false otherwise
 */
function checkLoginAndRedirect() {
  if (!app.checkLogin()) {
    wx.navigateTo({
      url: '/pages/login/index'
    });
    return false;
  }
  return true;
}

/**
 * Check if user is a member (ADMIN or has active membership).
 * If not, show the membership modal.
 * @returns {boolean} true if member, false otherwise
 */
function checkMemberAndShowModal() {
  if (!app.checkLogin()) {
    wx.navigateTo({
      url: '/pages/login/index'
    });
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
  refreshMembership: refreshMembership
};
