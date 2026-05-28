// pages/about/about.js
Page({
  data: {},

  onLoad() {},

  // 复制微信号
  copyWechat() {
    wx.setClipboardData({
      data: 'Rosy20201',
      success: () => {
        wx.showToast({
          title: '已复制微信号',
          icon: 'success'
        })
      }
    })
  }
})
