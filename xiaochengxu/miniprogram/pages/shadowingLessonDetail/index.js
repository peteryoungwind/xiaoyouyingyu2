const api = require('../../utils/api');
const media = require('../../utils/audio');
const app = getApp();

function secondsText(value) {
  if (value === undefined || value === null || value === '') return '';
  var num = Number(value);
  if (isNaN(num)) return '';
  return num.toFixed(num % 1 === 0 ? 0 : 1) + 's';
}

function numericValue(value) {
  if (value === undefined || value === null || value === '') return null;
  var num = Number(value);
  return isNaN(num) ? null : num;
}

function normalizeContent(content) {
  content = content || {};
  return {
    challenge: content.challenge || {},
    transcript: content.transcript || {},
    sentences: Array.isArray(content.sentences) ? content.sentences : [],
    expressions: Array.isArray(content.expressions) ? content.expressions : [],
    cloze: content.cloze || {}
  };
}

function parseAiContent(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    var text = String(value).trim();
    if (text.indexOf('```') === 0) {
      text = text.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('Parse AI content failed:', e, value);
    return null;
  }
}

function hasStoredToken() {
  return !!(app.globalData && app.globalData.token) || !!wx.getStorageSync('token');
}

Page({
  data: {
    id: null,
    lesson: null,
    content: normalizeContent({}),
    sentences: [],
    expressions: [],
    loading: true,
    error: '',
    isLoggedIn: false,
    mediaMode: 'video',
    audioPlaying: false,
    audioLoading: false,
    transcriptMode: 'both',
    showClozeAnswer: false,
    translationInputMode: 'text',
    translationAnswer: '',
    translationRecording: false,
    translationSpeechLoading: false,
    translationReviewLoading: false,
    translationReviewData: null,
    expandedExpression: -1,
    reviewSheetOpen: false,
    reviewData: null,
    activeSentenceIndex: -1
  },

  onLoad(options) {
    this.setData({
      id: options.id,
      isLoggedIn: app.checkLogin()
    });
    this.setupRecorder();
    this.loadDetail(options.id);
  },

  onUnload() {
    this.pageUnloading = true;
    if (this.recorder && this.hasActiveRecording()) {
      this.ignoreNextRecorderCallback = true;
      this.recorder.stop();
    }
    if (this.localAudio) {
      this.stopLocalAudio();
    }
    if (this.segmentAudio) {
      this.segmentAudio.destroy();
    }
    this.destroyMainAudio();
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
    }
  },

  setupRecorder() {
    this.recorder = wx.getRecorderManager();
    this.recorder.onStop((res) => {
      if (this.pageUnloading || this.ignoreNextRecorderCallback) {
        this.clearCurrentRecording();
        this.ignoreNextRecorderCallback = false;
        return;
      }
      if (this.currentRecordingType === 'translation') {
        this.currentRecordingType = null;
        const path = res && res.tempFilePath ? res.tempFilePath : '';
        this.setData({ translationRecording: false });
        if (path) {
          this.transcribeTranslationAudio(path);
        }
        return;
      }
      const index = this.currentRecordingIndex;
      this.currentRecordingType = null;
      this.currentRecordingIndex = null;
      if (index === undefined || index === null || index < 0) return;
      const path = res && res.tempFilePath ? res.tempFilePath : '';
      const duration = res && res.duration ? res.duration : 0;
      this.setData({
        ['sentences[' + index + '].recording']: false,
        ['sentences[' + index + '].recorded']: !!path,
        ['sentences[' + index + '].audioFilePath']: path,
        ['sentences[' + index + '].durationMs']: duration
      });
      if (path) {
        wx.showToast({ title: '录音已保存', icon: 'none' });
      }
    });
    this.recorder.onError((err) => {
      if (this.pageUnloading || this.ignoreNextRecorderCallback || !this.hasActiveRecording()) {
        this.clearCurrentRecording();
        this.ignoreNextRecorderCallback = false;
        return;
      }
      if (this.currentRecordingType === 'translation') {
        this.currentRecordingType = null;
        this.setData({ translationRecording: false, translationSpeechLoading: false });
        wx.showToast({ title: '录音失败，请重试', icon: 'none' });
        return;
      }
      const index = this.currentRecordingIndex;
      this.currentRecordingType = null;
      this.currentRecordingIndex = null;
      console.error('Shadowing record failed:', err);
      if (index !== undefined && index !== null && index >= 0) {
        this.setData({ ['sentences[' + index + '].recording']: false });
      }
      wx.showToast({ title: '录音失败，请重试', icon: 'none' });
    });
  },

  hasActiveRecording() {
    return this.currentRecordingType === 'translation' ||
      (this.currentRecordingIndex !== undefined && this.currentRecordingIndex !== null && this.currentRecordingIndex >= 0);
  },

  clearCurrentRecording() {
    this.currentRecordingType = null;
    this.currentRecordingIndex = null;
  },

  loadDetail(id) {
    if (!id) {
      this.setData({ loading: false, error: '内容不存在' });
      return;
    }
    this.setData({ loading: true, error: '' });
    api.getShadowingLessonDetail(id).then(lesson => {
      const content = normalizeContent(lesson.content);
      const sentences = content.sentences.map((item, index) => ({
        index: item.index !== undefined ? item.index : index,
        displayIndex: index + 1,
        startSec: numericValue(item.startSec),
        endSec: numericValue(item.endSec),
        timeText: [secondsText(item.startSec), secondsText(item.endSec)].filter(Boolean).join(' - '),
        en: item.en || '',
        zh: item.zh || '',
        phonetic: item.phonetic || '',
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        recording: false,
        recorded: false,
        reviewing: false,
        playingBack: false,
        audioFilePath: '',
        durationMs: 0,
        score: null
      }));
      const expressions = content.expressions.map((item, index) => ({
        index: index,
        text: item.text || item.expression || '',
        phonetic: item.phonetic || '',
        type: item.type || '',
        definitionZh: item.definitionZh || item.zh || '',
        definitionEn: item.definitionEn || '',
        exampleEn: item.exampleEn || item.sourceExampleEn || '',
        exampleZh: item.exampleZh || item.sourceExampleZh || '',
        analysis: item.analysis || ''
      })).filter(item => item.text || item.definitionZh);
      this.setData({
        lesson: lesson,
        content: content,
        sentences: sentences,
        expressions: expressions,
        translationAnswer: '',
        translationReviewData: null,
        mediaMode: lesson.videoUrl ? 'video' : 'audio',
        loading: false,
        error: ''
      });
    }).catch(err => {
      console.error('Load shadowing detail failed:', err);
      this.setData({ loading: false, error: err.message || '内容不存在' });
      if (err.code !== 401) {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    });
  },

  retry() {
    this.loadDetail(this.data.id);
  },

  switchMedia(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === 'video') {
      this.pauseMainAudio();
    }
    this.setData({ mediaMode: mode });
  },

  playAudio() {
    const lesson = this.data.lesson || {};
    if (!lesson.audioUrl) {
      wx.showToast({ title: '暂无音频', icon: 'none' });
      return;
    }
    const audioUrl = media.resolveAudioUrl(lesson.audioUrl);
    if (!audioUrl) {
      wx.showToast({ title: '暂无音频', icon: 'none' });
      return;
    }
    if (this.mainAudio && this.mainAudioUrl === audioUrl && this.data.audioPlaying) {
      this.mainAudio.pause();
      return;
    }
    this.pauseVideo();
    this.stopSegmentAudio();
    this.stopLocalAudio();
    if (!this.mainAudio || this.mainAudioUrl !== audioUrl) {
      this.initMainAudio(audioUrl);
    }
    this.setData({ audioLoading: true });
    this.mainAudio.play();
  },

  initMainAudio(audioUrl) {
    this.destroyMainAudio();
    const audio = wx.createInnerAudioContext();
    this.mainAudio = audio;
    this.mainAudioUrl = audioUrl;
    audio.src = audioUrl;
    audio.obeyMuteSwitch = false;
    audio.onPlay(() => {
      this.setData({ audioPlaying: true, audioLoading: false });
    });
    audio.onPause(() => {
      this.setData({ audioPlaying: false, audioLoading: false });
    });
    audio.onStop(() => {
      this.setData({ audioPlaying: false, audioLoading: false });
    });
    audio.onEnded(() => {
      this.setData({ audioPlaying: false, audioLoading: false });
    });
    audio.onError(err => {
      console.error('Play shadowing audio failed:', err, audioUrl);
      wx.showToast({ title: '音频播放失败', icon: 'none' });
      this.destroyMainAudio();
    });
  },

  pauseMainAudio() {
    if (this.mainAudio && this.data.audioPlaying) {
      this.mainAudio.pause();
    }
  },

  pauseVideo() {
    try {
      wx.createVideoContext('shadowingVideo', this).pause();
    } catch (e) {}
  },

  destroyMainAudio() {
    if (this.mainAudio) {
      this.mainAudio.stop();
      this.mainAudio.destroy();
      this.mainAudio = null;
    }
    this.mainAudioUrl = '';
    this.setData({ audioPlaying: false, audioLoading: false });
  },

  stopSegmentAudio() {
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.segmentAudio) {
      this.segmentAudio.stop();
      this.segmentAudio.destroy();
      this.segmentAudio = null;
    }
  },

  switchTranscriptMode(e) {
    this.setData({ transcriptMode: e.currentTarget.dataset.mode });
  },

  toggleExpression(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ expandedExpression: this.data.expandedExpression === index ? -1 : index });
  },

  toggleClozeAnswer() {
    this.setData({ showClozeAnswer: !this.data.showClozeAnswer });
  },

  onTranslationInput(e) {
    this.setData({
      translationAnswer: e.detail.value,
      translationInputMode: 'text',
      translationReviewData: null
    });
  },

  // 逐句跟读的单句播放能力已暂停：页面不再展示“播放”按钮，也不再调用句级音频、
  // 视频时间轴片段或 WechatSI TTS。保留顶部视频/音频播放以及录音、回放、点评链路。

  startRecord(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (this.data.sentences[index] && this.data.sentences[index].recording) return;
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.currentRecordingIndex = index;
        this.currentRecordingType = 'sentence';
        this.setData({ ['sentences[' + index + '].recording']: true });
        this.recorder.start({ duration: 60000, format: 'mp3' });
      },
      fail: () => {
        wx.showModal({
          title: '需要录音权限',
          content: '逐句跟读需要录音权限，请打开权限后再试。',
          confirmText: '去设置',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) wx.openSetting();
          }
        });
      }
    });
  },

  stopRecord(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (!this.data.sentences[index] || !this.data.sentences[index].recording) return;
    this.recorder.stop();
  },

  startTranslationRecord() {
    if (this.data.translationRecording || this.data.translationSpeechLoading) return;
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.currentRecordingType = 'translation';
        this.currentRecordingIndex = null;
        this.setData({ translationRecording: true });
        this.recorder.start({ duration: 60000, format: 'mp3' });
      },
      fail: () => {
        wx.showModal({
          title: '需要录音权限',
          content: '语音输入需要录音权限，你也可以切换为文字输入。',
          confirmText: '去设置',
          cancelText: '文字输入',
          success: (res) => {
            if (res.confirm) wx.openSetting();
            else wx.showToast({ title: '可直接在输入框中填写', icon: 'none' });
          }
        });
      }
    });
  },

  stopTranslationRecord() {
    if (!this.data.translationRecording) return;
    this.recorder.stop();
  },

  transcribeTranslationAudio(filePath) {
    this.setData({ translationSpeechLoading: true });
    wx.showLoading({ title: '识别语音中...', mask: true });
    api.shadowingSpeechToText(filePath, {
      lessonId: String(this.data.id || '')
    }).then(res => {
      const text = res && res.text ? res.text : '';
      if (!text.trim()) {
        throw new Error('未识别到内容，请重录');
      }
      this.setData({
        translationAnswer: text,
        translationInputMode: 'voice',
        translationSpeechLoading: false,
        translationReviewData: null
      });
      wx.hideLoading();
    }).catch(err => {
      console.error('Shadowing translation speech failed:', err);
      this.setData({ translationSpeechLoading: false });
      wx.hideLoading();
      wx.showToast({ title: err.message || '识别失败，请重试或切换文字', icon: 'none' });
    });
  },

  playbackRecord(e) {
    const index = Number(e.currentTarget.dataset.index);
    const sentence = this.data.sentences[index];
    if (!sentence || !sentence.audioFilePath) {
      wx.showToast({ title: '请先录音', icon: 'none' });
      return;
    }
    if (this.localAudio && this.localAudioIndex === index) {
      this.stopLocalAudio();
      return;
    }
    this.pauseMainAudio();
    this.pauseVideo();
    this.stopSegmentAudio();
    this.stopLocalAudio();
    const audio = wx.createInnerAudioContext();
    this.localAudio = audio;
    this.localAudioIndex = index;
    audio.src = sentence.audioFilePath;
    audio.obeyMuteSwitch = false;
    audio.onPlay(() => {
      this.setData({ ['sentences[' + index + '].playingBack']: true });
    });
    audio.onEnded(() => this.stopLocalAudio());
    audio.onStop(() => this.stopLocalAudio());
    audio.onError(err => {
      console.error('Playback record failed:', err);
      wx.showToast({ title: '回放失败', icon: 'none' });
      this.stopLocalAudio();
    });
    audio.play();
  },

  stopLocalAudio() {
    const audio = this.localAudio;
    const index = this.localAudioIndex;
    this.localAudio = null;
    this.localAudioIndex = null;
    if (audio) {
      audio.onEnded(function () {});
      audio.onStop(function () {});
      audio.onError(function () {});
      audio.stop();
      audio.destroy();
    }
    if (index !== undefined && index !== null && index >= 0 && this.data.sentences[index]) {
      this.setData({ ['sentences[' + index + '].playingBack']: false });
    }
  },

  submitReview(e) {
    const index = Number(e.currentTarget.dataset.index);
    const sentence = this.data.sentences[index];
    if (!hasStoredToken()) {
      this.setData({ isLoggedIn: false });
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    app.checkLogin();
    if (!sentence || !sentence.audioFilePath) {
      wx.showToast({ title: '请先录音', icon: 'none' });
      return;
    }
    if (sentence.reviewing) return;
    this.stopLocalAudio();
    this.setData({
      ['sentences[' + index + '].reviewing']: true,
      activeSentenceIndex: index
    });
    wx.showLoading({ title: 'AI 点评中...', mask: true });
    api.reviewShadowingSentence(this.data.id, index, sentence.audioFilePath, {
      referenceText: sentence.en || '',
      durationMs: String(sentence.durationMs || '')
    }).then(res => {
      this.setData({
        ['sentences[' + index + '].reviewing']: false,
        ['sentences[' + index + '].score']: res.overallScore || null,
        reviewData: res,
        reviewSheetOpen: true
      });
      wx.hideLoading();
    }).catch(err => {
      console.error('Review shadowing sentence failed:', err);
      this.setData({ ['sentences[' + index + '].reviewing']: false });
      wx.hideLoading();
      if (err.code !== 401) {
        wx.showToast({ title: err.message || '点评失败，请重试', icon: 'none' });
      }
    });
  },

  closeReviewSheet() {
    this.setData({ reviewSheetOpen: false });
  },

  retrySentence() {
    const index = this.data.activeSentenceIndex;
    this.setData({ reviewSheetOpen: false });
    if (index >= 0) {
      this.setData({
        ['sentences[' + index + '].recorded']: false,
        ['sentences[' + index + '].audioFilePath']: '',
        ['sentences[' + index + '].durationMs']: 0
      });
    }
  },

  submitTranslationReview() {
    const answer = (this.data.translationAnswer || '').trim();
    const cloze = (this.data.content && this.data.content.cloze) || {};
    const promptZh = cloze.zhPromptText || cloze.promptText || '';
    if (!hasStoredToken()) {
      this.setData({ isLoggedIn: false });
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    app.checkLogin();
    if (!answer) {
      wx.showToast({ title: '请先输入或识别英文翻译', icon: 'none' });
      return;
    }
    if (!promptZh) {
      wx.showToast({ title: '中文题目缺失，无法点评', icon: 'none' });
      return;
    }
    if (this.data.translationReviewLoading) return;
    this.setData({ translationReviewLoading: true, translationReviewData: null });
    wx.showLoading({ title: 'AI 点评中...', mask: true });
    api.reviewShadowingTranslation(this.data.id, {
      promptZh: promptZh,
      referenceText: cloze.enFullText || '',
      userAnswer: answer,
      inputMode: this.data.translationInputMode
    }).then(res => {
      const parsed = parseAiContent(res.content || res);
      if (!parsed || parsed.error) {
        throw new Error(parsed && parsed.error ? parsed.error : 'AI 返回格式异常');
      }
      this.setData({ translationReviewData: parsed, translationReviewLoading: false });
      wx.hideLoading();
      wx.pageScrollTo({ selector: '#translation-review', offsetTop: -20 });
    }).catch(err => {
      console.error('Review translation failed:', err);
      this.setData({ translationReviewLoading: false });
      wx.hideLoading();
      if (err.code !== 401) {
        wx.showToast({ title: err.message || '点评失败，请重试', icon: 'none' });
      }
    });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/index' });
  }
});
