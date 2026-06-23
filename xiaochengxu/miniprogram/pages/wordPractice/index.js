const api = require('../../utils/api');
const auth = require('../../utils/auth');
const audio = require('../../utils/audio');
const wordPractice = require('../../utils/wordPractice');

Page({
  data: {
    bookId: null,
    difficulty: 'BEGINNER',
    bookTitle: '单词练习',
    difficultyLabel: '初级',
    headerSubtitle: '初级 · 第 1/1 个',
    stepIndex: 0,
    stepTotal: 0,
    stepLabel: '1/1',
    progressPercent: 0,
    wordTypeLabel: '准备练习',
    answerLabel: '',
    answerChip: '',
    wordChipText: '准备练习',
    lastResultClass: '',
    reviewSummary: '初级 · 待复习 0 · 掌握 0',
    sessionStats: {
      total: 0,
      known: 0,
      fuzzy: 0,
      unknown: 0,
      familiarRate: 0
    },
    word: null,
    progress: null,
    loading: true,
    submitting: false,
    completed: false,
    detailVisible: false
  },

  onLoad(options) {
    this.setData({
      bookId: options.bookId,
      difficulty: options.difficulty || 'BEGINNER',
      difficultyLabel: (options.difficulty || 'BEGINNER') === 'BEGINNER' ? '初级' : '进阶',
      headerSubtitle: ((options.difficulty || 'BEGINNER') === 'BEGINNER' ? '初级' : '进阶') + ' · 第 1/1 个'
    });
    this.ensureAccess();
  },

  ensureAccess() {
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    wordPractice.saveRecentBook(this.data.bookId, this.data.difficulty);
    this.loadNext();
    this.loadBookTitle();
  },

  loadNext() {
    const nextIndex = this.data.stepIndex + 1;
    this.setData({ loading: true, completed: false });
    api.getNextWords(this.data.bookId, this.data.difficulty, 1).then(res => {
      const words = res.words || [];
      const progress = res.progress || {};
      const total = progress.total || 0;
      const learned = progress.learned || 0;
      const stepTotal = Math.max(1, Math.min(26, (progress.dueReview || 0) + (progress.remainingNew || 0) || 1));
      const hasWord = words.length > 0;
      this.setData({
        word: hasWord ? words[0] : null,
        progress,
        completed: !hasWord,
        loading: false,
        submitting: false,
        detailVisible: false,
        stepIndex: hasWord ? nextIndex : this.data.stepIndex,
        stepTotal,
        stepLabel: (hasWord ? nextIndex : this.data.stepIndex) + '/' + stepTotal,
        progressPercent: total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0,
        wordTypeLabel: hasWord && words[0].progress ? '到期复习' : '新词练习',
        answerLabel: '',
        answerChip: '',
        wordChipText: hasWord && words[0].progress ? '到期复习' : '新词练习',
        lastResultClass: '',
        headerSubtitle: this.data.difficultyLabel + ' · 第 ' + ((hasWord ? nextIndex : this.data.stepIndex) + '/' + stepTotal) + ' 个',
        reviewSummary: this.data.difficultyLabel + ' · 待复习 ' + (progress.dueReview || 0) + ' · 掌握 ' + (progress.mastered || 0)
      });
    }).catch(err => {
      console.error('Load next word failed:', err);
      this.setData({ loading: false, submitting: false });
      wordPractice.clearRecentBook();
      auth.handleWordPracticeDenied(err && err.message ? err.message : '加载失败');
    });
  },

  answer(e) {
    if (!this.data.word || this.data.submitting) return;
    const result = e.currentTarget.dataset.result;
    this.setData({ submitting: true });
    api.submitWordAnswer(this.data.word.id, result).then(res => {
      const nextStats = this.nextSessionStats(result);
      const answerMeta = this.answerMeta(result);
      if (result !== 'KNOWN') {
        this.setData({
          progress: res.bookProgress || this.data.progress,
          submitting: false,
          detailVisible: true,
          sessionStats: nextStats,
          answerLabel: answerMeta.label,
          answerChip: answerMeta.chip,
          wordChipText: answerMeta.chip,
          lastResultClass: answerMeta.className,
          headerSubtitle: answerMeta.label,
          progressPercent: this.progressPercentFrom(res.bookProgress || this.data.progress),
          reviewSummary: this.data.difficultyLabel + ' · 待复习 ' + ((res.bookProgress || this.data.progress || {}).dueReview || 0) + ' · 掌握 ' + ((res.bookProgress || this.data.progress || {}).mastered || 0)
        });
        return;
      }
      this.setData({ sessionStats: nextStats });
      this.loadNext();
    }).catch(err => {
      console.error('Submit word answer failed:', err);
      this.setData({ submitting: false });
      auth.handleWordPracticeDenied(err && err.message ? err.message : '提交失败');
    });
  },

  playAudio(e) {
    audio.play(e.currentTarget.dataset.url);
  },

  loadBookTitle() {
    api.getWordBookDetail(this.data.bookId, this.data.difficulty).then(res => {
      this.setData({ bookTitle: res.name || '单词练习' });
    }).catch(() => {});
  },

  nextSessionStats(result) {
    const current = this.data.sessionStats || {};
    const stats = {
      total: (current.total || 0) + 1,
      known: current.known || 0,
      fuzzy: current.fuzzy || 0,
      unknown: current.unknown || 0,
      familiarRate: 0
    };
    if (result === 'KNOWN') {
      stats.known += 1;
    } else if (result === 'FUZZY') {
      stats.fuzzy += 1;
    } else {
      stats.unknown += 1;
    }
    stats.familiarRate = stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0;
    return stats;
  },

  answerMeta(result) {
    if (result === 'FUZZY') {
      return { label: '你选择了“模糊”', chip: '需要再看一眼', className: 'fuzzy-chip' };
    }
    if (result === 'UNKNOWN') {
      return { label: '你选择了“不认识”', chip: '重点记忆', className: 'unknown-chip' };
    }
    return { label: '你选择了“认识”', chip: '答对了', className: 'known-chip' };
  },

  progressPercentFrom(progress) {
    const source = progress || {};
    const total = source.total || 0;
    const learned = source.learned || 0;
    return total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0;
  },

  markFocus() {
    wx.showToast({ title: '已放入复习队列', icon: 'none' });
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
