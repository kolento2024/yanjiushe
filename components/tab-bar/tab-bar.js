Component({
  properties: {
    current: {
      type: String,
      value: 'index'
    },
    // 角色触发计数器，由 page 递增来通知组件刷新
    roleTrigger: {
      type: Number,
      value: 0
    }
  },

  observers: {
    'roleTrigger': function(val) {
      if (val > 0) {
        this.updateTabs()
      }
    }
  },

  data: {
    allTabs: [
      { key: 'index', icon: '🏠', label: '首页' },
      { key: 'book', icon: '📅', label: '预约' },
      { key: 'manager', icon: '🏪', label: '店长' },
      { key: 'my', icon: '👩', label: '我的' }
    ],
    tabs: []
  },

  lifetimes: {
    attached() {
      this.updateTabs()
    }
  },

  pageLifetimes: {
    show() {
      this.updateTabs()
    }
  },

  methods: {
    updateTabs() {
      try {
        const role = wx.getStorageSync('userRole')
        const { allTabs } = this.data
        if (role === 'manager') {
          this.setData({ tabs: allTabs })
        } else {
          // 学员角色隐藏店长菜单
          this.setData({ tabs: allTabs.filter(t => t.key !== 'manager') })
        }
      } catch (e) {
        this.setData({ tabs: this.data.allTabs.filter(t => t.key !== 'manager') })
      }
    },

    switchTab(e) {
      const { key } = e.currentTarget.dataset
      if (key === this.data.current) return

      const urlMap = {
        index: '/pages/index/index',
        book: '/pages/book/book',
        manager: '/pages/manager/manager',
        my: '/pages/my/my'
      }

      wx.reLaunch({ url: urlMap[key] })
    }
  }
})
