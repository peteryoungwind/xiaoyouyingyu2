const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    isMember: false,
    stats: { days: 0 },
    totalTopics: 0,
    latestTopics: [],
    hotTags: [],
    loading: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.setData({
      isLoggedIn: app.checkLogin(),
      isMember: app.isMember()
    });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [statsRes, topicsRes, tagsRes] = await Promise.all([
        api.getStats(),
        api.getTopics({ page: 0, size: 5 }),
        api.getTagStats()
      ]);

      const hotTags = Object.entries(tagsRes || {})
        .map(([name, info], i) => ({
          name,
          count: info.count,
          ...util.getTagColor(i)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      this.setData({
        stats: statsRes || { days: 0 },
        totalTopics: topicsRes ? topicsRes.totalElements : 0,
        latestTopics: (topicsRes ? topicsRes.content : []).map(t => ({
          ...t,
          eventDate: util.formatDate(t.eventDate)
        })),
        hotTags,
        loading: false
      });
    } catch (e) {
      console.error('Load home data error:', e);
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  goToTopics() {
    wx.switchTab({ url: '/pages/topics/index' });
  },

  goToTopicDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/topicDetail/index?id=' + id });
  },

  goToLearning() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    wx.switchTab({ url: '/pages/learning/index' });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  filterByTag(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.switchTab({
      url: '/pages/topics/index',
      success: () => {
        const pages = getCurrentPages();
        const topicsPage = pages[pages.length - 1];
        if (topicsPage && topicsPage.setTagFilter) {
          topicsPage.setTagFilter(tag);
        }
      }
    });
  }
});
