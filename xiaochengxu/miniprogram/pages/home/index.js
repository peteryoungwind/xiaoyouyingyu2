const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

const ICON_BGS = ['#FFF3E0', '#E5F1FF', '#E8F5E9', '#FCE4EC', '#EDE7F6', '#E0F7FA'];

function hexToRgba(hex, alpha) {
  var normalized = (hex || '').replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(function(ch) { return ch + ch; }).join('');
  }
  if (normalized.length !== 6) {
    return 'rgba(0, 122, 255, ' + alpha + ')';
  }
  var r = parseInt(normalized.slice(0, 2), 16);
  var g = parseInt(normalized.slice(2, 4), 16);
  var b = parseInt(normalized.slice(4, 6), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

Page({
  data: {
    isLoggedIn: false,
    isMember: false,
    stats: { days: 0 },
    totalTopics: 0,
    latestTopics: [],
    tagCategories: [],
    loading: true,
    greetingText: ''
  },

  onLoad() {
    this.setGreeting();
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

  setGreeting() {
    const hour = new Date().getHours();
    var text = 'Good Evening';
    if (hour < 12) text = 'Good Morning';
    else if (hour < 18) text = 'Good Afternoon';
    this.setData({ greetingText: text });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [statsRes, topicsRes, tagsRes] = await Promise.all([
        api.getStats(),
        api.getTopics({ page: 0, size: 5 }),
        api.getTagStats()
      ]);

      const tagCategories = util.buildOrderedTagList(tagsRes || {})
        .map(function(item) {
          return {
            name: item.name,
            count: item.count,
            icon: item.icon,
            iconBg: item.bg,
            iconColor: item.color,
            cardBg: '#FFFFFF',
            cardBorder: '#ECECF0'
          };
        });

      const latestTopics = (topicsRes ? topicsRes.content : []).map(function(t, i) {
        var tags = t.tags ? t.tags.split(',') : [];
        return {
          id: t.id,
          title: t.title,
          titleZh: t.titleZh,
          eventDate: util.formatDate(t.eventDate),
          firstTag: tags.length > 0 ? tags[0].trim() : '',
          iconBg: ICON_BGS[i % ICON_BGS.length]
        };
      });

      this.setData({
        stats: statsRes || { days: 0 },
        totalTopics: topicsRes ? topicsRes.totalElements : 0,
        latestTopics: latestTopics,
        tagCategories: tagCategories,
        loading: false
      });
    } catch (e) {
      console.error('Load home data error:', e);
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(function() { wx.stopPullDownRefresh(); });
  },

  goToTopics() {
    wx.switchTab({ url: '/pages/topics/index' });
  },

  goToTopicDetail(e) {
    wx.navigateTo({ url: '/pages/topicDetail/index?id=' + e.currentTarget.dataset.id });
  },

  goToLearning() {
    if (!app.checkLogin()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后使用学习功能',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/index' });
          }
        }
      });
      return;
    }
    wx.switchTab({ url: '/pages/learning/index' });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  onCategoryTap(e) {
    var tag = e.currentTarget.dataset.tag;
    app.globalData._pendingTopicFilter = { type: 'tag', value: tag };
    wx.switchTab({ url: '/pages/topics/index' });
  },

  onSearchTap() {
    wx.switchTab({ url: '/pages/topics/index' });
  }
});
