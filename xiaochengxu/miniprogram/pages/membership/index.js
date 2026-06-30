var api = require('../../utils/api');
var app = getApp();

function centsToYuan(cents) {
  return ((cents || 0) / 100).toFixed(2);
}

function normalizePayError(err) {
  var errMsg = (err && err.errMsg) || '';
  if (errMsg.indexOf('cancel') >= 0) {
    return '未完成支付';
  }
  if (errMsg) {
    return errMsg.replace(/^requestPayment:fail\s*/i, '') || '支付失败，请稍后重试';
  }
  return '支付失败，请稍后重试';
}

Page({
  data: {
    loading: true,
    error: '',
    plans: [],
    membershipActive: false,
    membershipPermanent: false,
    membershipExpireAt: '',
    payingPlanId: null,
    confirmingOrderNo: ''
  },

  onLoad: function () {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    this.loadData();
  },

  loadData: function () {
    var that = this;
    that.setData({ loading: true, error: '' });
    Promise.all([
      api.getMembershipStatus(),
      api.getMembershipPlans()
    ]).then(function (results) {
      var status = results[0] || {};
      var plans = (results[1] || []).map(function (plan) {
        return Object.assign({}, plan, {
          priceText: centsToYuan(plan.effectivePriceCents || plan.salePriceCents),
          originalPriceText: centsToYuan(plan.originalPriceCents),
          durationText: plan.permanent ? '永久会员' : (plan.durationDays + ' 天')
        });
      });
      that.setData({
        loading: false,
        membershipActive: !!status.membershipActive,
        membershipPermanent: !!status.membershipPermanent,
        membershipExpireAt: status.membershipExpireAt ? String(status.membershipExpireAt).replace('T', ' ').substring(0, 19) : '',
        plans: plans
      });
      app.globalData.membershipActive = !!status.membershipActive;
      app.globalData.membershipPermanent = !!status.membershipPermanent;
      app.globalData.membershipExpireAt = status.membershipExpireAt || '';
      wx.setStorageSync('membershipActive', !!status.membershipActive);
      wx.setStorageSync('membershipPermanent', !!status.membershipPermanent);
      wx.setStorageSync('membershipExpireAt', status.membershipExpireAt || '');
    }).catch(function (err) {
      that.setData({ loading: false, error: err.message || '加载失败' });
    });
  },

  buyPlan: function (e) {
    var planId = e.currentTarget.dataset.id;
    if (!planId || this.data.payingPlanId) return;
    var that = this;
    that.setData({ payingPlanId: planId, confirmingOrderNo: '' });
    api.createMembershipOrder(planId).then(function (res) {
      var params = res.paymentParams || {};
      that.setData({ confirmingOrderNo: res.orderNo });
      if (params.mockPayment || (params.package && params.package.indexOf('prepay_id=mock_') === 0)) {
        that.completeMockPayment(res.orderNo);
        return;
      }
      if (!params.timeStamp || !params.nonceStr || !params.package || !params.paySign) {
        wx.showToast({ title: '支付参数不完整，请稍后重试', icon: 'none' });
        that.setData({ payingPlanId: null, confirmingOrderNo: '' });
        return;
      }
      wx.requestPayment({
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.package,
        signType: params.signType || 'RSA',
        paySign: params.paySign,
        success: function () {
          that.confirmOrder(res.orderNo, 0);
        },
        fail: function (err) {
          wx.showToast({ title: normalizePayError(err), icon: 'none' });
          that.setData({ payingPlanId: null, confirmingOrderNo: '' });
        }
      });
    }).catch(function (err) {
      wx.showToast({ title: err.message || '创建订单失败', icon: 'none' });
      that.setData({ payingPlanId: null });
    });
  },

  completeMockPayment: function (orderNo) {
    var that = this;
    api.mockPaidMembershipOrder(orderNo).then(function () {
      that.confirmOrder(orderNo, 0);
    }).catch(function (err) {
      wx.showToast({ title: err.message || '模拟支付失败', icon: 'none' });
      that.setData({ payingPlanId: null, confirmingOrderNo: '' });
    });
  },

  confirmOrder: function (orderNo, count) {
    var that = this;
    api.getMembershipOrder(orderNo).then(function (order) {
      if (order.status === 'PAID') {
        wx.showToast({ title: '开通成功', icon: 'success' });
        that.setData({ payingPlanId: null, confirmingOrderNo: '' });
        that.loadData();
        return;
      }
      if (count < 5) {
        setTimeout(function () {
          that.confirmOrder(orderNo, count + 1);
        }, 1200);
      } else {
        wx.showToast({ title: '支付确认中，请稍后刷新', icon: 'none' });
        that.setData({ payingPlanId: null });
      }
    }).catch(function () {
      that.setData({ payingPlanId: null });
    });
  }
});
