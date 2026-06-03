// pages/index/index.js
Page({
  data: {
    services: [
      // ===== 开放课程 =====
      {
        id: 1,
        name: '【4节课】一对一化妆私教课',
        icon: '/images/common/item1.png',
        desc: '化妆私教课基础课程，实现美丽不求人',
        price: 980,
        time: '约120分钟',
        features: []
      },
      {
        id: 7,
        name: '【6节课】一对一化妆提升私教课',
        icon: '/images/common/item1.png',
        desc: '私教提升课，进一步提升您的化妆技巧',
        price: 1280,
        time: '约120分钟',
        features: []
      },
      {
        id: 5,
        name: '【1v1化妆私教】化妆体验课-2h',
        icon: '/images/common/item5.png',
        desc: '体验课程',
        price: 158,
        time: '约120分钟',
        features: []
      },
      // ===== 暂时隐藏的课程 =====
      // {
      //   id: 2,
      //   name: '【主题妆】主持人妆+舞台妆+晚宴妆+应援妆+空乘妆',
      //   icon: '/images/common/item2.png',
      //   desc: '包含（妆+发），一生一次的重要时刻，精致不将就',
      //   price: 228,
      //   time: '约90分钟',
      //   features: []
      // },
      // {
      //   id: 3,
      //   name: '【新客大促】伪素颜+艺考妆+白开水+裸妆+淡妆',
      //   icon: '/images/common/item3.png',
      //   desc: '新客超优惠，包含（妆+发）',
      //   price: 188,
      //   time: '约90分钟',
      //   features: []
      // },
      // {
      //   id: 4,
      //   name: '【人气爆款】精致韩妆+网感妆+上镜妆+千金妆',
      //   icon: '/images/common/item4.png',
      //   desc: '包含（妆+发）',
      //   price: 198,
      //   time: '约90分钟',
      //   features: []
      // },
      // {
      //   id: 6,
      //   name: '【人气首选】韩系妆+日系妆+水光妆+纯欲妆+雷系妆',
      //   icon: '/images/common/item6.png',
      //   desc: '多种人气妆容任你选',
      //   price: 188,
      //   time: '约90分钟',
      //   features: []
      // },
      // {
      //   id: 8,
      //   name: '【top风格妆】亚裔妆+清泰妆+古早烟熏+千禧辣妹',
      //   icon: '/images/common/item7.png',
      //   desc: '多种人气妆容任你选',
      //   price: 258,
      //   time: '约90分钟',
      //   features: []
      // }
    ],
    reviews: [
      {
        avatar: '',
        name: '小雅',
        rating: 5,
        text: '上了4节私教课，老师讲得特别细致，从底妆到眼妆一步步带练，现在终于能自己画出满意的妆容了！'
      },
      {
        avatar: '',
        name: 'Linda',
        rating: 5,
        text: '体验课超值！老师根据我的脸型一对一指导，学到了很多适合自己的化妆技巧，果断报了私教课～'
      },
      {
        avatar: '',
        name: '思思',
        rating: 5,
        text: '提升课真的很实用，纠正了很多之前错误的化妆习惯，妆容精致度提升了好几个档次，强烈推荐！'
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
