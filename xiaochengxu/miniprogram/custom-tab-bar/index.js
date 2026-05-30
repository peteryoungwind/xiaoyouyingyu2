Component({
  data: {
    selected: 0,
    color: '#8E8E93',
    selectedColor: '#007AFF',
    list: [
      {
        pagePath: '/pages/home/index',
        text: '首页',
        iconPath: '/images/tabbar/home.svg',
        selectedIconPath: '/images/tabbar/home-active.svg'
      },
      {
        pagePath: '/pages/topics/index',
        text: '主题',
        iconPath: '/images/tabbar/grid.svg',
        selectedIconPath: '/images/tabbar/grid-active.svg'
      },
      {
        pagePath: '/pages/learning/index',
        text: '学习',
        iconPath: '/images/tabbar/book.svg',
        selectedIconPath: '/images/tabbar/book-active.svg'
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconPath: '/images/tabbar/person.svg',
        selectedIconPath: '/images/tabbar/person-active.svg'
      }
    ]
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const path = this.data.list[index].pagePath;
      wx.switchTab({ url: path });
    }
  }
});
