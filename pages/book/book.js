// pages/book/book.js
const { addLog } = require('../../utils/operations')
const { notifyShopOwner } = require('../../utils/notify')

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
    selectedTimes: [],
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
    this._firstLoad = true
    this.initDateList()
    this.generateTimeSlots()

    // 默认选中今天
    const todayStr = this.formatDate(new Date())
    this.setData({
      selectedDate: todayStr,
      dateText: '今天'
    })

    if (options.serviceId) {
      this.setData({
        selectedServiceId: Number(options.serviceId)
      })
    }

    // 检查登录状态 & 加载时段冲突
    this.checkLogin()
    this.checkTimeConflicts(todayStr)
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

  // 生成时段 9:00-11:00, 11:00-13:00, ..., 17:00-19:00（每段2小时）
  generateTimeSlots() {
    const slots = []
    for (let h = 9; h < 19; h += 2) {
      const start = h.toString().padStart(2, '0') + ':00'
      const end = (h + 2).toString().padStart(2, '0') + ':00'
      slots.push({
        value: start,
        label: start + ' - ' + end,
        disabled: false,
        selected: false
      })
    }
    this.setData({ timeSlots: slots })
  },

  // 选择日期
  selectDate(e) {
    const { date } = e.currentTarget.dataset
    const item = this.data.dateList.find(d => d.date === date)
    // 切换日期时清空已选时段
    const timeSlots = this.data.timeSlots.map(s => ({ ...s, selected: false }))
    this.setData({
      selectedDate: date,
      selectedTimes: [],
      dateText: item ? item.month + '月' + item.day + '日 周' + item.weekDay : date,
      timeSlots
    })
    // 检查该日期的时间冲突
    this.checkTimeConflicts(date)
  },

  // 选择时段（多选）
  selectTime(e) {
    const { time, disabled } = e.currentTarget.dataset
    if (disabled) return
    const selectedTimes = [...this.data.selectedTimes]
    const idx = selectedTimes.indexOf(time)
    if (idx > -1) {
      selectedTimes.splice(idx, 1)
    } else {
      selectedTimes.push(time)
    }
    selectedTimes.sort()
    // 直接修改 slot 的 selected 状态，避免 WXML 中逐个计算引发闪烁
    const timeSlots = this.data.timeSlots.map(s => ({
      ...s,
      selected: selectedTimes.indexOf(s.value) !== -1
    }))
    this.setData({ selectedTimes, timeSlots })
  },

  // 检查指定日期已被预约的时段，以及今天已过去的时间
  checkTimeConflicts(date) {
    // 重置 disabled 状态但保留 selected
    const slots = this.data.timeSlots.map(s => ({
      ...s,
      disabled: false,
      disabledReason: '',
      selected: this.data.selectedTimes.indexOf(s.value) !== -1
    }))
    this.setData({ timeSlots: slots })

    // 带超时的云查询
    const queryWithTimeout = (promise, ms = 8000) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('查询超时')), ms)
      )
      return Promise.race([promise, timeout])
    }

    const queryCloud = () => {
      if (!wx.cloud) {
        return Promise.reject(new Error('云开发未初始化'))
      }
      const db = wx.cloud.database()
      // 排除已取消的预约，避免取消后时段仍显示"已约"
      return queryWithTimeout(
        db.collection('bookings')
          .where({
            bookingDate: date,
            status: db.command.neq('cancelled')
          })
          .get()
          .then(res => res.data)
      )
    }

    queryCloud()
      .then(bookedList => {
        this.markDisabledSlots(bookedList, date)
      })
      .catch(() => {
        // 云端失败，兜底本地（同样过滤掉已取消的）
        const local = wx.getStorageSync('bookings') || []
        const bookedList = local.filter(b => b.bookingDate === date && b.status !== 'cancelled')
        this.markDisabledSlots(bookedList, date)
      })
  },

  // 标记已占用的时段（2小时段），同时禁用今天已过去的时间
  markDisabledSlots(bookedList, date) {
    // 收集所有已被预约的小时值
    const bookedHours = new Set()
    bookedList.forEach(b => {
      const bookingHour = parseInt(b.bookingTime.split(':')[0])
      // 旧1小时预约占用该小时，新2小时预约占用2个连续小时
      const endHour = b.bookingEndTime ? parseInt(b.bookingEndTime.split(':')[0]) : bookingHour + 1
      for (let i = bookingHour; i < endHour; i++) {
        bookedHours.add(i)
      }
    })

    const now = new Date()
    const todayStr = this.formatDate(now)
    const currentHour = now.getHours()

    const slots = this.data.timeSlots.map(s => {
      let disabled = false
      let disabledReason = ''
      const slotHour = parseInt(s.value.split(':')[0])

      // 检查2小时段内是否有冲突
      for (let i = slotHour; i < slotHour + 2; i++) {
        if (bookedHours.has(i)) {
          disabled = true
          disabledReason = '已约'
          break
        }
      }

      // 如果是今天且时段起始小时已过去
      if (!disabled && date === todayStr) {
        if (slotHour <= currentHour) {
          disabled = true
          disabledReason = '已过时'
        }
      }
      return { ...s, disabled, disabledReason, selected: this.data.selectedTimes.indexOf(s.value) !== -1 }
    })
    this.setData({ timeSlots: slots })
  },

  // 选择服务
  selectService(e) {
    const { id } = e.currentTarget.dataset
    const newId = this.data.selectedServiceId === id ? 0 : id
    if (newId === this.data.selectedServiceId) return
    this.setData({ selectedServiceId: newId })
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
    const { selectedServiceId, selectedDate, selectedTimes, name, phone } = this.data

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
    if (!selectedTimes || selectedTimes.length === 0) {
      wx.showToast({ title: '请选择时段', icon: 'none' })
      return
    }
    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请输入激活码', icon: 'none' })
      return
    }
    if (!/^\d{4}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入正确的4位尾号', icon: 'none' })
      return
    }

    const selectedService = this.data.services.find(s => s.id === selectedServiceId)
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    // 查询 students 表校验学员资格
    this.validateStudent(trimmedName, trimmedPhone, selectedService, (matchedStudent) => {
      this.doSubmitBooking(selectedService, matchedStudent)
    })
  },

  // 校验学员：姓名匹配 + 手机尾号匹配、已缴费、可预约
  validateStudent(name, code, selectedService, onSuccess) {
    wx.showLoading({ title: '验证中...', mask: true })

    const queryStudent = () => {
      if (!wx.cloud) return Promise.reject(new Error('云开发未初始化'))
      const db = wx.cloud.database()
      return db.collection('students')
        .where({ name: name })
        .get()
        .then(res => (Array.isArray(res.data) ? res.data : []))
    }

    queryStudent()
      .then(students => {
        wx.hideLoading()

        if (students.length === 0) {
          wx.showModal({
            title: '预约失败',
            content: '未找到您的学员信息，请先与客服沟通，缴费登记后方可预约',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }

        // 合并本地 storage 的最新状态（云端更新可能因权限失败，本地更实时）
        let localStudents = []
        try {
          localStudents = wx.getStorageSync('students') || []
        } catch (e) {}
        const localMap = {}
        localStudents.forEach(s => {
          if (s._id) localMap[s._id] = s
        })
        // 用本地状态覆盖云数据
        students = students.map(s => {
          const local = s._id ? localMap[s._id] : null
          if (local && local.bookingStatus) {
            s.bookingStatus = local.bookingStatus
          }
          return s
        })

        // 按手机尾号匹配
        const tailMatched = students.filter(s => s.phone && s.phone.endsWith(code))
        if (tailMatched.length === 0) {
          wx.showModal({
            title: '预约失败',
            content: '激活码验证不通过，请确认手机尾号后重试',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }

        // 检查是否有匹配服务项目的记录
        const matchedStudent = tailMatched.find(s => s.serviceId === selectedService.id)

        if (!matchedStudent) {
          wx.showModal({
            title: '预约失败',
            content: '您选择的套餐与已购套餐不符，请确认后重试，或联系客服处理',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }

        // 校验缴费状态
        if (matchedStudent.paymentStatus !== 'paid') {
          wx.showModal({
            title: '预约失败',
            content: '您尚未缴纳定金，请先缴费后再预约',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }

        // 校验预约状态
        if (matchedStudent.bookingStatus !== 'available') {
          const statusMap = {
            'unavailable': '当前暂不可预约',
            'booked': '您已预约过，无法重复预约'
          }
          const msg = statusMap[matchedStudent.bookingStatus] || '该学员暂不可预约'
          wx.showModal({
            title: '预约失败',
            content: msg + '，如有疑问请与客服沟通',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }

        // 校验通过，将匹配的学员信息传给后续流程
        onSuccess(matchedStudent)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('学员校验失败:', err)

        // 云开发未初始化——直接给出明确提示
        if (err && err.message === '云开发未初始化') {
          wx.showModal({
            title: '提示',
            content: '云开发环境未初始化，请在 app.js 中配置正确的环境 ID，或联系客服预约',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }

        // 云查询失败，降级到本地缓存
        this.localFallbackCheck(name, code, selectedService, onSuccess)
      })
  },

  // 本地降级：当云数据库不可用时，用本地 storage 的 students 缓存校验
  localFallbackCheck(name, code, selectedService, onSuccess) {
    try {
      const localStudents = wx.getStorageSync('students') || []
      const matched = localStudents.filter(
        s => s.name === name && s.phone && s.phone.endsWith(code)
      )
      if (matched.length === 0) {
        wx.showModal({
          title: '提示',
          content: '网络异常，无法验证学员信息，请稍后重试',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      const matchService = matched.find(s => s.serviceId === selectedService.id)
      if (!matchService) {
        wx.showModal({
          title: '预约失败',
          content: '您选择的套餐与已购套餐不符',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      if (matchService.paymentStatus !== 'paid') {
        wx.showModal({
          title: '预约失败',
          content: '您尚未缴纳定金，请先缴费后再预约',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      if (matchService.bookingStatus !== 'available') {
        wx.showModal({
          title: '预约失败',
          content: '该学员暂不可预约，请与客服沟通',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      onSuccess(matchService)
    } catch (e) {
      wx.showToast({ title: '验证失败，请重试', icon: 'none' })
    }
  },

  // 执行实际预约提交
  doSubmitBooking(selectedService, matchedStudent) {
    const { selectedDate, selectedTimes, name, phone, remark } = this.data
    const userInfo = wx.getStorageSync('userInfo') || {}
    const studentPhone = matchedStudent.phone || ''

    // 为每个所选时段生成预约数据
    const bookingList = selectedTimes.map(t => {
      const startHour = parseInt(t.split(':')[0])
      const endTime = (startHour + 2).toString().padStart(2, '0') + ':00'
      return {
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceId: selectedService.id,
        bookingDate: selectedDate,
        bookingTime: t,
        bookingEndTime: endTime,
        dateText: this.data.dateText,
        name: name.trim(),
        phone: phone.trim(),
        studentPhone: studentPhone,
        studentId: matchedStudent._id || '',
        userNickName: userInfo.nickName || '',
        remark: remark.trim(),
        status: 'confirmed',
        createTime: new Date().toISOString()
      }
    })

    this.setData({ submitting: true })

    // 逐个保存
    this.saveBookings(bookingList, 0, selectedService, matchedStudent)
  },

  // 批量保存预约
  saveBookings(bookingList, index, selectedService, matchedStudent) {
    if (index >= bookingList.length) {
      // 全部保存完成 → 通知店长 + 更新学员状态
      notifyShopOwner('new_booking', bookingList[0])
      this.updateStudentBookingStatus(matchedStudent, 'booked')

      const timesText = bookingList.map(b => b.bookingTime).join('、')
      this.setData({
        submitting: false,
        showSuccess: true,
        bookingResult: {
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          date: this.data.dateText,
          time: timesText,
          name: bookingList[0].name,
          phone: bookingList[0].phone
        }
      })
      return
    }

    const bookingData = bookingList[index]
    const saveNext = () => this.saveBookings(bookingList, index + 1, selectedService, matchedStudent)

    const queryWithTimeout = (promise, ms = 10000) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('写入超时')), ms)
      )
      return Promise.race([promise, timeout])
    }

    const saveToCloud = () => {
      if (!wx.cloud) return Promise.reject(new Error('云开发未初始化'))
      const db = wx.cloud.database()
      return queryWithTimeout(
        db.collection('bookings').add({
          data: { ...bookingData, createTime: db.serverDate() }
        })
      )
    }

    saveToCloud()
      .then(() => {
        // 记录日志
        const userInfo = wx.getStorageSync('userInfo') || {}
        addLog('book', {
          nickName: userInfo.nickName || bookingData.name,
          serviceName: selectedService.name,
          bookingDate: bookingData.bookingDate,
          bookingTime: bookingData.bookingTime,
          time: new Date().toLocaleString('zh-CN', { hour12: false })
        })
        saveNext()
      })
      .catch(() => {
        // 云端失败，存本地
        try {
          const localData = wx.getStorageSync('bookings') || []
          localData.push(bookingData)
          wx.setStorageSync('bookings', localData)
        } catch (e) {}

        // 本地降级也要记录日志
        const userInfo = wx.getStorageSync('userInfo') || {}
        addLog('book', {
          nickName: userInfo.nickName || bookingData.name,
          serviceName: selectedService.name,
          bookingDate: bookingData.bookingDate,
          bookingTime: bookingData.bookingTime,
          time: new Date().toLocaleString('zh-CN', { hour12: false })
        })

        saveNext()
      })
  },

  // 更新学员预约状态（先本地保证生效，再云更新尽力而为）
  updateStudentBookingStatus(matchedStudent, status) {
    if (!matchedStudent) return

    // 1. 先同步更新本地 storage（保证下次验证能读到）
    try {
      const localStudents = wx.getStorageSync('students') || []
      let updated = false
      for (let i = 0; i < localStudents.length; i++) {
        if (
          (matchedStudent._id && localStudents[i]._id === matchedStudent._id) ||
          (localStudents[i].name === matchedStudent.name && localStudents[i].serviceId === matchedStudent.serviceId)
        ) {
          localStudents[i].bookingStatus = status
          updated = true
          break
        }
      }
      // 如果本地没找到，追加进去
      if (!updated && matchedStudent._id) {
        matchedStudent.bookingStatus = status
        localStudents.push(matchedStudent)
      }
      wx.setStorageSync('students', localStudents)
      console.log('[学员状态] 本地已更新为', status)
    } catch (e) {
      console.error('[学员状态] 本地更新失败:', e)
    }

    // 2. 再尝试云数据库更新
    if (!wx.cloud || !matchedStudent._id) return
    const db = wx.cloud.database()
    db.collection('students').doc(matchedStudent._id).update({
      data: { bookingStatus: status }
    }).then(() => {
      console.log('[学员状态] 云端已更新为', status)
    }).catch(err => {
      console.error('[学员状态] 云端更新失败(可能因权限不足):', err)
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
      selectedDate: this.formatDate(new Date()),
      selectedTimes: [],
      dateText: '今天',
      name: '',
      phone: '',
      remark: ''
    })
    this.generateTimeSlots()
    this.checkTimeConflicts(this.formatDate(new Date()))
  }
})
