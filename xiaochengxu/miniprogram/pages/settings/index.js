const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    isMember: false,
    membershipActive: false,
    membershipExpireAt: '',
    remainingDays: 0,
    membershipStatus: '',
    membershipStatusLabel: '',
    contactInfo: null,

    // Change password form
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    submitting: false
  },

  onLoad() {
    this.refreshState();
  },

  onShow() {
    this.refreshState();
  },

  refreshState() {
    const isLoggedIn = app.globalData.isLoggedIn;
    const isMember = app.isMember();
    this.setData({ isLoggedIn, isMember });

    if (isLoggedIn) {
      this.loadMembership();
      if (!isMember) {
        this.loadContactInfo();
      }
    }
  },

  loadMembership() {
    api.getMembership().then(res => {
      const active = res.membershipActive || res.active || false;
      const expireAt = res.membershipExpireAt || res.expireAt || '';
      const remaining = res.remainingDays || 0;

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
        membershipStatusLabel: statusLabel,
        isMember: active || app.isAdmin()
      });
    }).catch(err => {
      console.error('Load membership failed:', err);
    });
  },

  loadContactInfo() {
    api.getMembershipContact().then(res => {
      this.setData({ contactInfo: res });
    }).catch(err => {
      console.error('Load contact info failed:', err);
    });
  },

  goToRedeem() {
    wx.navigateTo({ url: '/pages/redeem/index' });
  },

  // Password form handlers
  onOldPasswordInput(e) {
    this.setData({ oldPassword: e.detail.value });
  },

  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  onChangePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data;

    if (!oldPassword) {
      wx.showToast({ title: '请输入原密码', icon: 'none' });
      return;
    }
    if (!newPassword) {
      wx.showToast({ title: '请输入新密码', icon: 'none' });
      return;
    }
    if (newPassword.length < 6) {
      wx.showToast({ title: '新密码至少6位', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    api.changePassword(oldPassword, newPassword).then(res => {
      this.setData({
        submitting: false,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      wx.showToast({ title: '密码修改成功', icon: 'success' });
    }).catch(err => {
      this.setData({ submitting: false });
      const msg = (err && err.message) || '密码修改失败';
      wx.showToast({ title: msg, icon: 'none' });
    });
  }
});
