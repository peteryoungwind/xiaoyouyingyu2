const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    code: '',
    submitting: false,
    result: null, // { success, message, daysAdded, membershipExpireAt }
    showResult: false,

    // Current membership
    membershipActive: false,
    membershipExpireAt: '',
    remainingDays: 0,
    membershipStatus: '',
    membershipStatusLabel: ''
  },

  onLoad() {
    this.loadMembership();
  },

  onShow() {
    this.loadMembership();
  },

  loadMembership() {
    if (!app.globalData.isLoggedIn) return;

    api.getMembership().then(res => {
      const membership = util.resolveMembershipResponse(res);
      const active = membership.active;
      const expireAt = membership.formattedExpireAt;
      const remaining = membership.remainingDays;

      let status = 'none';
      let statusLabel = '未开通';
      if (active) {
        status = 'active';
        statusLabel = '会员中';
      } else if (expireAt) {
        status = 'expired';
        statusLabel = '已过期';
      }

      this.setData({
        membershipActive: active,
        membershipExpireAt: expireAt,
        remainingDays: remaining,
        membershipStatus: status,
        membershipStatusLabel: statusLabel
      });
    }).catch(err => {
      console.error('Load membership failed:', err);
    });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  onRedeem() {
    const code = this.data.code.trim();
    if (!code) {
      wx.showToast({ title: '请输入兑换码', icon: 'none' });
      return;
    }

    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }

    this.setData({ submitting: true, showResult: false });

    api.redeemCode(code).then(res => {
      this.setData({
        submitting: false,
        showResult: true,
        result: {
          success: true,
          message: res.message || '兑换成功',
          daysAdded: res.daysAdded,
          membershipExpireAt: util.formatDateTime(res.membershipExpireAt)
        },
        code: ''
      });

      // Update global membership state
      app.globalData.membershipActive = true;
      app.globalData.membershipExpireAt = util.formatDateTime(res.membershipExpireAt || '');
      wx.setStorageSync('membershipActive', true);
      wx.setStorageSync('membershipExpireAt', util.formatDateTime(res.membershipExpireAt || ''));

      // Reload membership info
      this.loadMembership();

      wx.showToast({ title: '兑换成功', icon: 'success' });
    }).catch(err => {
      this.setData({
        submitting: false,
        showResult: true,
        result: {
          success: false,
          message: (err && err.message) || '兑换失败，请检查兑换码是否正确'
        }
      });
    });
  },

  onClearResult() {
    this.setData({ showResult: false, result: null });
  }
});
