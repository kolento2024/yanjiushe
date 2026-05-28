// pages/booking-search/booking-search.js
Page({
  data: {
    // 搜索条件
    searchName: '',
    searchDate: '',
    searchDateText: '全部日期',

    // 查询结果
    results: [],
    loading: false,
    searched: false,

    // 服务颜色映射
    serviceColorMap: {
      '新娘妆': '#FF6B8A',
      '舞台妆': '#C9A96E',
      '晚宴妆': '#A78BFA',
      '日常妆容': '#D48B8B',
      '男士妆': '#8BA4D4',
      '试妆体验': '#6BBFA0'
    }
  },

  onLoad() {
    this.onSearch()
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({ searchName: e.detail.value })
  },

  // 选择日期
  onDateChange(e) {
    const dateStr = e.detail.value
    if (!dateStr) {
      this.setData({ searchDate: '', searchDateText: '全部日期' })
      return
    }
    const d = new Date(dateStr.replace(/-/g, '/'))
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const month = d.getMonth() + 1
    const day = d.getDate()
    const week = weekDays[d.getDay()]
    this.setData({
      searchDate: dateStr,
      searchDateText: month + '月' + day + '日 周' + week
    })
  },

  // 清除日期筛选
  clearDate() {
    this.setData({ searchDate: '', searchDateText: '全部日期' })
  },

  // 清除姓名
  clearName() {
    this.setData({ searchName: '' })
  },

  // 执行搜索
  onSearch() {
    const { searchName, searchDate } = this.data

    this.setData({ loading: true, searched: false })

    if (!wx.cloud) {
      this.searchLocal()
      return
    }

    const db = wx.cloud.database()
    const keyword = searchName.trim()

    // 云数据库查询
    db.collection('bookings')
      .orderBy('bookingDate', 'asc')
      .orderBy('bookingTime', 'asc')
      .limit(200)
      .get()
      .then(res => {
        let bookings = res.data

        // 姓名模糊匹配
        if (keyword) {
          bookings = bookings.filter(item => {
            const name = (item.name || '').toLowerCase()
            const nick = (item.userNickName || '').toLowerCase()
            const kw = keyword.toLowerCase()
            return name.includes(kw) || nick.includes(kw)
          })
        }

        // 日期精确匹配
        if (searchDate) {
          bookings = bookings.filter(item => item.bookingDate === searchDate)
        }

        const serviceColorMap = this.data.serviceColorMap
        const results = bookings.map(item => ({
          ...item,
          serviceColor: serviceColorMap[item.serviceName] || '#D48B8B',
          displayPhone: (item.phone || '').length === 11
            ? (item.phone || '').slice(0, 3) + '****' + (item.phone || '').slice(7)
            : (item.phone || '')
        }))

        this.setData({
          results,
          loading: false,
          searched: true
        })
      })
      .catch(err => {
        console.error('查询预约失败:', err)
        this.searchLocal()
      })
  },

  // 本地数据搜索（降级方案）
  searchLocal() {
    const { searchName, searchDate } = this.data
    const keyword = searchName.trim()

    try {
      let bookings = wx.getStorageSync('bookings') || []

      if (keyword) {
        bookings = bookings.filter(item => {
          const name = (item.name || '').toLowerCase()
          const nick = (item.userNickName || '').toLowerCase()
          const kw = keyword.toLowerCase()
          return name.includes(kw) || nick.includes(kw)
        })
      }

      if (searchDate) {
        bookings = bookings.filter(item => item.bookingDate === searchDate)
      }

      const serviceColorMap = this.data.serviceColorMap
      const results = bookings.map(item => ({
        ...item,
        serviceColor: serviceColorMap[item.serviceName] || '#D48B8B',
        displayPhone: (item.phone || '').length === 11
          ? (item.phone || '').slice(0, 3) + '****' + (item.phone || '').slice(7)
          : (item.phone || '')
      }))

      this.setData({
        results,
        loading: false,
        searched: true
      })
    } catch (e) {
      this.setData({ loading: false, searched: true })
    }
  },

  // 格式化日期显示
  formatDateLabel(dateStr) {
    if (!dateStr) return ''
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const d = new Date(dateStr.replace(/-/g, '/'))
    const month = d.getMonth() + 1
    const day = d.getDate()
    const week = weekDays[d.getDay()]
    return month + '月' + day + '日 周' + week
  }
})
