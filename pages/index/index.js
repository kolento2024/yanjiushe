// pages/index/index.js
Page({
  data: {
    services: [
      {
        id: 1,
        name: '日常妆容',
        icon: '💄',
        desc: '适合通勤、约会等日常场合',
        price: 198,
        time: '约60分钟',
        features: ['自然清透', '持久不脱妆', '修饰脸型']
      },
      {
        id: 2,
        name: '新娘妆',
        icon: '👰',
        desc: '一生一次的重要时刻，精致不将就',
        price: 888,
        time: '约120分钟',
        features: ['试妆服务', '奢华头饰', '全天跟妆']
      },
      {
        id: 3,
        name: '舞台妆',
        icon: '✨',
        desc: '舞台表演、年会等场合专属妆容',
        price: 368,
        time: '约90分钟',
        features: ['立体修容', '舞台灯光适配', '持久定型']
      },
      {
        id: 4,
        name: '晚宴妆',
        icon: '🌙',
        desc: '晚宴、派对等重要社交场合',
        price: 398,
        time: '约80分钟',
        features: ['精致眼妆', '高级感底妆', '造型搭配建议']
      },
      {
        id: 5,
        name: '男士妆',
        icon: '🤵',
        desc: '自然无痕的男士专属妆容',
        price: 168,
        time: '约45分钟',
        features: ['无痕自然', '遮瑕修饰', '提升气色']
      },
      {
        id: 6,
        name: '试妆体验',
        icon: '🎨',
        desc: '提前感受效果，沟通妆容需求',
        price: 99,
        time: '约40分钟',
        features: ['妆前沟通', '风格定位', '免费咨询']
      }
    ],
    reviews: [
      {
        avatar: '',
        name: '小雅',
        rating: 5,
        text: '化妆师手法非常温柔，新娘妆效果超出预期，婚礼当天所有人都夸好看！'
      },
      {
        avatar: '',
        name: 'Linda',
        rating: 5,
        text: '日常妆真的很自然，同事都没发现我化妆了，只说我气色变好了～'
      },
      {
        avatar: '',
        name: '思思',
        rating: 5,
        text: '舞台妆太惊艳了！年会表演的时候灯光下效果绝了，强烈推荐！'
      }
    ]
  },

  onLoad() {},

  goBook() {
    wx.navigateTo({
      url: '/pages/book/book'
    })
  },

  goBookWithService(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/book/book?serviceId=' + id
    })
  },

  onShareAppMessage() {
    return {
      title: '颜究社 · 专业化妆预约',
      path: '/pages/index/index'
    }
  }
})
