const api = require('../../utils/api');
const auth = require('../../utils/auth');
const wordPractice = require('../../utils/wordPractice');

Page({
  data: {
    loading: true,
    books: [],
    beginnerBooks: [],
    advancedBooks: [],
    totalDueReview: 0,
    totalMastered: 0
  },

  onLoad() {
    this.ensureAccess();
  },

  onShow() {
    this.ensureAccess();
  },

  ensureAccess() {
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadBooks();
  },

  loadBooks() {
    this.setData({ loading: true });
    api.getWordBooks().then(res => {
      const books = (res || []).map((book, index) => {
        const stats = book.stats || {};
        const progress = book.progress || {};
        const level = this.normalizeLevel(book.level || (book.progress && book.progress.difficulty));
        const total = progress.total || (level === 'ADVANCED' ? (stats.advancedWords || 0) : (stats.beginnerWords || 0));
        const learned = progress.learned || 0;
        return Object.assign({}, book, {
          level,
          levelLabel: level === 'ADVANCED' ? '进阶' : '初级',
          coverClass: this.coverClass(index, level),
          stats,
          progress,
          wordCount: total,
          statusText: this.statusText(progress),
          progressPercent: total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0
        });
      });
      const beginnerBooks = books.filter(book => book.level === 'BEGINNER');
      const advancedBooks = books.filter(book => book.level === 'ADVANCED');
      const totalDueReview = books.reduce((sum, book) => sum + ((book.progress || {}).dueReview || 0), 0);
      const totalMastered = books.reduce((sum, book) => sum + ((book.progress || {}).mastered || 0), 0);
      this.setData({ books, beginnerBooks, advancedBooks, totalDueReview, totalMastered, loading: false });
    }).catch(err => {
      console.error('Load word books failed:', err);
      this.setData({ loading: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
    });
  },

  goToBook(e) {
    const bookId = e.currentTarget.dataset.id;
    const difficulty = this.normalizeLevel(e.currentTarget.dataset.level);
    wordPractice.saveRecentBook(bookId, difficulty);
    wx.navigateTo({ url: '/pages/wordPractice/index?bookId=' + bookId + '&difficulty=' + difficulty });
  },

  normalizeLevel(level) {
    return level === 'ADVANCED' ? 'ADVANCED' : 'BEGINNER';
  },

  statusText(progress) {
    const source = progress || {};
    if (source.dueReview > 0) {
      return '待复习 ' + source.dueReview;
    }
    if (source.learned > 0) {
      return '已学 ' + source.learned;
    }
    return '未开始';
  },

  coverClass(index, level) {
    const beginnerCovers = ['cover-life', 'cover-travel', 'cover-campus'];
    const advancedCovers = ['cover-business', 'cover-news', 'cover-speech'];
    const source = level === 'ADVANCED' ? advancedCovers : beginnerCovers;
    return source[index % source.length];
  },

  onPullDownRefresh() {
    this.loadBooks();
    wx.stopPullDownRefresh();
  }
});
