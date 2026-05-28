// pages/schedule/schedule.js
const { addLog } = require('../../utils/operations')
const { notifyShopOwner } = require('../../utils/notify')

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
    let query = db.collection('bookings')
    if (currentNickName) {
      query = query.where({ userNickName: currentNickName })
    }
    query = query.orderBy('bookingDate', 'asc')
      .orderBy('bookingTime', 'asc')
      .limit(200)

    return query.get()
      .then(res => {
        let bookings = res.data
          .filter(item => item.status !== 'cancelled')
          .map(item => ({
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
        items: grouped[date].map(item => ({
          ...item,
          canCancel: this.canCancelBooking(item.bookingDate)
        }))
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

  // 判断预约是否还能取消（需在预约日前一天20:00之前）
  canCancelBooking(bookingDate) {
    if (!bookingDate) return false
    const now = new Date()
    const booking = new Date(bookingDate.replace(/-/g, '/'))
    // 截止时间：预约日期前一天的 20:00
    const cutoff = new Date(booking.getTime() - 86400000)
    cutoff.setHours(20, 0, 0, 0)
    return now < cutoff
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

    // 检查是否超过取消时限
    if (!this.canCancelBooking(booking.bookingDate)) {
      const dayBefore = this.formatDateLabel(new Date(
        new Date(booking.bookingDate.replace(/-/g, '/')).getTime() - 86400000
      ))
      wx.showModal({
        title: '无法取消',
        content: '取消预约需在' + dayBefore + ' 20:00前操作，已超时无法取消',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

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

    // 通知店长
    notifyShopOwner('cancel_booking', {
      serviceName: booking.serviceName,
      dateText: booking.dateText || booking.bookingDate,
      bookingTime: booking.bookingTime,
      name: booking.name || userInfo.nickName,
      phone: booking.phone || '',
      cancelBy: userInfo.nickName || '客户'
    })

    // 恢复学员预约状态
    this.resetStudentStatus(booking)

    // 刷新列表
    this.fetchBookings()
    wx.showToast({ title: '已取消', icon: 'success' })
  },

  // 取消预约后恢复学员状态为可预约
  resetStudentStatus(booking) {
    // 优先用 studentId，兜底用 name + serviceId
    const findCondition = booking.studentId
      ? { _id: booking.studentId }
      : { name: booking.name, serviceId: booking.serviceId }

    const updateStudent = (student) => {
      // 1. 先本地更新（保证生效）
      try {
        const localStudents = wx.getStorageSync('students') || []
        const idx = localStudents.findIndex(s =>
          (student._id && s._id === student._id) ||
          (s.name === (booking.name || student.name) && s.serviceId === (booking.serviceId || student.serviceId))
        )
        if (idx >= 0) {
          localStudents[idx].bookingStatus = 'available'
          wx.setStorageSync('students', localStudents)
          console.log('[学员状态] 本地已恢复为 available')
        }
      } catch (e) {}

      // 2. 再云更新
      if (wx.cloud && student._id) {
        const db = wx.cloud.database()
        db.collection('students').doc(student._id).update({
          data: { bookingStatus: 'available' }
        }).catch(err => {
          console.error('[学员状态] 云端恢复失败:', err)
        })
      }
    }

    const queryCloud = () => {
      if (!wx.cloud) return Promise.reject(new Error('云开发未初始化'))
      const db = wx.cloud.database()
      return db.collection('students')
        .where(findCondition)
        .get()
        .then(res => res.data)
    }

    queryCloud()
      .then(students => {
        if (students.length > 0) {
          updateStudent(students[0])
        }
      })
      .catch(() => {
        // 本地降级
        try {
          const local = wx.getStorageSync('students') || []
          const matched = local.filter(s => {
            if (booking.studentId) return s._id === booking.studentId
            return s.name === booking.name && s.serviceId === booking.serviceId
          })
          if (matched.length > 0) {
            updateStudent(matched[0])
          }
        } catch (e) {}
      })
  },

  onPullDownRefresh() {
    this.fetchBookings().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
