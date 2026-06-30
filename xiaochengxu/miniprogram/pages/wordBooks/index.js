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
          cover: this.coverMeta(book, index, level),
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

  coverMeta(book, index, level) {
    const name = String((book && book.name) || '');
    const covers = [
      {
        keywords: ['日常生活', 'Daily Life'],
        className: 'cover-life',
        iconClass: 'icon-life',
        title: '日常生活',
        subtitle: 'DAILY LIFE',
        hint: '作息 / 饮食 / 出行 / 社交'
      },
      {
        keywords: ['职场英语', 'Workplace'],
        className: 'cover-workplace',
        iconClass: 'icon-workplace',
        title: '职场英语',
        subtitle: 'WORKPLACE',
        hint: '会议 / 协作 / 邮件 / 任务'
      },
      {
        keywords: ['小柚口语初级', '口语初级'],
        className: 'cover-speaking-beginner',
        iconClass: 'icon-speaking',
        title: '小柚口语初级',
        subtitle: 'SPEAKING STARTER',
        hint: '主题 / 高频 / 开口表达'
      },
      {
        keywords: ['商务英语', 'Business'],
        className: 'cover-business',
        iconClass: 'icon-business',
        title: '商务英语',
        subtitle: 'BUSINESS',
        hint: '谈判 / 财务 / 市场 / 合规'
      },
      {
        keywords: ['雅思托福', 'IELTS', 'TOEFL'],
        className: 'cover-ielts',
        iconClass: 'icon-ielts',
        title: '雅思托福',
        subtitle: 'IELTS & TOEFL',
        hint: '学术 / 论证 / 写作 / 科研'
      },
      {
        keywords: ['小柚口语进阶', '口语进阶'],
        className: 'cover-speaking-advanced',
        iconClass: 'icon-speaking-plus',
        title: '小柚口语进阶',
        subtitle: 'SPEAKING PLUS',
        hint: '观点 / 叙述 / 立场 / 深聊'
      }
    ];
    const matched = covers.find(item => item.keywords.some(keyword => name.indexOf(keyword) >= 0));
    if (matched) {
      return matched;
    }
    const beginnerCovers = [
      { className: 'cover-life', iconClass: 'icon-life', subtitle: 'WORD STARTER', hint: '基础 / 高频 / 场景表达' },
      { className: 'cover-workplace', iconClass: 'icon-workplace', subtitle: 'PRACTICE SET', hint: '听说 / 记忆 / 复习' },
      { className: 'cover-speaking-beginner', iconClass: 'icon-speaking', subtitle: 'SPEAKING WORDS', hint: '主题 / 高频 / 开口表达' }
    ];
    const advancedCovers = [
      { className: 'cover-business', iconClass: 'icon-business', subtitle: 'WORD PLUS', hint: '进阶 / 表达 / 迁移使用' },
      { className: 'cover-ielts', iconClass: 'icon-ielts', subtitle: 'ACADEMIC SET', hint: '学术 / 论证 / 写作' },
      { className: 'cover-speaking-advanced', iconClass: 'icon-speaking-plus', subtitle: 'SPEAKING PLUS', hint: '观点 / 叙述 / 深聊' }
    ];
    const source = level === 'ADVANCED' ? advancedCovers : beginnerCovers;
    const fallback = source[index % source.length];
    return Object.assign({}, fallback, {
      title: name || '单词本'
    });
  },

  onPullDownRefresh() {
    this.loadBooks();
    wx.stopPullDownRefresh();
  }
});
