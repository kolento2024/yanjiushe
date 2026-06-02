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
    .then(res => {
      const openid = res.data && res.data.openid ? res.data.openid : null
      console.log('[通知] 读取店长openid:', openid ? '成功(' + openid.substring(0, 8) + '...)' : '为空')
      return openid
    })
    .catch(err => {
      console.error('[通知] 读取settings/shop_owner失败:', err)
      return null
    })
}

// 通知店长：新预约 / 取消预约
// type: 'new_booking' | 'cancel_booking'
function notifyShopOwner(type, bookingData) {
  console.log('[通知] notifyShopOwner 被调用，type:', type)
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

    console.log('[通知] 调用云函数 sendSubscribeMessage，type:', type)
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
      console.log('[通知] 云函数返回:', JSON.stringify(r))
      if (r.code === 0) {
        console.log('[通知] ✅ 微信订阅消息发送成功！请查看微信"服务通知"')
      } else if (r.errCode === 43101) {
        console.log('[通知] ❌ 凭证已用完(43101)，下次打开"我的"页面会自动续期')
        return { skipped: true, reason: '凭证已用完' }
      } else {
        console.error('[通知] ❌ 发送失败:', r.hint || r.error || r.msg, 'errCode:', r.errCode)
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

// 保存消息到云数据库 notifications 集合（消息中心，永久保留）
function saveNotification(type, bookingData) {
  if (!wx.cloud) {
    console.log('[消息中心] 云开发未初始化，消息无法保存')
    return
  }
  const db = wx.cloud.database()
  const content = type === 'new_booking'
    ? `${bookingData.name} 预约了 ${bookingData.serviceName} - ${bookingData.dateText || bookingData.bookingDate} ${bookingData.bookingTime}`
    : `${bookingData.cancelBy || '客户'} 取消了 ${bookingData.name} 的 ${bookingData.serviceName} 预约`

  db.collection('notifications').add({
    data: {
      type,
      title: type === 'new_booking' ? '新预约通知' : '预约取消通知',
      content,
      read: false,
      createTime: db.serverDate()
    }
  }).then(() => {
    console.log('[消息中心] 写入成功')
  }).catch(err => {
    console.error('[消息中心] 写入失败:', err)
  })
}

module.exports = { notifyShopOwner, TMPL_ID, saveNotification }
