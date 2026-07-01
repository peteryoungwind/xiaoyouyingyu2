const app = getApp();
const api = require('../../utils/api');

function uuid() {
  return Date.now() + '-' + Math.random().toString(16).slice(2);
}

Page({
  data: {
    sessionId: '',
    mode: 'TEACHING',
    difficulty: 'BEGINNER',
    topicSource: 'SYSTEM',
    topicId: null,
    customTopic: '',
    topicTitle: '',
    topicTitleZh: '',
    config: null,
    remainingToday: 0,
    roundCount: 0,
    messages: [],
    promptChips: [
      { text: 'Can you ask me first?' },
      { text: '我先用中文说想法' },
      { text: 'I want to try in English.' }
    ],
    progressPercent: 0,
    inputText: '',
    inputMode: 'voice',
    sending: false,
    recording: false,
    transcribing: false,
    error: ''
  },

  onLoad(options) {
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    this.audio = wx.createInnerAudioContext();
    this.setupRecorder();
    this.setData({
      sessionId: uuid(),
      mode: options.mode || 'TEACHING',
      difficulty: options.difficulty || 'BEGINNER',
      topicSource: options.topicSource || 'SYSTEM',
      topicId: options.topicId ? Number(options.topicId) : null,
      customTopic: decodeURIComponent(options.customTopic || ''),
      topicTitle: decodeURIComponent(options.topicTitle || ''),
      topicTitleZh: decodeURIComponent(options.topicTitleZh || '')
    });
    this.loadConfig();
  },

  onUnload() {
    if (this.data.recording && this.recorder) {
      this.unloading = true;
      this.recorder.stop();
    }
    if (this.audio) this.audio.destroy();
  },

  setupRecorder() {
    this.recorder = wx.getRecorderManager();
    this.recorder.onStop((res) => {
      this.setData({ recording: false });
      if (this.unloading) return;
      if (res && res.tempFilePath) {
        this.transcribeAudio(res.tempFilePath);
      }
    });
    this.recorder.onError((err) => {
      console.error('AI dialog record failed:', err);
      this.setData({ recording: false });
      wx.showToast({ title: '录音失败，请重试或切换文字', icon: 'none' });
    });
  },

  loadConfig() {
    api.getAiDialogConfig().then(res => {
      this.setData({
        config: res,
        remainingToday: res.remainingToday || 0,
        progressPercent: this.calculateProgress(this.data.roundCount, res.maxRoundsPerSession),
        error: res.enabled === false ? 'AI 对话暂不可用，请稍后再试' : ''
      });
    }).catch(err => {
      this.setData({ error: err.message || '配置加载失败' });
    });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  toggleInputMode() {
    if (this.data.recording || this.data.transcribing) return;
    this.setData({
      inputMode: this.data.inputMode === 'voice' ? 'text' : 'voice'
    });
  },

  usePrompt(e) {
    this.setData({
      inputMode: 'text',
      inputText: e.currentTarget.dataset.text || ''
    });
  },

  startRecord() {
    if (this.data.recording || this.data.transcribing || this.data.sending) return;
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({ recording: true });
        this.recorder.start({
          duration: 60000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3'
        });
      },
      fail: () => {
        wx.showModal({
          title: '需要录音权限',
          content: '语音输入需要录音权限，你也可以切换为文字输入。',
          confirmText: '去设置',
          cancelText: '文字输入',
          success: (res) => {
            if (res.confirm) wx.openSetting();
            else this.setData({ inputMode: 'text' });
          }
        });
      }
    });
  },

  stopRecord() {
    if (!this.data.recording) return;
    this.recorder.stop();
  },

  transcribeAudio(filePath) {
    this.setData({ transcribing: true });
    wx.showLoading({ title: '识别语音中...', mask: true });
    api.speechToText(filePath, {
      sessionId: this.data.sessionId,
      topicSource: this.data.topicSource,
      topicId: this.data.topicId ? String(this.data.topicId) : '',
      mode: this.data.mode,
      difficulty: this.data.difficulty,
      audioFormat: 'mp3'
    }).then(res => {
      var text = res && res.text ? res.text : '';
      if (!text.trim()) {
        throw new Error('未识别到内容，请重录');
      }
      this.setData({
        inputText: text,
        inputMode: 'text',
        transcribing: false
      });
      wx.hideLoading();
    }).catch(err => {
      console.error('AI dialog speech to text failed:', err);
      this.setData({ transcribing: false, inputMode: 'text' });
      wx.hideLoading();
      wx.showToast({ title: err.message || '识别失败，请使用文字输入', icon: 'none' });
    });
  },

  sendMessage() {
    var text = this.data.inputText.trim();
    if (!text || this.data.sending) return;
    if (!this.data.config || this.data.config.enabled === false) {
      wx.showToast({ title: 'AI 对话暂不可用', icon: 'none' });
      return;
    }
    if (this.data.remainingToday <= 0) {
      wx.showToast({ title: '今日额度已用尽', icon: 'none' });
      return;
    }
    if (this.data.roundCount >= this.data.config.maxRoundsPerSession) {
      wx.showToast({ title: '本次练习已完成，请重新开始', icon: 'none' });
      return;
    }

    var userMessage = { id: uuid(), role: 'user', content: text };
    var thinkingMessage = { id: uuid(), role: 'assistant', thinking: true };
    var nextMessages = this.data.messages.concat([userMessage, thinkingMessage]);
    this.setData({ messages: nextMessages, inputText: '', sending: true, error: '' });

    api.sendAiDialogMessage({
      sessionId: this.data.sessionId,
      topicSource: this.data.topicSource,
      topicId: this.data.topicId,
      customTopic: this.data.customTopic,
      mode: this.data.mode,
      difficulty: this.data.difficulty,
      roundCount: this.data.roundCount,
      message: text,
      history: this.buildHistory(nextMessages)
    }).then(res => {
      var reply = res.reply || {};
      var assistantMessage = {
        id: thinkingMessage.id,
        role: 'assistant',
        reply: reply,
        content: reply.replyEn || '',
        audioUrl: res.audioUrl || '',
        showText: true,
        thinking: false
      };
      var messages = this.data.messages.map(m => m.id === thinkingMessage.id ? assistantMessage : m);
      this.setData({
        messages: messages,
        remainingToday: res.remainingToday,
        roundCount: this.data.roundCount + 1,
        progressPercent: this.calculateProgress(this.data.roundCount + 1, this.data.config.maxRoundsPerSession),
        sending: false
      });
      this.playAudio(assistantMessage);
    }).catch(err => {
      var messages = this.data.messages.filter(m => m.id !== thinkingMessage.id);
      this.setData({ messages: messages, sending: false, error: err.message || 'AI 回复失败' });
      wx.showToast({ title: err.message || 'AI 回复失败', icon: 'none' });
    });
  },

  buildHistory(messages) {
    return messages.filter(m => !m.thinking).map(m => {
      if (m.role === 'assistant') {
        var content = m.content || '';
        if (m.reply && m.reply.nextPromptEn) content += '\n' + m.reply.nextPromptEn;
        return { role: 'assistant', content: content };
      }
      return { role: 'user', content: m.content };
    });
  },

  toggleText(e) {
    var id = e.currentTarget.dataset.id;
    var messages = this.data.messages.map(m => {
      if (m.id === id) {
        m.showText = !m.showText;
      }
      return m;
    });
    this.setData({ messages: messages });
  },

  replayAudio(e) {
    var id = e.currentTarget.dataset.id;
    var message = this.data.messages.find(m => m.id === id);
    this.playAudio(message);
  },

  playAudio(message) {
    if (!message || !message.audioUrl) return;
    var base = app.globalData.baseUrl.replace(/\/api$/, '');
    var src = message.audioUrl.indexOf('http') === 0 ? message.audioUrl : base + message.audioUrl;
    this.audio.stop();
    this.audio.src = src;
    this.audio.play();
  },

  calculateProgress(roundCount, maxRounds) {
    if (!maxRounds) return 0;
    return Math.min(100, Math.round((roundCount / maxRounds) * 100));
  },

  restart() {
    wx.redirectTo({ url: '/pages/aiDialogSetup/index' });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => this.restart()
    });
  }
});
