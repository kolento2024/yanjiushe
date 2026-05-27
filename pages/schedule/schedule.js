// pages/schedule/schedule.js
Page({
  data: {
    // 云数据库是否可用
    cloudReady: false,

    // 筛选日期
    filterDate: '',
    filterLabel: '全部',

    // 快捷日期
    dateFilters: [],

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
  },

  onShow() {
    this.fetchBookings()
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

  // 从云数据库查询预约
  fetchBookings() {
    this.setData({ loading: true })

    // 检查云开发是否可用
    if (!wx.cloud) {
      this.setData({ loading: false, cloudReady: false, isEmpty: true })
      return
    }

    const db = wx.cloud.database()
    db.collection('bookings')
      .orderBy('bookingDate', 'asc')
      .orderBy('bookingTime', 'asc')
      .limit(100)
      .get()
      .then(res => {
        const bookings = res.data.map(item => ({
          ...item,
          phoneMasked: this.maskPhone(item.phone || '')
        }))
        this.setData({
          allBookings: bookings,
          cloudReady: true,
          loading: false
        })
        this.applyFilter()
      })
      .catch(err => {
        console.error('查询预约失败：', err)
        // 如果集合不存在或权限不足，用本地存储兜底
        this.loadFromStorage()
      })
  },

  // 本地存储兜底
  loadFromStorage() {
    try {
      const localData = wx.getStorageSync('bookings') || []
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

  onPullDownRefresh() {
    this.fetchBookings().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
