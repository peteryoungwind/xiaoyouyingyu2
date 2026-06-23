const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');
const wordPractice = require('../../utils/wordPractice');

function isAuthExpiredError(err) {
  return err && err.code === 401;
}

Page({
  data: {
    isLoggedIn: false,
    isMember: false,
    keyword: '',
    tags: [],
    selectedTag: '',
    topics: [],
    page: 0,
    size: 10,
    totalPages: 0,
    totalTopics: 0,
    loading: false,
    loadingMore: false,
    hasMore: true,
    contactInfo: null,
    stats: { days: 0 }
  },

  onLoad() { this.refreshState(); },

  onShow() {
    this.refreshState();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  refreshState() {
    const isLoggedIn = app.globalData.isLoggedIn;
    const isMember = app.isMember();
    this.setData({ isLoggedIn, isMember });

    if (isLoggedIn && isMember) {
      this.loadTags();
      this.loadTopics(true);
      this.loadStats();
    } else if (isLoggedIn && !isMember) {
      this.loadContactInfo();
    }
  },

  loadStats() {
    api.getStats().then(res => {
      this.setData({ stats: res || { days: 0 } });
    }).catch(() => {});
    api.getTopics({ page: 0, size: 1 }).then(res => {
      this.setData({ totalTopics: res.totalElements || 0 });
    }).catch(() => {});
  },

  loadContactInfo() {
    api.getMembershipContact().then(res => {
      this.setData({ contactInfo: res });
    }).catch(err => console.error('Get contact info failed:', err));
  },

  loadTags() {
    api.getTagStats().then(res => {
      this.setData({ tags: util.buildOrderedTagList(res || {}) });
    }).catch(err => console.error('Load tags failed:', err));
  },

  loadTopics(reset) {
    if (this.data.loading || this.data.loadingMore) return;
    const page = reset ? 0 : this.data.page;
    this.setData(reset ? { loading: true } : { loadingMore: true });

    const params = { page, size: this.data.size };
    if (this.data.keyword) params.keyword = this.data.keyword;
    if (this.data.selectedTag) params.tag = this.data.selectedTag;

    api.getTopics(params).then(res => {
      const topics = (res.content || []).map(t => {
        const normalizedTags = util.normalizeKnownTags(t.tags);
        return {
          ...t,
          tagList: normalizedTags.length > 0 ? normalizedTags : util.parseTags(t.tags)
        };
      });
      this.setData({
        topics: reset ? topics : this.data.topics.concat(topics),
        page: page + 1,
        totalPages: res.totalPages || 0,
        hasMore: (page + 1) < (res.totalPages || 0),
        loading: false, loadingMore: false
      });
    }).catch(err => {
      console.error('Load topics failed:', err);
      this.setData({ loading: false, loadingMore: false });
      if (isAuthExpiredError(err)) {
        return;
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onInputKeyword(e) { this.setData({ keyword: e.detail.value }); },
  onSearch() { this.loadTopics(true); },
  onClearKeyword() { this.setData({ keyword: '' }); this.loadTopics(true); },

  onSelectTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ selectedTag: this.data.selectedTag === tag ? '' : tag });
    this.loadTopics(true);
  },

  onTopicTap(e) {
    wx.navigateTo({ url: '/pages/learningTopic/index?id=' + e.currentTarget.dataset.id });
  },

  goToLogin() { wx.navigateTo({ url: '/pages/login/index' }); },
  browseAsGuest() { wx.switchTab({ url: '/pages/topics/index' }); },
  goToRedeem() { wx.navigateTo({ url: '/pages/redeem/index' }); },
  goToWordPractice() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    wordPractice.navigateToEntry();
  },
  goToDailyArticles() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    wx.navigateTo({ url: '/pages/dailyArticles/index' });
  },
  goToAiDialog() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    wx.navigateTo({ url: '/pages/aiDialogSetup/index' });
  },

  onPullDownRefresh() { this.refreshState(); wx.stopPullDownRefresh(); },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) this.loadTopics(false);
  }
});
