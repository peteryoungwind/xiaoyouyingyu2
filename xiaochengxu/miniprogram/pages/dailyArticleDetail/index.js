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

function normalizeParagraphs(paragraphs) {
  return (paragraphs || []).map((item, index) => ({
    id: item.id || index,
    sortOrder: item.sortOrder || index + 1,
    contentEn: item.contentEn || '',
    contentZh: item.contentZh || '',
    showZh: false
  })).filter(item => item.contentEn || item.contentZh);
}

function normalizeVocabularyItem(item) {
  return {
    word: item.word || item.title || item.en || '',
    phoneticUk: item.phoneticUk || item.uk || '',
    phoneticUs: item.phoneticUs || item.us || '',
    pos: item.pos || item.partOfSpeech || item.note || '',
    meaning: item.meaning || item.zh || item.titleZh || '',
    example: item.example || item.exampleEn || '',
    exampleZh: item.exampleZh || ''
  };
}

function normalizeExpressionItem(item) {
  return {
    title: item.expression || item.template || item.word || item.en || item.title || '',
    meaning: item.meaning || item.zh || item.titleZh || '',
    example: item.example || item.exampleEn || '',
    note: item.category || item.difficulty || ''
  };
}

function normalizeKeySentenceItem(item) {
  return {
    sentence: item.sentence || item.en || '',
    translation: item.translation || item.zh || '',
    analysis: item.analysis || item.note || ''
  };
}

function clampStars(value) {
  var stars = Number(value);
  if (!stars || stars < 1) return 0;
  return Math.max(1, Math.min(5, Math.round(stars)));
}

function buildStars(value) {
  var stars = clampStars(value);
  var result = [];
  for (var i = 1; i <= 5; i++) {
    result.push({ active: i <= stars });
  }
  return result;
}

function formatTime(seconds) {
  var safe = Number(seconds);
  if (!isFinite(safe) || safe < 0) safe = 0;
  var total = Math.floor(safe);
  var minutes = Math.floor(total / 60);
  var secs = total % 60;
  return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

Page({
  audioContext: null,

  data: {
    id: null,
    article: null,
    paragraphs: [],
    vocabulary: [],
    expressions: [],
    keySentences: [],
    difficultyStars: [],
    hasMeta: false,
    allZhVisible: false,
    loading: true,
    error: '',

    audioUrl: '',
    audioReady: false,
    audioLoading: false,
    audioPlaying: false,
    audioCurrentTime: 0,
    audioDuration: 0,
    audioCurrentText: '00:00',
    audioDurationText: '00:00',
    audioProgress: 0,
    audioRate: 1,
    showRateMenu: false,
    rateOptions: [0.75, 1, 1.25, 1.5, 2],
    seeking: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail(options.id);
  },

  onHide() {
    this.destroyAudio();
  },

  onUnload() {
    this.destroyAudio();
  },

  loadDetail(id) {
    if (!id) {
      this.setData({ loading: false, error: '外刊不存在' });
      return;
    }
    this.destroyAudio();
    this.setData({ loading: true, error: '', allZhVisible: false });
    api.getDailyArticle(id).then(article => {
      const paragraphs = normalizeParagraphs(article.paragraphs);
      const vocabulary = parseArray(article.vocabulary)
        .map(normalizeVocabularyItem)
        .filter(item => item.word || item.meaning);
      const expressions = parseArray(article.expressions)
        .map(normalizeExpressionItem)
        .filter(item => item.title || item.meaning);
      const keySentences = parseArray(article.keySentences)
        .map(normalizeKeySentenceItem)
        .filter(item => item.sentence || item.analysis);
      const difficultyStars = buildStars(article.difficultyStars);
      const hasMeta = difficultyStars.some(item => item.active)
        || !!article.wordCount
        || !!article.sourceName
        || !!article.publishedDate;
      const normalizedArticle = Object.assign({}, article, {
        sourceName: article.sourceName || '',
        wordCount: article.wordCount || null
      });

      this.setData({
        article: normalizedArticle,
        paragraphs: paragraphs,
        vocabulary: vocabulary,
        expressions: expressions,
        keySentences: keySentences,
        difficultyStars: difficultyStars,
        hasMeta: hasMeta,
        audioUrl: normalizedArticle.audioUrl || '',
        loading: false,
        error: '',
        audioCurrentText: '00:00',
        audioDurationText: '00:00',
        audioProgress: 0
      });

      if (normalizedArticle.audioUrl) {
        this.initAudio(normalizedArticle.audioUrl);
      }
    }).catch(err => {
      console.error('Load daily article detail failed:', err);
      this.setData({ loading: false, error: err.message || '外刊不存在' });
      if (err.code !== 401) {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    });
  },

  toggleParagraphTranslation(e) {
    const index = Number(e.currentTarget.dataset.index);
    const paragraphs = this.data.paragraphs.map((item, idx) => (
      idx === index ? Object.assign({}, item, { showZh: !item.showZh }) : item
    ));
    this.setData({
      paragraphs: paragraphs,
      allZhVisible: paragraphs.length > 0 && paragraphs.every(item => !item.contentZh || item.showZh)
    });
  },

  showAllTranslations() {
    this.setData({
      paragraphs: this.data.paragraphs.map(item => Object.assign({}, item, { showZh: !!item.contentZh })),
      allZhVisible: true
    });
  },

  hideAllTranslations() {
    this.setData({
      paragraphs: this.data.paragraphs.map(item => Object.assign({}, item, { showZh: false })),
      allZhVisible: false
    });
  },

  initAudio(url) {
    this.destroyAudio();
    const resolvedUrl = audio.resolveAudioUrl(url);
    if (!resolvedUrl) return;

    const ctx = wx.createInnerAudioContext();
    ctx.src = resolvedUrl;
    ctx.obeyMuteSwitch = false;
    ctx.playbackRate = this.data.audioRate;

    ctx.onCanplay(() => {
      const duration = Number(ctx.duration) || this.data.audioDuration || 0;
      this.setData({
        audioReady: true,
        audioDuration: duration,
        audioDurationText: formatTime(duration)
      });
    });
    ctx.onPlay(() => {
      ctx.playbackRate = this.data.audioRate;
      this.setData({ audioPlaying: true, audioLoading: false });
    });
    ctx.onPause(() => {
      this.setData({ audioPlaying: false, audioLoading: false });
    });
    ctx.onTimeUpdate(() => {
      if (this.data.seeking) return;
      const current = Number(ctx.currentTime) || 0;
      const duration = Number(ctx.duration) || this.data.audioDuration || 0;
      const progress = duration > 0 ? Math.min(100, Math.max(0, current / duration * 100)) : 0;
      this.setData({
        audioCurrentTime: current,
        audioDuration: duration,
        audioCurrentText: formatTime(current),
        audioDurationText: formatTime(duration),
        audioProgress: progress
      });
    });
    ctx.onEnded(() => {
      this.setData({
        audioPlaying: false,
        audioLoading: false,
        audioCurrentTime: 0,
        audioCurrentText: '00:00',
        audioProgress: 0
      });
      ctx.seek(0);
    });
    ctx.onError(err => {
      console.error('Play daily article audio failed:', err, resolvedUrl);
      wx.showToast({ title: '音频播放失败', icon: 'none' });
      this.resetAudioState();
    });

    this.audioContext = ctx;
    this.setData({
      audioReady: false,
      audioLoading: false,
      audioPlaying: false,
      audioCurrentTime: 0,
      audioDuration: 0,
      audioCurrentText: '00:00',
      audioDurationText: '00:00',
      audioProgress: 0
    });
  },

  destroyAudio() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
    this.resetAudioState();
  },

  resetAudioState() {
    this.setData({
      audioReady: false,
      audioLoading: false,
      audioPlaying: false,
      audioCurrentTime: 0,
      audioDuration: 0,
      audioCurrentText: '00:00',
      audioDurationText: '00:00',
      audioProgress: 0,
      showRateMenu: false,
      seeking: false
    });
  },

  toggleAudio() {
    if (!this.data.audioUrl) {
      wx.showToast({ title: '暂无音频', icon: 'none' });
      return;
    }
    if (!this.audioContext) {
      this.initAudio(this.data.audioUrl);
    }
    if (this.data.audioPlaying) {
      this.audioContext.pause();
      return;
    }
    this.setData({ audioLoading: true });
    this.audioContext.play();
    this.audioContext.playbackRate = this.data.audioRate;
  },

  onAudioSeekChanging(e) {
    const progress = Number(e.detail.value) || 0;
    const duration = this.data.audioDuration || 0;
    const current = duration > 0 ? duration * progress / 100 : 0;
    this.setData({
      seeking: true,
      audioProgress: progress,
      audioCurrentText: formatTime(current)
    });
  },

  onAudioSeekChange(e) {
    const progress = Number(e.detail.value) || 0;
    const duration = this.data.audioDuration || 0;
    if (this.audioContext && duration > 0) {
      this.audioContext.seek(duration * progress / 100);
    }
    this.setData({ seeking: false, audioProgress: progress });
  },

  toggleRateMenu() {
    this.setData({ showRateMenu: !this.data.showRateMenu });
  },

  selectRate(e) {
    const rate = Number(e.currentTarget.dataset.rate) || 1;
    if (this.audioContext) {
      this.audioContext.playbackRate = rate;
    }
    this.setData({ audioRate: rate, showRateMenu: false });
  },

  retry() {
    this.loadDetail(this.data.id);
  }
});
