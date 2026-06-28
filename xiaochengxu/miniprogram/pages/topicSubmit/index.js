const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    title: '',
    reason: '',
    category: '',
    extraInfo: '',
    submitting: false,
    submitted: false,
    categories: ['职场', '旅行', '日常生活', '兴趣爱好', '学习考试', '其他']
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onReasonInput(e) {
    this.setData({ reason: e.detail.value });
  },

  onExtraInfoInput(e) {
    this.setData({ extraInfo: e.detail.value });
  },

  onCategoryTap(e) {
    var value = e.currentTarget.dataset.category;
    this.setData({ category: this.data.category === value ? '' : value });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    var title = (this.data.title || '').trim();
    if (title.length < 2) {
      wx.showToast({ title: '请填写至少2个字的话题', icon: 'none' });
      return;
    }
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await api.createTopicSubmission({
        title: title,
        reason: (this.data.reason || '').trim(),
        category: this.data.category,
        extraInfo: (this.data.extraInfo || '').trim()
      });
      this.setData({ submitted: true, submitting: false });
    } catch (e) {
      wx.showToast({ title: e.message || '提交失败，请稍后重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  goToTopics() {
    wx.switchTab({ url: '/pages/topics/index' });
  },

  goToHome() {
    wx.switchTab({ url: '/pages/home/index' });
  }
});
