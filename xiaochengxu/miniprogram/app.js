App({
  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    membershipActive: false,
    role: '',
    membershipExpireAt: '',
    baseUrl: 'http://localhost:8080/api'
  },

  onLaunch() {
    this.loadUserFromStorage();
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
