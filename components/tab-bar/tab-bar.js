Component({
  properties: {
    current: {
      type: String,
      value: 'index'
    }
  },

  data: {
    tabs: [
      { key: 'index', icon: '🏠', label: '首页' },
      { key: 'book', icon: '📅', label: '预约' },
      { key: 'my', icon: '👤', label: '我的' }
    ]
  },

  methods: {
    switchTab(e) {
      const { key } = e.currentTarget.dataset
      if (key === this.data.current) return

      const urlMap = {
        index: '/pages/index/index',
        book: '/pages/book/book',
        my: '/pages/my/my'
      }

      wx.reLaunch({ url: urlMap[key] })
    }
  }
})
