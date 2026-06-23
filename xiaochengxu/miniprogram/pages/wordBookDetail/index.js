const api = require('../../utils/api');
const auth = require('../../utils/auth');
const wordPractice = require('../../utils/wordPractice');

Page({
  data: {
    id: null,
    difficulty: 'BEGINNER',
    book: null,
    loading: true,
    progressPercent: 0,
    reviewMinutes: 1,
    difficultyLabel: '初级',
    bookDescription: '到期复习优先，然后自动补充新词。',
    dueReview: 0,
    remainingNew: 0,
    mastered: 0
  },

  onLoad(options) {
    const difficulty = options.difficulty || 'BEGINNER';
    this.setData({
      id: options.id,
      difficulty,
      difficultyLabel: difficulty === 'BEGINNER' ? '初级' : '进阶'
    });
    this.ensureAccess();
  },

  ensureAccess() {
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadBook();
  },

  loadBook() {
    this.setData({ loading: true });
    api.getWordBookDetail(this.data.id, this.data.difficulty).then(res => {
      const progress = res.progress || {};
      const total = progress.total || 0;
      const learned = progress.learned || 0;
      const dueReview = progress.dueReview || 0;
      this.setData({
        book: res,
        loading: false,
        progressPercent: total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0,
        reviewMinutes: Math.max(1, Math.ceil(dueReview / 5)),
        difficultyLabel: this.data.difficulty === 'BEGINNER' ? '初级' : '进阶',
        bookDescription: res.description || res.scene || '到期复习优先，然后自动补充新词。',
        dueReview,
        remainingNew: progress.remainingNew || 0,
        mastered: progress.mastered || 0
      });
      wordPractice.saveRecentBook(this.data.id, this.data.difficulty);
    }).catch(err => {
      console.error('Load word book failed:', err);
      this.setData({ loading: false });
      wordPractice.clearRecentBook();
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
    });
  },

  switchDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    this.setData({
      difficulty,
      difficultyLabel: difficulty === 'BEGINNER' ? '初级' : '进阶'
    });
    wordPractice.saveRecentBook(this.data.id, difficulty);
    this.loadBook();
  },

  startPractice() {
    wordPractice.saveRecentBook(this.data.id, this.data.difficulty);
    wx.navigateTo({
      url: '/pages/wordPractice/index?bookId=' + this.data.id + '&difficulty=' + this.data.difficulty
    });
  },

  goToBooks() {
    wx.navigateTo({ url: '/pages/wordBooks/index' });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => wx.redirectTo({ url: '/pages/wordBooks/index' })
    });
  }
});
