const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    year: 0,
    month: 0,
    monthText: '',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    topicMap: {},
    selectedDate: '',
    selectedTopics: [],
    loading: false
  },

  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.loadCalendar();
  },

  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    this.setData({ year, month, selectedDate: '', selectedTopics: [] });
    this.loadCalendar();
  },

  nextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    this.setData({ year, month, selectedDate: '', selectedTopics: [] });
    this.loadCalendar();
  },

  async loadCalendar() {
    const { year, month } = this.data;
    const monthText = year + '年' + month + '月';
    this.setData({ loading: true, monthText });

    try {
      const res = await api.getCalendar(year, month);
      const topicMap = res || {};
      const calendarDays = this.buildCalendarDays(year, month, topicMap);

      this.setData({
        calendarDays,
        topicMap,
        loading: false
      });
    } catch (e) {
      console.error('Load calendar error:', e);
      const calendarDays = this.buildCalendarDays(year, month, {});
      this.setData({ calendarDays, topicMap: {}, loading: false });
    }
  },

  buildCalendarDays(year, month, topicMap) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const todayStr = util.formatDate(today);

    const days = [];

    // Previous month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: '', dateStr: '', empty: true, hasTopics: false, isToday: false, topicCount: 0 });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const topicsForDay = topicMap[dateStr] || [];
      days.push({
        day: d,
        dateStr: dateStr,
        empty: false,
        hasTopics: topicsForDay.length > 0,
        isToday: dateStr === todayStr,
        topicCount: topicsForDay.length
      });
    }

    // Next month padding to complete the grid
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({ day: '', dateStr: '', empty: true, hasTopics: false, isToday: false, topicCount: 0 });
      }
    }

    return days;
  },

  onDayTap(e) {
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;

    const topics = this.data.topicMap[dateStr] || [];
    this.setData({
      selectedDate: dateStr,
      selectedTopics: topics
    });
  },

  goToTopicDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/topicDetail/index?id=' + id });
  }
});
