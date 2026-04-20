const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

function isAuthExpiredError(err) {
  return err && err.code === 401;
}

Page({
  data: {
    isLoggedIn: false,
    username: '',
    role: '',
    roleLabel: '',
    membershipActive: false,
    membershipExpireAt: '',
    remainingDays: 0,
    membershipStatus: '', // active | expired | none
    membershipStatusLabel: ''
  },

  onLoad() {
    this.refreshState();
  },

  onShow() {
    this.refreshState();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  refreshState() {
    const isLoggedIn = app.globalData.isLoggedIn;
    if (!isLoggedIn) {
      this.setData({ isLoggedIn: false });
      return;
    }

    const userInfo = app.globalData.userInfo || {};
    const role = app.globalData.role || userInfo.role || 'USER';
    const roleLabel = this.getRoleLabel(role);

    this.setData({
      isLoggedIn: true,
      username: userInfo.username || '',
      role: role,
      roleLabel: roleLabel
    });

    // Fetch membership info
    this.loadMembership();
  },

  getRoleLabel(role) {
    const map = {
      'ADMIN': '管理员',
      'PREMIUM_USER': '高级用户',
      'USER': '普通用户'
    };
    return map[role] || '用户';
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
        membershipStatusLabel: statusLabel
      });

      app.globalData.membershipActive = active;
      app.globalData.membershipExpireAt = membership.expireAt;
      if (app.globalData.token && app.globalData.userInfo) {
        app.setLogin(app.globalData.token, {
          username: app.globalData.userInfo.username,
          role: app.globalData.role || app.globalData.userInfo.role || 'USER',
          membershipActive: active,
          membershipExpireAt: membership.expireAt,
          hasPassword: app.globalData.hasPassword
        });
      }
    }).catch(err => {
      if (isAuthExpiredError(err)) {
        return;
      }
      console.error('Load membership failed:', err);
    });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  browseAsGuest() {
    wx.switchTab({ url: '/pages/topics/index' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  goToRedeem() {
    wx.navigateTo({ url: '/pages/redeem/index' });
  },

  goToCalendar() {
    wx.navigateTo({ url: '/pages/calendar/index' });
  },

  onScanPcLogin() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }

    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: (res) => {
        const ticketId = this.extractPcLoginTicket(res.result);
        if (!ticketId) {
          wx.showToast({ title: '不是有效的电脑登录二维码', icon: 'none' });
          return;
        }
        this.confirmPcLogin(ticketId);
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') >= 0) {
          return;
        }
        wx.showToast({ title: '扫码失败，请重试', icon: 'none' });
      }
    });
  },

  extractPcLoginTicket(result) {
    if (!result || typeof result !== 'string') {
      return '';
    }
    const match = result.match(/ticket=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  },

  confirmPcLogin(ticketId) {
    wx.showLoading({ title: '校验中...' });
    api.getWechatPcLoginScene(ticketId).then(scene => {
      wx.hideLoading();
      const deviceInfo = scene.deviceInfo || '当前电脑';
      wx.showModal({
        title: '确认电脑端登录',
        content: '将使用当前小程序账号登录：\n' + deviceInfo,
        confirmText: '确认登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.submitPcLoginConfirm(ticketId);
            return;
          }
          this.submitPcLoginCancel(ticketId);
        }
      });
    }).catch(err => {
      wx.hideLoading();
      if (isAuthExpiredError(err)) {
        return;
      }
      wx.showToast({ title: err.message || '二维码不可用', icon: 'none' });
    });
  },

  submitPcLoginConfirm(ticketId) {
    wx.showLoading({ title: '确认中...' });
    api.confirmWechatPcLogin(ticketId).then(() => {
      wx.hideLoading();
      wx.showModal({
        title: '已确认',
        content: '电脑端登录已确认，请返回电脑继续使用。',
        showCancel: false
      });
    }).catch(err => {
      wx.hideLoading();
      if (isAuthExpiredError(err)) {
        return;
      }
      wx.showToast({ title: err.message || '确认失败', icon: 'none' });
    });
  },

  submitPcLoginCancel(ticketId) {
    api.cancelWechatPcLogin(ticketId).catch(() => {});
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({
            isLoggedIn: false,
            username: '',
            role: '',
            roleLabel: '',
            membershipActive: false,
            membershipExpireAt: '',
            remainingDays: 0,
            membershipStatus: '',
            membershipStatusLabel: ''
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  }
});
