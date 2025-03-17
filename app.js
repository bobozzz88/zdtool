// app.js
App({
  onLaunch: function() {
    // 检查本地存储中的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  globalData: {
    userInfo: null
  }
})
