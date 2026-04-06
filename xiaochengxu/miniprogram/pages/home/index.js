const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

const ICON_BGS = ['#FFF3E0', '#E5F1FF', '#E8F5E9', '#FCE4EC', '#EDE7F6', '#E0F7FA'];

// Gradient color palette for tag category icons
var TAG_GRADIENTS = [
  { from: '#007AFF', to: '#5AC8FA' },
  { from: '#FF9500', to: '#FFCC00' },
  { from: '#34C759', to: '#30D158' },
  { from: '#5856D6', to: '#AF52DE' },
  { from: '#FF3B30', to: '#FF6B6B' },
  { from: '#FF2D55', to: '#FF6F91' },
  { from: '#5AC8FA', to: '#007AFF' },
  { from: '#FFCC00', to: '#FF9500' }
];

// Emoji icon for common tag keywords
function getTagIcon(name) {
  var lower = (name || '').toLowerCase();
  if (lower.includes('business') || lower.includes('work') || lower.includes('career') || lower.includes('job')) return '💼';
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('tourism')) return '✈️';
  if (lower.includes('food') || lower.includes('cook') || lower.includes('dining') || lower.includes('restaurant')) return '🍽️';
  if (lower.includes('social') || lower.includes('friend') || lower.includes('chat') || lower.includes('conversation')) return '☕';
  if (lower.includes('school') || lower.includes('study') || lower.includes('education') || lower.includes('campus') || lower.includes('academic')) return '📖';
  if (lower.includes('health') || lower.includes('fitness') || lower.includes('sport') || lower.includes('exercise')) return '🏃';
  if (lower.includes('tech') || lower.includes('digital') || lower.includes('computer') || lower.includes('internet')) return '💻';
  if (lower.includes('culture') || lower.includes('art') || lower.includes('music') || lower.includes('movie') || lower.includes('film')) return '🎭';
  if (lower.includes('nature') || lower.includes('environment') || lower.includes('weather') || lower.includes('animal')) return '🌿';
  if (lower.includes('shopping') || lower.includes('fashion') || lower.includes('clothes')) return '🛍️';
  if (lower.includes('family') || lower.includes('home') || lower.includes('life') || lower.includes('daily')) return '🏠';
  if (lower.includes('holiday') || lower.includes('festival') || lower.includes('celebration')) return '🎉';
  return '💬';
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

      const tagCategories = Object.entries(tagsRes || {})
        .map(function(entry, i) {
          var name = entry[0];
          var count = entry[1].count;
          var gradient = TAG_GRADIENTS[i % TAG_GRADIENTS.length];
          return {
            name: name,
            count: count,
            icon: getTagIcon(name),
            gradientFrom: gradient.from,
            gradientTo: gradient.to
          };
        })
        .sort(function(a, b) { return b.count - a.count; });

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
      wx.navigateTo({ url: '/pages/login/index' });
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
