// pages/book/book.js
const { addLog } = require('../../utils/operations')

Page({
  data: {
    // 服务列表
    services: [
      {
        id: 1,
        name: '【4节课】一对一化妆私教课',
        icon: '/images/common/item1.png',
        desc: '化妆私教课基础课程，实现美丽不求人',
        price: 980,
        time: '约120分钟'
      },
      {
        id: 2,
        name: '【主题妆】主持人妆+舞台妆+晚宴妆+应援妆+空乘妆',
        icon: '/images/common/item2.png',
        desc: '包含（妆+发），一生一次的重要时刻，精致不将就',
        price: 228,
        time: '约90分钟'
      },
      {
        id: 3,
        name: '【新客大促】伪素颜+艺考妆+白开水+裸妆+淡妆',
        icon: '/images/common/item3.png',
        desc: '新客超优惠，包含（妆+发）',
        price: 188,
        time: '约90分钟'
      },
      {
        id: 4,
        name: '【人气爆款】精致韩妆+网感妆+上镜妆+千金妆',
        icon: '/images/common/item4.png',
        desc: '包含（妆+发）',
        price: 198,
        time: '约90分钟'
      },
      {
        id: 5,
        name: '【1v1化妆私教】化妆体验课-2h',
        icon: '/images/common/item5.png',
        desc: '体验课程',
        price: 158,
        time: '约120分钟'
      },
      {
        id: 6,
        name: '【人气首选】韩系妆+日系妆+水光妆+纯欲妆+雷系妆',
        icon: '/images/common/item6.png',
        desc: '多种人气妆容任你选',
        price: 188,
        time: '约90分钟'
      },
      {
        id: 7,
        name: '【6节课】一对一化妆提升私教课',
        icon: '/images/common/item1.png',
        desc: '私教提升课，进一步提升您的化妆技巧',
        price: 1280,
        time: '约120分钟'
      },
      {
        id: 8,
        name: '【top风格妆】亚裔妆+清泰妆+古早烟熏+千禧辣妹',
        icon: '/images/common/item7.png',
        desc: '多种人气妆容任你选',
        price: 258,
        time: '约90分钟'
      }
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

    // 日期选择器
    pickerDate: '',
    pickerDateText: '选择日期',

    // 时段
    timeSlots: [],

    // 提交状态
    submitting: false,
    showSuccess: false,
    bookingResult: {}
  },

  onLoad(options) {
    this._firstLoad = true
    this.initDateList()
    this.initPicker()
    this.generateTimeSlots()

    if (options.serviceId) {
      this.setData({
        selectedServiceId: Number(options.serviceId)
      })
    }

    // 检查登录状态
    this.checkLogin()
  },

  onShow() {
    // 首次加载时 onLoad 已处理，避免重复弹窗
    if (this._firstLoad) {
      this._firstLoad = false
      return
    }
    // 从其他页面返回时重新检查登录（可能从我的页面登录后返回）
    this.checkLogin()
  },

  // 检查是否已登录（已设置昵称）
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo.nickName) {
      wx.showModal({
        title: '请先登录',
        content: '预约前需要先设置您的微信昵称，点击确认前往设置',
        showCancel: false,
        confirmText: '去设置',
        success: () => {
          wx.switchTab({ url: '/pages/my/my' })
        }
      })
    }
  },

  // 初始化日期选择器
  initPicker() {
    const today = new Date()
    this.setData({
      pickerDate: this.formatDate(today),
      pickerDateText: '今天'
    })
  },

  // 日期选择器变化
  onPickerDateChange(e) {
    const dateStr = e.detail.value
    const d = new Date(dateStr.replace(/-/g, '/'))
    const month = d.getMonth() + 1
    const day = d.getDate()
    const week = this.data.weekDays[d.getDay()]
    const label = month + '月' + day + '日 周' + week

    const todayStr = this.formatDate(new Date())
    this.setData({
      pickerDate: dateStr,
      pickerDateText: dateStr === todayStr ? '今天' : label
    })

    // 自动选中日期
    this.setData({
      selectedDate: dateStr,
      selectedTime: '',
      dateText: label
    })
    this.checkTimeConflicts(dateStr)
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

  // 生成时段 9:00-18:00（最晚 18:00-19:00）
  generateTimeSlots() {
    const slots = []
    for (let h = 9; h < 19; h++) {
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
      selectedTime: '',
      dateText: item ? item.month + '月' + item.day + '日 周' + item.weekDay : date
    })
    // 检查该日期的时间冲突
    this.checkTimeConflicts(date)
  },

  // 选择时段
  selectTime(e) {
    const { time, disabled } = e.currentTarget.dataset
    if (disabled) return
    this.setData({ selectedTime: time })
  },

  // 检查指定日期已被预约的时段，以及今天已过去的时间
  checkTimeConflicts(date) {
    // 先重置所有时段
    const slots = this.data.timeSlots.map(s => ({ ...s, disabled: false }))
    this.setData({ timeSlots: slots })

    // 尝试从云端查询
    const queryCloud = () => {
      return new Promise((resolve, reject) => {
        if (!wx.cloud) {
          reject(new Error('云开发未初始化'))
          return
        }
        const db = wx.cloud.database()
        db.collection('bookings')
          .where({ bookingDate: date })
          .get()
          .then(res => resolve(res.data))
          .catch(reject)
      })
    }

    queryCloud()
      .then(bookedList => {
        this.markDisabledSlots(bookedList, date)
      })
      .catch(() => {
        // 云端失败，兜底本地
        const local = wx.getStorageSync('bookings') || []
        const bookedList = local.filter(b => b.bookingDate === date)
        this.markDisabledSlots(bookedList, date)
      })
  },

  // 标记已占用的时段，同时禁用今天已过去的时间
  markDisabledSlots(bookedList, date) {
    const bookedTimes = bookedList.map(b => b.bookingTime)
    const now = new Date()
    const todayStr = this.formatDate(now)
    const currentHour = now.getHours()

    const slots = this.data.timeSlots.map(s => {
      let disabled = false
      let disabledReason = ''
      // 已被他人预约
      if (bookedTimes.includes(s.value)) {
        disabled = true
        disabledReason = '已约'
      }
      // 如果是今天且时段已过当前小时
      if (!disabled && date === todayStr) {
        const slotHour = parseInt(s.value.split(':')[0])
        if (slotHour <= currentHour) {
          disabled = true
          disabledReason = '已过时'
        }
      }
      return { ...s, disabled, disabledReason }
    })
    this.setData({ timeSlots: slots })
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

    // 获取当前登录用户昵称
    const userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo.nickName) {
      wx.showModal({
        title: '提示',
        content: '请先在我的页面中登录',
        showCancel: false,
        confirmText: '去登录',
        success: () => {
          wx.switchTab({ url: '/pages/my/my' })
        }
      })
      return
    }

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
      userNickName: userInfo.nickName || '',
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
    // 记录操作日志
    const userInfo = wx.getStorageSync('userInfo') || {}
    addLog('book', {
      nickName: userInfo.nickName || bookingData.name,
      serviceName: selectedService.name,
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime,
      time: bookingData.createTime ? new Date(bookingData.createTime).toLocaleString('zh-CN', { hour12: false }) : new Date().toLocaleString('zh-CN', { hour12: false })
    })

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
