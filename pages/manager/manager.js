// pages/manager/manager.js
Page({
  data: {
    cloudReady: false,
    // 预约信息统计数据
    bookingStats: {
      today: 0,
      tomorrow: 0,
      thisWeek: 0,
      totalActive: 0
    },
    // 功能模块
    modules: [
      {
        key: 'roster',
        icon: '📅',
        title: '排班表',
        desc: '查看和管理全部学员预约',
        bgStart: '#FDF0F0',
        bgEnd: '#FDF8F5',
        accent: '#D48B8B'
      },
      {
        key: 'studentList',
        icon: '🎓',
        title: '学员列表',
        desc: '店长手动录入的已交费学员',
        bgStart: '#F0F5FF',
        bgEnd: '#F5F7FA',
        accent: '#8BA4D4'
      },
      {
        key: 'addStudent',
        icon: '➕',
        title: '添加学员',
        desc: '录入已缴费学员信息',
        bgStart: '#F0F5F0',
        bgEnd: '#F8FAF7',
        accent: '#6BBFA0'
      },
      {
        key: 'log',
        icon: '📝',
        title: '操作日志',
        desc: '预约与取消的操作记录',
        bgStart: '#F5F4F0',
        bgEnd: '#FAF9F7',
        accent: '#C9A96E'
      }
    ]
  },

  onLoad() {
    this._loaded = true
  },

  onShow() {
    this.fetchBookingStats()
  },

  // 获取预约统计数据
  fetchBookingStats() {
    if (!wx.cloud) {
      this.setData({ cloudReady: false })
      return
    }

    const db = wx.cloud.database()
    const today = this.formatDate(new Date())
    const tomorrow = this.formatDate(new Date(Date.now() + 86400000))
    const weekEnd = this.formatDate(new Date(Date.now() + 6 * 86400000))

    db.collection('bookings')
      .where({
        status: db.command.neq('cancelled'),
        bookingDate: db.command.gte(today)
      })
      .orderBy('bookingDate', 'asc')
      .orderBy('bookingTime', 'asc')
      .limit(200)
      .get()
      .then(res => {
        const bookings = res.data
        let todayCount = 0
        let tomorrowCount = 0
        let thisWeekCount = 0

        bookings.forEach(item => {
          if (item.bookingDate === today) todayCount++
          if (item.bookingDate === tomorrow) tomorrowCount++
          // 本周预约：从今天起（含今天和明天）到本周结束
          if (item.bookingDate >= today && item.bookingDate <= weekEnd) thisWeekCount++
        })

        // 待排预约：今天起排除已取消的所有预约
        const totalActive = bookings.length

        console.log('=== 预约统计 ===')
        console.log('查询范围:', today, '~ 不限')
        console.log('总数:', totalActive, '| 今天:', todayCount, '| 明天:', tomorrowCount, '| 本周:', thisWeekCount)
        console.log('本周截止:', weekEnd)
        console.log('数据明细:', bookings.map(b => b.bookingDate + ' ' + b.bookingTime + ' ' + b.name + ' ' + b.status))

        this.setData({
          cloudReady: true,
          bookingStats: {
            today: todayCount,
            tomorrow: tomorrowCount,
            thisWeek: thisWeekCount,
            totalActive: totalActive
          }
        })
      })
      .catch(err => {
        console.error('获取预约统计失败:', err)
        this.setData({ cloudReady: false })
      })
  },

  formatDate(d) {
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return y + '-' + m + '-' + day
  },

  // 点击功能模块
  onModuleTap(e) {
    const { key } = e.currentTarget.dataset
    const urlMap = {
      roster: '/pages/roster/roster',
      studentList: '/pages/student-list/student-list',
      addStudent: '/pages/add-student/add-student',
      log: '/pages/log/log'
    }
    wx.navigateTo({ url: urlMap[key] })
  },

  // 查看全部预约 → 跳转到预约信息查询页面
  goBookingSearch() {
    wx.navigateTo({ url: '/pages/booking-search/booking-search' })
  },
})
