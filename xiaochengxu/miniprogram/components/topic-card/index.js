Component({
  properties: {
    topic: {
      type: Object,
      value: {}
    }
  },

  data: {
    tagList: []
  },

  observers: {
    'topic.tags': function (tags) {
      if (tags && typeof tags === 'string') {
        var list = tags.split(',').map(function (t) {
          return t.trim();
        }).filter(function (t) {
          return t.length > 0;
        });
        this.setData({ tagList: list });
      } else {
        this.setData({ tagList: [] });
      }
    }
  },

  methods: {
    onCardTap: function () {
      var id = this.properties.topic.id;
      if (id) {
        wx.navigateTo({
          url: '/pages/topicDetail/index?id=' + id
        });
      }
    }
  }
});
