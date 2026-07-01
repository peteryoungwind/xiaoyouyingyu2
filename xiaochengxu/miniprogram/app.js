App({
  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    membershipActive: false,
    membershipPermanent: false,
    role: '',
    hasPassword: true,
    membershipExpireAt: '',
    baseUrl: '',
    wordPracticeRefreshTimer: null,
    wordPracticePreloadInFlight: false,
    apiBaseUrlMap: {
      develop: 'http://localhost:8080/api',
      trial: 'https://xiaoyou-ky.top/api',
      release: 'https://xiaoyou-ky.top/api'
    }
  },

  onLaunch() {
    this.initBaseUrlByEnv();
    this.loadUserFromStorage();
    this.startWordPracticeCacheRefresh();
  },

  onShow() {
    this.startWordPracticeCacheRefresh();
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
      const membershipPermanent = wx.getStorageSync('membershipPermanent');
      const membershipExpireAt = wx.getStorageSync('membershipExpireAt');
      const hasPassword = wx.getStorageSync('hasPassword');
      if (token) {
        this.globalData.token = token;
        this.globalData.isLoggedIn = true;
        this.globalData.role = role || 'USER';
        this.globalData.membershipActive = membershipActive || false;
        this.globalData.membershipPermanent = membershipPermanent || false;
        this.globalData.membershipExpireAt = membershipExpireAt || '';
        this.globalData.hasPassword = hasPassword !== '' ? !!hasPassword : true;
        this.globalData.userInfo = { username: username || '', role: role || 'USER', hasPassword: hasPassword !== '' ? !!hasPassword : true };
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
    this.globalData.membershipPermanent = userInfo.membershipPermanent || false;
    this.globalData.membershipExpireAt = userInfo.membershipExpireAt || '';
    this.globalData.hasPassword = userInfo.hasPassword !== undefined ? !!userInfo.hasPassword : true;
    this.globalData.userInfo = {
      username: userInfo.username,
      role: userInfo.role || 'USER',
      hasPassword: userInfo.hasPassword !== undefined ? !!userInfo.hasPassword : true
    };

    wx.setStorageSync('token', token);
    wx.setStorageSync('username', userInfo.username);
    wx.setStorageSync('role', userInfo.role || 'USER');
    wx.setStorageSync('membershipActive', userInfo.membershipActive || false);
    wx.setStorageSync('membershipPermanent', userInfo.membershipPermanent || false);
    wx.setStorageSync('membershipExpireAt', userInfo.membershipExpireAt || '');
    wx.setStorageSync('hasPassword', userInfo.hasPassword !== undefined ? !!userInfo.hasPassword : true);

    this.startWordPracticeCacheRefresh();
    this.preloadRecentWordPractice(true);
  },

  logout() {
    this.stopWordPracticeCacheRefresh();
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.role = '';
    this.globalData.membershipActive = false;
    this.globalData.membershipPermanent = false;
    this.globalData.membershipExpireAt = '';
    this.globalData.hasPassword = true;
    this.globalData.userInfo = null;

    wx.removeStorageSync('token');
    wx.removeStorageSync('username');
    wx.removeStorageSync('role');
    wx.removeStorageSync('membershipActive');
    wx.removeStorageSync('membershipPermanent');
    wx.removeStorageSync('membershipExpireAt');
    wx.removeStorageSync('hasPassword');
    wx.removeStorageSync('recentWordPracticeBook');
    try {
      const info = wx.getStorageInfoSync();
      (info.keys || []).forEach(function (key) {
        if (key.indexOf('wordPracticeBookCache:') === 0) {
          wx.removeStorageSync(key);
        }
      });
    } catch (e) {
      console.warn('Clear word practice caches failed:', e);
    }
  },

  checkLogin() {
    if (this.globalData.token || wx.getStorageSync('token')) {
      if (!this.globalData.token) {
        this.loadUserFromStorage();
      }
      this.globalData.isLoggedIn = true;
      return true;
    }
    this.loadUserFromStorage();
    return !!this.globalData.token;
  },

  isMember() {
    return this.isAdmin() || this.globalData.membershipPermanent === true || this.globalData.membershipActive === true;
  },

  isAdmin() {
    return this.globalData.role === 'ADMIN';
  },

  startWordPracticeCacheRefresh() {
    if (!this.checkLogin()) {
      this.stopWordPracticeCacheRefresh();
      return;
    }

    this.preloadRecentWordPractice(false);
    if (this.globalData.wordPracticeRefreshTimer) {
      return;
    }

    this.globalData.wordPracticeRefreshTimer = setInterval(() => {
      this.preloadRecentWordPractice(true);
    }, 10 * 60 * 1000);
  },

  stopWordPracticeCacheRefresh() {
    if (this.globalData.wordPracticeRefreshTimer) {
      clearInterval(this.globalData.wordPracticeRefreshTimer);
      this.globalData.wordPracticeRefreshTimer = null;
    }
    this.globalData.wordPracticePreloadInFlight = false;
  },

  preloadRecentWordPractice(force) {
    if (!this.checkLogin() || this.globalData.wordPracticePreloadInFlight) {
      return;
    }

    const wordPractice = require('./utils/wordPractice');
    const recent = wordPractice.getRecentBook();
    if (!recent) {
      return;
    }
    if (!force && wordPractice.readBookCache(recent.bookId, recent.difficulty)) {
      return;
    }

    const usernameAtStart = wx.getStorageSync('username') || '';
    const api = require('./utils/api');
    this.globalData.wordPracticePreloadInFlight = true;

    const finish = () => {
      this.globalData.wordPracticePreloadInFlight = false;
    };

    api.getWordBookWords(recent.bookId, recent.difficulty).then(res => {
      const currentUsername = wx.getStorageSync('username') || '';
      if (!this.checkLogin() || currentUsername !== usernameAtStart) {
        finish();
        return;
      }
      wordPractice.saveBookCache(recent.bookId, recent.difficulty, res || {});
      finish();
    }).catch(err => {
      console.warn('Preload recent word practice cache failed:', err);
      finish();
    });
  }
});
