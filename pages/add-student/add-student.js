// pages/add-student/add-student.js
const { addLog } = require('../../utils/operations')

Page({
  data: {
    // 服务列表（与预约页保持一致）
    services: [
      // ===== 开放课程 =====
      { id: 1, name: '【4节课】一对一化妆私教课', price: 980 },
      { id: 7, name: '【6节课】一对一化妆提升私教课', price: 1280 },
      { id: 5, name: '【1v1化妆私教】化妆体验课-2h', price: 158 },
      // ===== 暂时隐藏的课程 =====
      // { id: 2, name: '【主题妆】主持人妆+舞台妆+晚宴妆+应援妆+空乘妆', price: 228 },
      // { id: 3, name: '【新客大促】伪素颜+艺考妆+白开水+裸妆+淡妆', price: 188 },
      // { id: 4, name: '【人气爆款】精致韩妆+网感妆+上镜妆+千金妆', price: 198 },
      // { id: 6, name: '【人气首选】韩系妆+日系妆+水光妆+纯欲妆+雷系妆', price: 188 },
      // { id: 8, name: '【top风格妆】亚裔妆+清泰妆+古早烟熏+千禧辣妹', price: 258 }
    ],
    selectedServiceId: 0,
    selectedServiceName: '',

    // 缴费状态
    paymentStatusList: [
      { value: 'paid', label: '已缴定金' },
      { value: 'unpaid', label: '未缴定金' }
    ],
    paymentStatus: '',
    paymentStatusIndex: -1,

    // 预约状态
    bookingStatusList: [
      { value: 'available', label: '可预约', tip: '允许学员预约' },
      { value: 'unavailable', label: '不可预约', tip: '禁止学员预约' },
      { value: 'booked', label: '已预约', tip: '已完成预约' }
    ],
    bookingStatus: '',
    bookingStatusIndex: -1,

    // 表单字段
    name: '',
    phone: '',
    remark: '',

    // 提交状态
    submitting: false
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 选择服务
  onServiceSelect(e) {
    const { id, name } = e.currentTarget.dataset
    if (this.data.selectedServiceId === id) return
    this.setData({
      selectedServiceId: id,
      selectedServiceName: name
    })
  },

  // 选择缴费状态
  onPaymentSelect(e) {
    const { value } = e.currentTarget.dataset
    if (this.data.paymentStatus === value) return
    const idx = this.data.paymentStatusList.findIndex(s => s.value === value)
    this.setData({
      paymentStatus: value,
      paymentStatusIndex: idx
    })
  },

  // 选择预约状态
  onBookingSelect(e) {
    const { value } = e.currentTarget.dataset
    if (this.data.bookingStatus === value) return
    const idx = this.data.bookingStatusList.findIndex(s => s.value === value)
    this.setData({
      bookingStatus: value,
      bookingStatusIndex: idx
    })
  },

  // 提交表单
  onSubmit() {
    const { name, phone, selectedServiceId, selectedServiceName,
            paymentStatus, bookingStatus, remark } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请输入学员名称', icon: 'none' })
      return
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请输入激活码', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!selectedServiceId) {
      wx.showToast({ title: '请选择预约项目', icon: 'none' })
      return
    }
    if (!paymentStatus) {
      wx.showToast({ title: '请选择缴费状态', icon: 'none' })
      return
    }
    if (!bookingStatus) {
      wx.showToast({ title: '请选择预约状态', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const studentData = {
      name: name.trim(),
      phone: phone.trim(),
      serviceId: selectedServiceId,
      serviceName: selectedServiceName,
      paymentStatus,
      bookingStatus,
      remark: remark.trim(),
      createdAt: new Date().toISOString()
    }

    this.saveStudent(studentData)
  },

  // 保存学员信息
  saveStudent(studentData) {
    if (wx.cloud) {
      const db = wx.cloud.database()
      db.collection('students').add({
        data: {
          ...studentData,
          createdAt: db.serverDate()
        }
      }).then(() => {
        this.onSaveSuccess()
        // 记录操作日志
        addLog('add_student', {
          studentName: studentData.name,
          serviceName: studentData.serviceName,
          time: new Date().toLocaleString('zh-CN', { hour12: false })
        })
      }).catch(() => {
        this.saveLocal(studentData)
      })
    } else {
      this.saveLocal(studentData)
    }
  },

  // 本地保存（降级方案）
  saveLocal(studentData) {
    try {
      const localStudents = wx.getStorageSync('students') || []
      localStudents.push({ ...studentData, _id: 'local_' + Date.now() })
      wx.setStorageSync('students', localStudents)
      this.onSaveSuccess()
      // 本地降级也要记录日志
      addLog('add_student', {
        studentName: studentData.name,
        serviceName: studentData.serviceName,
        time: new Date().toLocaleString('zh-CN', { hour12: false })
      })
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  // 保存成功
  onSaveSuccess() {
    this.setData({ submitting: false })
    wx.showToast({ title: '添加成功', icon: 'success' })
    // 延迟重置表单
    setTimeout(() => {
      this.setData({
        name: '',
        phone: '',
        selectedServiceId: 0,
        selectedServiceName: '',
        paymentStatus: '',
        paymentStatusIndex: -1,
        bookingStatus: '',
        bookingStatusIndex: -1,
        remark: ''
      })
    }, 1200)
  }
})
