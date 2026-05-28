// 店长通知工具
// 依赖云函数 sendSubscribeMessage 和云数据库 settings 集合

// 订阅消息模板ID —— 请在微信公众平台申请后替换此值
// 路径：微信公众平台 → 功能 → 订阅消息 → 选用模板（如"服务进度提醒"或"预约提醒"）
const TMPL_ID = '7H00CTmIuOeueS6pCkqv2MbzQoPlv92N5eWlGGHZvTQ'

const SETTINGS_COLLECTION = 'settings'
const SHOP_OWNER_DOC = 'shop_owner'

// 获取店长 openid（从云数据库读取）
function getShopOwnerOpenid() {
  if (!wx.cloud) return Promise.reject(new Error('云开发未初始化'))
  const db = wx.cloud.database()
  return db.collection(SETTINGS_COLLECTION)
    .doc(SHOP_OWNER_DOC)
    .get()
    .then(res => res.data && res.data.openid ? res.data.openid : null)
    .catch(() => null)
}

// 通知店长：新预约 / 取消预约
// type: 'new_booking' | 'cancel_booking'
function notifyShopOwner(type, bookingData) {
  if (TMPL_ID === 'TEMPLATE_ID_PLACEHOLDER') {
    console.log('[通知] 模板ID未配置，跳过发送')
    return Promise.resolve({ skipped: true, reason: '模板ID未配置' })
  }
  if (!wx.cloud) {
    console.log('[通知] 云开发未初始化，跳过发送')
    return Promise.resolve({ skipped: true, reason: '云开发未初始化' })
  }

  return getShopOwnerOpenid().then(shopOpenid => {
    if (!shopOpenid) {
      console.log('[通知] 未找到店长openid，请先在"我的"页面订阅通知')
      return { skipped: true, reason: '店长未订阅' }
    }

    return wx.cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: {
        type,
        bookingData,
        shopOpenid,
        tmplId: TMPL_ID
      }
    }).then(res => {
      const r = res.result || {}
      if (r.code === -1 && r.errCode === 43101) {
        // 用户取消订阅或订阅过期，静默处理
        console.log('[通知] 店长订阅已过期或未订阅')
        return { skipped: true, reason: '订阅过期' }
      }
      return r
    }).catch(err => {
      console.error('[通知] 云函数调用失败:', err)
      return { skipped: true, reason: '云函数调用失败' }
    })
  }).catch(() => {
    console.log('[通知] 获取店长openid失败')
    return { skipped: true, reason: '读取openid失败' }
  })
}

module.exports = { notifyShopOwner, TMPL_ID }
