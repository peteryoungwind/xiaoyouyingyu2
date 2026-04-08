App({
  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    membershipActive: false,
    role: '',
    membershipExpireAt: '',
    baseUrl: '',
    apiBaseUrlMap: {
      develop: 'http://localhost:8080/api',
      trial: 'https://xiaoyou-ky.top/api',
      release: 'https://xiaoyou-ky.top/api'
    }
  },

  onLaunch() {
    this.initBaseUrlByEnv();
    this.loadUserFromStorage();
  },

  initBaseUrlByEnv() {
    var envVersion = 'develop';
    try {
      var accountInfo = wx.getAccountInfoSync();
      envVersion = (accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion) || 'develop';
    } catch (e) {
      console.warn('Get envVersion failed, fallback to develop:', e);
    }

    var map = this.globalData.apiBaseUrlMap || {};
    var devBaseUrl = map.develop || 'http://localhost:8080/api';
    var currentBaseUrl = map[envVersion] || '';

    if (!currentBaseUrl) {
      console.warn('Base URL for env [' + envVersion + '] is empty, fallback to develop URL.');
      currentBaseUrl = devBaseUrl;
    }

    this.globalData.baseUrl = currentBaseUrl;
    console.log('Current envVersion:', envVersion, 'baseUrl:', currentBaseUrl);
  },

  loadUserFromStorage() {
    try {
      const token = wx.getStorageSync('token');
      const username = wx.getStorageSync('username');
      const role = wx.getStorageSync('role');
      const membershipActive = wx.getStorageSync('membershipActive');
      const membershipExpireAt = wx.getStorageSync('membershipExpireAt');
      if (token && username) {
        this.globalData.token = token;
        this.globalData.isLoggedIn = true;
        this.globalData.role = role || 'USER';
        this.globalData.membershipActive = membershipActive || false;
        this.globalData.membershipExpireAt = membershipExpireAt || '';
        this.globalData.userInfo = { username, role: role || 'USER' };
      }
    } catch (e) {
      console.error('Load user from storage failed:', e);
    }
  },

  setLogin(token, userInfo) {
    this.globalData.token = token;
    this.globalData.isLoggedIn = true;
    this.globalData.role = userInfo.role || 'USER';
    this.globalData.membershipActive = userInfo.membershipActive || false;
    this.globalData.membershipExpireAt = userInfo.membershipExpireAt || '';
    this.globalData.userInfo = {
      username: userInfo.username,
      role: userInfo.role || 'USER'
    };

    wx.setStorageSync('token', token);
    wx.setStorageSync('username', userInfo.username);
    wx.setStorageSync('role', userInfo.role || 'USER');
    wx.setStorageSync('membershipActive', userInfo.membershipActive || false);
    wx.setStorageSync('membershipExpireAt', userInfo.membershipExpireAt || '');
  },

  logout() {
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.role = '';
    this.globalData.membershipActive = false;
    this.globalData.membershipExpireAt = '';
    this.globalData.userInfo = null;

    wx.removeStorageSync('token');
    wx.removeStorageSync('username');
    wx.removeStorageSync('role');
    wx.removeStorageSync('membershipActive');
    wx.removeStorageSync('membershipExpireAt');
  },

  checkLogin() {
    return this.globalData.isLoggedIn;
  },

  isMember() {
    return this.isAdmin() || this.globalData.membershipActive === true;
  },

  isAdmin() {
    return this.globalData.role === 'ADMIN';
  }
});
