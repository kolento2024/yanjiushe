// pages/book/book.js
Page({
  data: {
    // 服务列表
    services: [
      { id: 1, name: '日常妆容', price: 198, time: '约60分钟' },
      { id: 2, name: '新娘妆', price: 888, time: '约120分钟' },
      { id: 3, name: '舞台妆', price: 368, time: '约90分钟' },
      { id: 4, name: '晚宴妆', price: 398, time: '约80分钟' },
      { id: 5, name: '男士妆', price: 168, time: '约45分钟' },
      { id: 6, name: '试妆体验', price: 99, time: '约40分钟' }
    ],

    // 选中状态
    selectedServiceId: 0,
    selectedDate: '',
    selectedTime: '',
    dateText: '',
    name: '',
    phone: '',
    remark: '',

    // 日期相关
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    dateList: [],

    // 时段
    timeSlots: [],

    // 提交状态
    submitting: false,
    showSuccess: false,
    bookingResult: {}
  },

  onLoad(options) {
    this.initDateList()
    this.generateTimeSlots()

    // 如果从首页选了服务跳转过来
    if (options.serviceId) {
      this.setData({
        selectedServiceId: Number(options.serviceId)
      })
    }
  },

  // 生成未来约3个月（90天）日期
  initDateList() {
    const today = new Date()
    const dateList = []
    const todayStr = this.formatDate(today)
    let lastMonth = -1

    for (let i = 0; i < 90; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const month = d.getMonth() + 1
      const day = d.getDate()
      const weekDay = this.data.weekDays[d.getDay()]
      const isNewMonth = month !== lastMonth
      lastMonth = month

      dateList.push({
        date: this.formatDate(d),
        month: month,
        day: day < 10 ? '0' + day : '' + day,
        weekDay: weekDay,
        isToday: this.formatDate(d) === todayStr,
        isNewMonth: isNewMonth,
        monthLabel: isNewMonth ? month + '月' : ''
      })
    }
    this.setData({ dateList })
  },

  // 格式化日期 YYYY-MM-DD
  formatDate(d) {
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return y + '-' + m + '-' + day
  },

  // 生成时段 9:00-21:00
  generateTimeSlots() {
    const slots = []
    for (let h = 9; h < 21; h++) {
      const start = h.toString().padStart(2, '0') + ':00'
      const end = (h + 1).toString().padStart(2, '0') + ':00'
      slots.push({
        value: start,
        label: start + ' - ' + end,
        disabled: false
      })
    }
    this.setData({ timeSlots: slots })
  },

  // 选择日期
  selectDate(e) {
    const { date } = e.currentTarget.dataset
    const item = this.data.dateList.find(d => d.date === date)
    this.setData({
      selectedDate: date,
      dateText: item ? item.month + '月' + item.day + '日 周' + item.weekDay : date
    })
  },

  // 选择时段
  selectTime(e) {
    const { time } = e.currentTarget.dataset
    this.setData({ selectedTime: time })
  },

  // 选择服务
  selectService(e) {
    const { id } = e.currentTarget.dataset
    this.setData({
      selectedServiceId: this.data.selectedServiceId === id ? 0 : id
    })
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  // 输入电话
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 提交预约
  submitBooking() {
    const { selectedServiceId, selectedDate, selectedTime, name, phone, remark } = this.data

    // 校验
    if (!selectedServiceId) {
      wx.showToast({ title: '请选择化妆项目', icon: 'none' })
      return
    }
    if (!selectedDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }
    if (!selectedTime) {
      wx.showToast({ title: '请选择时段', icon: 'none' })
      return
    }
    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请输入电话', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    const selectedService = this.data.services.find(s => s.id === selectedServiceId)
    const endHour = parseInt(selectedTime.split(':')[0]) + 1
    const endTime = endHour.toString().padStart(2, '0') + ':00'

    const bookingData = {
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceId: selectedServiceId,
      bookingDate: selectedDate,
      bookingTime: selectedTime,
      bookingEndTime: endTime,
      dateText: this.data.dateText,
      name: name.trim(),
      phone: phone.trim(),
      remark: remark.trim(),
      status: 'confirmed',
      createTime: new Date().toISOString()
    }

    this.setData({ submitting: true })

    // 尝试写入云数据库，失败则写本地
    this.saveBooking(bookingData, selectedService)
  },

  // 保存预约（云开发 + 本地兜底）
  saveBooking(bookingData, selectedService) {
    const saveToCloud = () => {
      return new Promise((resolve, reject) => {
        if (!wx.cloud) {
          reject(new Error('云开发未初始化'))
          return
        }
        const db = wx.cloud.database()
        db.collection('bookings').add({
          data: {
            ...bookingData,
            createTime: db.serverDate()
          }
        }).then(resolve).catch(reject)
      })
    }

    // 先尝试云端，失败则存本地
    saveToCloud()
      .then(() => {
        this.onSaveSuccess(bookingData, selectedService)
      })
      .catch(() => {
        // 云开发失败，存本地
        try {
          const localData = wx.getStorageSync('bookings') || []
          localData.push(bookingData)
          wx.setStorageSync('bookings', localData)
        } catch (e) {}
        this.onSaveSuccess(bookingData, selectedService)
      })
  },

  onSaveSuccess(bookingData, selectedService) {
    this.setData({
      submitting: false,
      showSuccess: true,
      bookingResult: {
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: this.data.dateText,
        time: bookingData.bookingTime,
        name: bookingData.name,
        phone: bookingData.phone
      }
    })
  },

  // 返回首页
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  // 再来一单
  bookAgain() {
    this.setData({
      showSuccess: false,
      selectedServiceId: 0,
      selectedDate: '',
      selectedTime: '',
      dateText: '',
      name: '',
      phone: '',
      remark: ''
    })
  }
})
