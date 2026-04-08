const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: { topic: null, questions: [], loading: true, isMember: false, isLoggedIn: false },

  onLoad(options) {
    if (options.id) this.loadTopic(options.id);
  },

  onShow() {
    this.setData({ isLoggedIn: app.checkLogin(), isMember: app.isMember() });
  },

  async loadTopic(id) {
    this.setData({ loading: true });
    try {
      const topic = await api.getTopic(id);
      const questions = util.parseQuestions(topic.questions);
      const normalizedTags = util.normalizeKnownTags(topic.tags);
      this.setData({
        topic: {
          ...topic,
          eventDate: util.formatDate(topic.eventDate),
          tagList: normalizedTags.length > 0 ? normalizedTags : util.parseTags(topic.tags)
        },
        questions, loading: false
      });
      wx.setNavigationBarTitle({ title: topic.titleZh || topic.title });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  goToLearning() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    if (!app.isMember()) {
      this.showMembershipGuide();
      return;
    }
    wx.navigateTo({ url: '/pages/learningTopic/index?id=' + this.data.topic.id });
  },

  showMembershipGuide() {
    wx.showModal({
      title: '请联系管理员开通高级功能',
      content: '开通会员后即可使用学习中心、AI点评等高级功能',
      confirmText: '兑换卡密',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) wx.navigateTo({ url: '/pages/redeem/index' });
      }
    });
  }
});
