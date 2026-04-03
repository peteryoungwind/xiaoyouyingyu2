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

  async handleLogin() {
    const { username, password } = this.data;
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '登录中...' });

    try {
      const res = await api.login(username.trim(), password);
      wx.hideLoading();
      if (res && res.token) {
        app.setLogin(res.token, res);
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack();
          } else {
            wx.switchTab({ url: '/pages/home/index' });
          }
        }, 1000);
      } else {
        wx.showToast({ title: '用户名或密码错误', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleWechatLogin() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToRegister() {
    wx.redirectTo({ url: '/pages/register/index' });
  }
});
