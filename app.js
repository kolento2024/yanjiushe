// app.js
App({
  onLaunch() {
    // 初始化腾讯云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d8ge1t6v06849c054',
        traceUser: true,
        timeout: 15000
      })
    }
  }
})
