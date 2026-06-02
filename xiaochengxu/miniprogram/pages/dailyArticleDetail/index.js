const api = require('../../utils/api');
const audio = require('../../utils/audio');

function parseArray(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Parse daily article JSON failed:', e);
    return [];
  }
}

function normalizeStudyItem(item) {
  return {
    title: item.word || item.template || item.expression || item.en || item.title || '',
    zh: item.zh || item.meaning || item.titleZh || '',
    example: item.example || item.exampleEn || '',
    note: item.category || item.difficulty || ''
  };
}

Page({
  data: {
    id: null,
    article: null,
    paragraphs: [],
    vocabulary: [],
    expressions: [],
    showZh: false,
    loading: true,
    error: ''
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail(options.id);
  },

  loadDetail(id) {
    if (!id) {
      this.setData({ loading: false, error: '外刊不存在' });
      return;
    }
    this.setData({ loading: true, error: '' });
    api.getDailyArticle(id).then(article => {
      this.setData({
        article: article,
        paragraphs: article.paragraphs || [],
        vocabulary: parseArray(article.vocabulary).map(normalizeStudyItem).filter(item => item.title || item.zh),
        expressions: parseArray(article.expressions).map(normalizeStudyItem).filter(item => item.title || item.zh),
        loading: false,
        error: ''
      });
    }).catch(err => {
      console.error('Load daily article detail failed:', err);
      this.setData({ loading: false, error: err.message || '外刊不存在' });
      if (err.code !== 401) {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    });
  },

  toggleZh() {
    this.setData({ showZh: !this.data.showZh });
  },

  playAudio() {
    const article = this.data.article || {};
    if (!article.audioUrl) {
      wx.showToast({ title: '暂无音频', icon: 'none' });
      return;
    }
    audio.play(article.audioUrl);
  },

  retry() {
    this.loadDetail(this.data.id);
  }
});
