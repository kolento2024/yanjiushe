// pages/my/my.js
Page({
  data: {
    // 用户信息
    isLoggedIn: false,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    // 订阅通知状态
    subscribed: false,
    subscribing: false,
    // 菜单列表
    menus: [
      { key: 'schedule', icon: '📋', label: '课程表', desc: '查看我的预约' },
      { key: 'roster', icon: '📅', label: '排班表', desc: '查看全部学员预约' },
      { key: 'log', icon: '📝', label: '操作日志', desc: '预约与取消记录' },
      { key: 'message', icon: '💬', label: '消息', desc: '查看消息通知' }
    ]
  },

  onLoad() {
    this._loaded = true
    this.loadUserInfo()
    this.checkSubscribeStatus()
  },

  onShow() {
    if (!this._loaded) {
      this.loadUserInfo()
      this.checkSubscribeStatus()
    }
  },

  // 检查是否已订阅通知（读取云数据库中的店长 openid）
  checkSubscribeStatus() {
    if (!wx.cloud) return
    const db = wx.cloud.database()
    db.collection('settings')
      .doc('shop_owner')
      .get()
      .then(res => {
        this.setData({ subscribed: !!res.data })
      })
      .catch(() => {
        this.setData({ subscribed: false })
      })
  },

  // 订阅通知（店长专属）
  subscribeNotify() {
    if (this.data.subscribing) return
    this.setData({ subscribing: true })

    // 从 notify.js 获取模板ID
    const { TMPL_ID } = require('../../utils/notify')
    if (TMPL_ID === 'TEMPLATE_ID_PLACEHOLDER') {
      wx.showModal({
        title: '模板未配置',
        content: '请先在 utils/notify.js 中将 TEMPLATE_ID_PLACEHOLDER 替换为微信公众平台申请的订阅消息模板ID',
        showCancel: false
      })
      this.setData({ subscribing: false })
      return
    }

    // 微信订阅消息授权
    wx.requestSubscribeMessage({
      tmplIds: [TMPL_ID],
      success: (res) => {
        if (res[TMPL_ID] === 'accept') {
          this._saveOwnerOpenid()
        } else {
          wx.showToast({ title: '需要授权后才能接收通知', icon: 'none' })
          this.setData({ subscribing: false })
        }
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err)
        wx.showToast({ title: '授权失败，请重试', icon: 'none' })
        this.setData({ subscribing: false })
      }
    })
  },

  _saveOwnerOpenid() {
    // 调用云函数获取当前用户的 openid
    wx.cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: { action: 'getOpenid' }
    }).then(res => {
      const openid = res.result && res.result.openid
      if (!openid) {
        wx.showToast({ title: '获取openid失败', icon: 'none' })
        this.setData({ subscribing: false })
        return
      }

      const db = wx.cloud.database()
      const userInfo = wx.getStorageSync('userInfo') || {}
      db.collection('settings').doc('shop_owner').set({
        data: {
          openid: openid,
          nickName: userInfo.nickName || '',
          updatedAt: db.serverDate()
        }
      }).then(() => {
        this.setData({ subscribed: true, subscribing: false })
        wx.showToast({ title: '订阅成功', icon: 'success' })
      }).catch(() => {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        this.setData({ subscribing: false })
      })
    }).catch(() => {
      wx.showToast({ title: '获取openid失败', icon: 'none' })
      this.setData({ subscribing: false })
    })
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
      roster: '/pages/roster/roster',
      log: '/pages/log/log',
      message: '/pages/message/message'
    }
    wx.navigateTo({ url: urlMap[key] })
  }
})
