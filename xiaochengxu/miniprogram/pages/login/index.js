const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    agree: false,
    showTip: false,
    loading: false
  },

  toggleAgree() {
    this.setData({ agree: !this.data.agree });
  },

  handleWechatLogin() {
    if (!this.data.agree) {
      this.setData({ showTip: true });
      setTimeout(() => this.setData({ showTip: false }), 2000);
      return;
    }

    this.setData({ loading: true });

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          this.setData({ loading: false });
          wx.showToast({ title: '微信登录失败', icon: 'none' });
          return;
        }

        api.wechatLogin(loginRes.code).then((res) => {
          this.setData({ loading: false });
          if (res && res.token) {
            app.setLogin(res.token, {
              username: res.username,
              role: res.role,
              membershipExpireAt: res.membershipExpireAt,
              membershipActive: res.membershipActive,
              hasPassword: res.hasPassword
            });
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
            wx.showToast({ title: '登录失败', icon: 'none' });
          }
        }).catch((err) => {
          this.setData({ loading: false });
          wx.showToast({ title: err.message || '登录失败', icon: 'none' });
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  }
});
