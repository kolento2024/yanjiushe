// pages/schedule/schedule.js
const { addLog } = require('../../utils/operations')

Page({
  data: {
    // 云数据库是否可用
    cloudReady: false,

    // 筛选日期
    filterDate: '',
    filterLabel: '全部',

    // 快捷日期
    dateFilters: [],

    // 日期选择器
    pickerDate: '',
    pickerDateText: '',
    pickerStart: '',
    pickerEnd: '',

    // 所有课程数据
    allBookings: [],
    // 筛选后的课程
    displayBookings: [],

    // 加载状态
    loading: true,
    isEmpty: false
  },

  onLoad() {
    this.initDateFilters()
    this.initPickerRange()
  },

  onShow() {
    this.fetchBookings()
  },

  // 初始化日期选择器范围（前3个月 ~ 后3个月）
  initPickerRange() {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 3)
    const end = new Date(today)
    end.setMonth(today.getMonth() + 3)
    this.setData({
      pickerDate: this.formatDate(today),
      pickerDateText: '今天',
      pickerStart: this.formatDate(start),
      pickerEnd: this.formatDate(end)
    })
  },

  // 日期选择器变化
  onPickerDateChange(e) {
    const dateStr = e.detail.value
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const d = new Date(dateStr.replace(/-/g, '/'))
    const month = d.getMonth() + 1
    const day = d.getDate()
    const week = weekDays[d.getDay()]
    const label = month + '/' + day + ' 周' + week

    const todayStr = this.formatDate(new Date())
    if (dateStr === todayStr) {
      this.setData({ pickerDateText: '今天' })
    } else {
      this.setData({ pickerDateText: label })
    }

    this.setData({
      pickerDate: dateStr,
      filterDate: dateStr,
      filterLabel: label
    })
    this.applyFilter()
  },

  // 初始化快捷日期筛选
  initDateFilters() {
    const today = new Date()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const filters = [{ label: '全部', date: '' }]

    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const month = d.getMonth() + 1
      const day = d.getDate()
      const label = i === 0 ? '今天' : (i === 1 ? '明天' : month + '/' + day + ' 周' + weekDays[d.getDay()])
      filters.push({
        label: label,
        date: this.formatDate(d)
      })
    }

    this.setData({
      dateFilters: filters,
      filterLabel: filters[0].label
    })
  },

  formatDate(d) {
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return y + '-' + m + '-' + day
  },

  // 从云数据库查询当前用户的预约
  fetchBookings() {
    this.setData({ loading: true })

    // 获取当前用户昵称
    const userInfo = wx.getStorageSync('userInfo') || {}
    const currentNickName = userInfo.nickName || ''

    if (!wx.cloud) {
      this.setData({ loading: false, cloudReady: false, isEmpty: true })
      return Promise.resolve()
    }

    const db = wx.cloud.database()
    return db.collection('bookings')
      .orderBy('bookingDate', 'asc')
      .orderBy('bookingTime', 'asc')
      .limit(100)
      .get()
      .then(res => {
        let bookings = res.data
          .filter(item => item.status !== 'cancelled')
          .map(item => ({
            ...item,
            phoneMasked: this.maskPhone(item.phone || '')
          }))
        // 只保留当前用户的预约（匹配 userNickName）
        if (currentNickName) {
          bookings = bookings.filter(item => item.userNickName === currentNickName)
        }
        this.setData({
          allBookings: bookings,
          cloudReady: true,
          loading: false
        })
        this.applyFilter()
      })
      .catch(err => {
        console.error('查询预约失败：', err)
        this.loadFromStorage()
      })
  },

  // 本地存储兜底
  loadFromStorage() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {}
      const currentNickName = userInfo.nickName || ''
      let localData = wx.getStorageSync('bookings') || []
      // 过滤已取消的
      localData = localData.filter(item => item.status !== 'cancelled')
      if (currentNickName) {
        localData = localData.filter(item => item.userNickName === currentNickName)
      }
      const bookings = localData.map(item => ({
        ...item,
        phoneMasked: this.maskPhone(item.phone || '')
      }))
      this.setData({
        allBookings: bookings,
        cloudReady: false,
        loading: false
      })
      this.applyFilter()
    } catch (e) {
      this.setData({ loading: false, isEmpty: true })
    }
  },

  // 手机号脱敏 138****1234
  maskPhone(phone) {
    if (phone.length === 11) {
      return phone.slice(0, 3) + '****' + phone.slice(7)
    }
    return phone
  },

  // 按日期筛选
  filterByDate(e) {
    const { date } = e.currentTarget.dataset
    const filter = this.data.dateFilters.find(f => f.date === date)
    this.setData({
      filterDate: date,
      filterLabel: filter ? filter.label : '全部'
    })
    this.applyFilter()
  },

  // 应用筛选
  applyFilter() {
    const { allBookings, filterDate } = this.data
    let result = allBookings

    if (filterDate) {
      result = allBookings.filter(item => item.bookingDate === filterDate)
    }

    // 按日期分组
    const grouped = {}
    result.forEach(item => {
      const d = item.bookingDate
      if (!grouped[d]) {
        grouped[d] = []
      }
      grouped[d].push(item)
    })

    const display = Object.keys(grouped)
      .sort()
      .map(date => ({
        date: date,
        dateLabel: this.formatDateLabel(date),
        items: grouped[date]
      }))

    this.setData({
      displayBookings: display,
      isEmpty: display.length === 0
    })
  },

  // 日期格式化显示 如"5月26日 周一"
  formatDateLabel(dateStr) {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const d = new Date(dateStr.replace(/-/g, '/'))
    const month = d.getMonth() + 1
    const day = d.getDate()
    const week = weekDays[d.getDay()]
    return month + '月' + day + '日 周' + week
  },

  // 服务颜色映射
  getServiceColor(serviceName) {
    const colorMap = {
      '新娘妆': '#FF6B8A',
      '舞台妆': '#C9A96E',
      '晚宴妆': '#A78BFA',
      '日常妆容': '#D48B8B',
      '男士妆': '#8BA4D4',
      '试妆体验': '#6BBFA0'
    }
    return colorMap[serviceName] || '#D48B8B'
  },

  // 跳转预约
  goBook() {
    wx.reLaunch({ url: '/pages/book/book' })
  },

  // 用户取消预约
  cancelBooking(e) {
    const { id } = e.currentTarget.dataset
    const booking = this.findBookingById(id)
    if (!booking) return

    wx.showModal({
      title: '取消预约',
      content: `确定要取消【${booking.serviceName}】的预约吗？`,
      confirmColor: '#D48B8B',
      success: (res) => {
        if (res.confirm) {
          this.doCancel(id, booking)
        }
      }
    })
  },

  // 查找预约记录
  findBookingById(id) {
    for (const group of this.data.displayBookings) {
      for (const item of group.items) {
        if (item._id === id) return item
      }
    }
    return null
  },

  // 执行取消
  doCancel(id, booking) {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const now = new Date().toLocaleString('zh-CN', { hour12: false })

    if (this.data.cloudReady && wx.cloud) {
      const db = wx.cloud.database()
      db.collection('bookings').doc(id).update({
        data: { status: 'cancelled', cancelTime: now, cancelBy: userInfo.nickName || '' }
      }).then(() => {
        this.onCancelSuccess(id, booking, now, userInfo)
      }).catch(() => {
        this.cancelLocal(id, booking, now, userInfo)
      })
    } else {
      this.cancelLocal(id, booking, now, userInfo)
    }
  },

  // 本地取消
  cancelLocal(id, booking, now, userInfo) {
    try {
      const localData = wx.getStorageSync('bookings') || []
      const idx = localData.findIndex(b => (b._id === id || b.createTime === booking.createTime))
      if (idx >= 0) {
        localData[idx].status = 'cancelled'
        localData[idx].cancelTime = now
        localData[idx].cancelBy = userInfo.nickName || ''
        wx.setStorageSync('bookings', localData)
      }
      this.onCancelSuccess(id, booking, now, userInfo)
    } catch (e) {
      wx.showToast({ title: '取消失败', icon: 'none' })
    }
  },

  onCancelSuccess(id, booking, now, userInfo) {
    // 记录操作日志
    addLog('cancel_by_user', {
      nickName: userInfo.nickName || booking.name || '用户',
      serviceName: booking.serviceName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      time: now
    })

    // 刷新列表
    this.fetchBookings()
    wx.showToast({ title: '已取消', icon: 'success' })
  },

  onPullDownRefresh() {
    this.fetchBookings().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
