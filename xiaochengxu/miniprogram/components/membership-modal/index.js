var api = require('../../utils/api');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    expired: {
      type: Boolean,
      value: false
    }
  },

  data: {
    contactInfo: null,
    loadingContact: false
  },

  observers: {
    'visible': function (val) {
      if (val && !this.data.contactInfo) {
        this.loadContact();
      }
    }
  },

  methods: {
    loadContact: function () {
      var that = this;
      that.setData({ loadingContact: true });
      api.getMembershipContact().then(function (res) {
        that.setData({
          contactInfo: res,
          loadingContact: false
        });
      }).catch(function () {
        that.setData({ loadingContact: false });
      });
    },

    onClose: function () {
      this.triggerEvent('close');
    },

    onRedeem: function () {
      this.triggerEvent('close');
      wx.navigateTo({
        url: '/pages/redeem/index'
      });
    },

    onBuyMembership: function () {
      this.triggerEvent('close');
      wx.navigateTo({
        url: '/pages/membership/index'
      });
    },

    onCopyContact: function () {
      if (this.data.contactInfo && this.data.contactInfo.contact) {
        wx.setClipboardData({
          data: this.data.contactInfo.contact,
          success: function () {
            wx.showToast({ title: '已复制', icon: 'success' });
          }
        });
      }
    }
  }
});
