const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

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
    hasPassword: true,

    showUsernameModal: false,
    showPasswordModal: false,

    // Change username form
    username: '',
    originalUsername: '',
    submittingUsername: false,

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
    const username = (app.globalData.userInfo && app.globalData.userInfo.username) || '';
    const hasPassword = app.globalData.hasPassword !== undefined ? app.globalData.hasPassword : true;
    this.setData({ isLoggedIn, isMember, username, originalUsername: username, hasPassword });

    if (isLoggedIn) {
      this.loadMembership();
      if (!isMember) {
        this.loadContactInfo();
      }
    }
  },

  loadMembership() {
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

  openUsernameModal() {
    this.setData({
      showUsernameModal: true,
      username: this.data.originalUsername
    });
  },

  closeUsernameModal() {
    this.setData({
      showUsernameModal: false,
      username: this.data.originalUsername,
      submittingUsername: false
    });
  },

  openPasswordModal() {
    this.setData({
      showPasswordModal: true,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  },

  closePasswordModal() {
    this.setData({
      showPasswordModal: false,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      submitting: false
    });
  },

  stopModalPropagation() {},

  // Username form handlers
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onChangeUsername() {
    const { username, originalUsername } = this.data;
    const nextUsername = (username || '').trim();

    if (!nextUsername) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (nextUsername.length < 3 || nextUsername.length > 50) {
      wx.showToast({ title: '用户名需为3-50位', icon: 'none' });
      return;
    }
    if (nextUsername === originalUsername) {
      wx.showToast({ title: '用户名未变更', icon: 'none' });
      return;
    }

    this.setData({ submittingUsername: true });

    api.changeUsername(nextUsername).then(res => {
      app.setLogin(res.token, {
        username: res.username,
        role: res.role,
        membershipExpireAt: util.formatDateTime(res.membershipExpireAt),
        membershipActive: res.membershipActive,
        hasPassword: res.hasPassword
      });
      this.setData({
        username: res.username,
        originalUsername: res.username,
        submittingUsername: false,
        showUsernameModal: false
      });
      wx.showToast({ title: '用户名修改成功', icon: 'success' });
    }).catch(err => {
      this.setData({ submittingUsername: false });
      const msg = (err && err.message) || '用户名修改失败';
      wx.showToast({ title: msg, icon: 'none' });
    });
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
    const { hasPassword, oldPassword, newPassword, confirmPassword } = this.data;

    if (hasPassword && !oldPassword) {
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

    const request = hasPassword
      ? api.changePassword(oldPassword, newPassword)
      : api.setupPassword(newPassword);
    const successTitle = hasPassword ? '密码修改成功' : '密码设置成功';

    request.then(() => {
      app.globalData.hasPassword = true;
      if (app.globalData.userInfo) {
        app.globalData.userInfo.hasPassword = true;
      }
      wx.setStorageSync('hasPassword', true);
      this.setData({
        hasPassword: true,
        submitting: false,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswordModal: false
      });
      wx.showToast({ title: successTitle, icon: 'success' });
    }).catch(err => {
      this.setData({ submitting: false });
      const defaultMsg = hasPassword ? '密码修改失败' : '密码设置失败';
      const msg = (err && err.message) || defaultMsg;
      wx.showToast({ title: msg, icon: 'none' });
    });
  }
});
