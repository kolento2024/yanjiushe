// pages/student-list/student-list.js
Page({
  data: {
    searchName: '',
    searchDate: '',
    searchDateText: '全部日期',
    results: [],
    allStudents: [],
    loading: false,
    searched: false,
    cloudReady: true
  },

  onShow() {
    this.initDateFilter()
    this.fetchStudents()
  },

  // 初始化日期筛选（默认今天）
  initDateFilter() {
    const today = new Date()
    this.setData({
      searchDate: this.formatDate(today),
      searchDateText: '今天'
    })
  },

  // 从云数据库拉取学员
  fetchStudents() {
    this.setData({ loading: true })

    if (!wx.cloud) {
      this.setData({ loading: false, cloudReady: false })
      return
    }

    const db = wx.cloud.database()
    db.collection('students')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()
      .then(res => {
        const allStudents = res.data.map(item => ({
          ...item,
          // db.serverDate() 读回是对象，统一转成可读字符串
          createdAt: this.formatTime(item.createdAt)
        }))
        this.setData({
          allStudents,
          loading: false
        }, () => {
          this.onSearch()
        })
      })
      .catch(err => {
        console.error('查询学员失败:', err)
        // 降级：从本地加载
        const localStudents = wx.getStorageSync('students') || []
        this.setData({
          allStudents: localStudents,
          loading: false,
          cloudReady: false
        }, () => {
          this.onSearch()
        })
      })
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

  // 清除日期
  clearDate() {
    this.setData({ searchDate: '', searchDateText: '全部日期' })
  },

  // 清除姓名
  clearName() {
    this.setData({ searchName: '' })
  },

  // 执行搜索
  onSearch() {
    const { searchName, searchDate, allStudents } = this.data
    const keyword = searchName.trim().toLowerCase()

    let filtered = allStudents

    // 姓名模糊匹配
    if (keyword) {
      filtered = filtered.filter(item => {
        const name = (item.name || '').toLowerCase()
        return name.includes(keyword)
      })
    }

    // 日期筛选（按 createdAt 匹配日期部分，格式统一为 YYYY-MM-DD HH:mm:ss）
    if (searchDate) {
      filtered = filtered.filter(item => {
        const created = String(item.createdAt || '')
        return created.indexOf(searchDate) === 0
      })
    }

    this.setData({
      results: filtered,
      searched: true
    })
  },

  // 格式化日期 YYYY-MM-DD
  formatDate(d) {
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return y + '-' + m + '-' + day
  },

  // 将云数据库的 serverDate 对象或字符串转为可读时间
  formatTime(t) {
    if (!t) return ''
    if (typeof t === 'string') return t
    // serverDate 对象：{ $date: 1234567890000 } 或 Date 对象
    if (t && t.getTime) return this.formatDate(t) + ' ' + [t.getHours(), t.getMinutes(), t.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
    if (t && t.$date) {
      const d = new Date(t.$date)
      return this.formatDate(d) + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
    }
    return String(t)
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
