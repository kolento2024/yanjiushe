// pages/log/log.js
const { getLogs, clearLogs } = require('../../utils/operations')

Page({
  data: {
    logs: [],           // 全部日志
    filteredLogs: [],   // 按日期筛选后的日志
    filterDate: '',
    filterDateText: '全部日期',
    isEmpty: false,
    loading: true,
    typeLabels: {
      'book': '预约',
      'cancel_by_user': '取消预约',
      'cancel_by_owner': '店长取消',
      'add_student': '添加学员'
    },
    typeColors: {
      'book': '#D48B8B',
      'cancel_by_user': '#999',
      'cancel_by_owner': '#C9A96E',
      'add_student': '#6BBFA0'
    }
  },

  onShow() {
    this.initFilterDate()
    this.loadLogs()
  },

  // 初始化日期筛选（默认今天）
  initFilterDate() {
    const today = new Date()
    const y = today.getFullYear()
    const m = (today.getMonth() + 1).toString().padStart(2, '0')
    const d = today.getDate().toString().padStart(2, '0')
    const dateStr = y + '-' + m + '-' + d
    this.setData({
      filterDate: dateStr,
      filterDateText: '今天'
    })
  },

  // 日期筛选变化
  onFilterDateChange(e) {
    const dateStr = e.detail.value
    if (!dateStr) {
      this.setData({ filterDate: '', filterDateText: '全部日期' })
    } else {
      const d = new Date(dateStr.replace(/-/g, '/'))
      const weekDays = ['日', '一', '二', '三', '四', '五', '六']
      const month = d.getMonth() + 1
      const day = d.getDate()
      const week = weekDays[d.getDay()]
      this.setData({
        filterDate: dateStr,
        filterDateText: month + '月' + day + '日 周' + week
      })
    }
    this.applyFilter()
  },

  // 快速切回今天
  onFilterToday() {
    this.initFilterDate()
    this.applyFilter()
  },

  // 清除日期筛选
  onClearFilter() {
    this.setData({
      filterDate: '',
      filterDateText: '全部日期'
    })
    this.applyFilter()
  },

  // 按日期筛选
  applyFilter() {
    const { logs, filterDate } = this.data
    if (!filterDate) {
      this.setData({ filteredLogs: logs, isEmpty: logs.length === 0 })
      return
    }
    console.log('[log筛选] filterDate:', filterDate, '总日志数:', logs.length)
    // 提取并归一化日期：兼容 "2026/5/28", "2026-05-28", "2026-5-28" 等格式
    const filterParts = filterDate.split('-')
    const filtered = logs.filter(item => {
      const raw = (item.time || '').replace(/\//g, '-')
      // 取空格前的日期部分，按 - 分割后补齐前导零再比对
      const dateStr = raw.split(' ')[0]
      const parts = dateStr.split('-')
      const y = parts[0] || ''
      const m = (parts[1] || '').padStart(2, '0')
      const d = (parts[2] || '').padStart(2, '0')
      const match = y === filterParts[0] && m === filterParts[1] && d === filterParts[2]
      console.log('[log筛选]', dateStr, '->', `${y}-${m}-${d}`, 'vs', filterDate, match ? '✓' : '✗')
      return match
    })
    console.log('[log筛选] 匹配数:', filtered.length)
    this.setData({
      filteredLogs: filtered,
      isEmpty: filtered.length === 0
    })
  },

  async loadLogs() {
    try {
      const logs = await getLogs()
      this.setData({ logs, loading: false })
      this.applyFilter()
    } catch (e) {
      console.error('加载日志失败', e)
      this.setData({ loading: false })
    }
  },

  async onClear() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有操作日志吗？此操作不可恢复',
      confirmColor: '#D48B8B',
      success: async (res) => {
        if (res.confirm) {
          try {
            await clearLogs()
            this.setData({ logs: [], filteredLogs: [], isEmpty: true })
            wx.showToast({ title: '已清空', icon: 'success' })
          } catch (e) {
            wx.showToast({ title: '清空失败', icon: 'none' })
          }
        }
      }
    })
  }
})
