const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    username: '',
    password: '',
    usernameFocus: false,
    passwordFocus: false,
    loading: false
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onUsernameFocus() {
    this.setData({ usernameFocus: true });
  },

  onUsernameBlur() {
    this.setData({ usernameFocus: false });
  },

  onPasswordFocus() {
    this.setData({ passwordFocus: true });
  },

  onPasswordBlur() {
    this.setData({ passwordFocus: false });
  },

  async handleRegister() {
    const { username, password } = this.data;
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (username.trim().length < 3 || username.trim().length > 50) {
      wx.showToast({ title: '用户名需3-50个字符', icon: 'none' });
      return;
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6个字符', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '注册中...' });

    try {
      const res = await api.register(username.trim(), password);
      wx.hideLoading();
      if (res && res.token) {
        app.setLogin(res.token, {
          username: res.username,
          role: res.role,
          membershipExpireAt: res.membershipExpireAt,
          membershipActive: res.membershipActive,
          hasPassword: res.hasPassword
        });
        wx.showToast({ title: '注册成功，已赠送3天会员', icon: 'none', duration: 2000 });
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack();
          } else {
            wx.switchTab({ url: '/pages/home/index' });
          }
        }, 1500);
      } else {
        wx.showToast({ title: '注册失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '注册失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleWechatLogin() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToLogin() {
    wx.redirectTo({ url: '/pages/login/index' });
  }
});
