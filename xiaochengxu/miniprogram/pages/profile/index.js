const app = getApp();
const api = require('../../utils/api');

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
        membershipStatusLabel: statusLabel
      });

      // Update global state
      app.globalData.membershipActive = active;
      app.globalData.membershipExpireAt = expireAt;
      wx.setStorageSync('membershipActive', active);
      wx.setStorageSync('membershipExpireAt', expireAt);
    }).catch(err => {
      console.error('Load membership failed:', err);
    });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/index' });
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
