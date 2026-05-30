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
      var util = require('../../utils/util');
      var normalized = util.normalizeKnownTags(tags);
      var list = normalized.length > 0 ? normalized : util.parseTags(tags);
      this.setData({ tagList: list });
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
