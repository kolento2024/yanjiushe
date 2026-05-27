// pages/my/my.js
Page({
  data: {
    // 用户信息
    isLoggedIn: false,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    // 菜单列表
    menus: [
      { key: 'schedule', icon: '📋', label: '课程表', desc: '查看预约记录' },
      { key: 'message', icon: '💬', label: '消息', desc: '查看消息通知' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载本地缓存的用户信息
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.nickName) {
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo
        })
      }
    } catch (e) {}
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    try {
      wx.setStorageSync('userInfo', userInfo)
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
    } catch (e) {}
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const userInfo = { ...this.data.userInfo, avatarUrl }
    this.saveUserInfo(userInfo)
  },

  // 输入昵称
  onNickInput(e) {
    const nickName = e.detail.value
    if (nickName) {
      const userInfo = { ...this.data.userInfo, nickName }
      this.saveUserInfo(userInfo)
    }
  },

  // 失焦昵称（微信昵称选择器触发 blur）
  onNickBlur(e) {
    const nickName = e.detail.value
    if (nickName && nickName !== this.data.userInfo.nickName) {
      const userInfo = { ...this.data.userInfo, nickName }
      this.saveUserInfo(userInfo)
    }
  },

  // 点击菜单
  onMenuTap(e) {
    const { key } = e.currentTarget.dataset
    const urlMap = {
      schedule: '/pages/schedule/schedule',
      message: '/pages/message/message'
    }
    wx.navigateTo({ url: urlMap[key] })
  }
})
