// 云函数：发送订阅消息给店长
// 使用前请在微信公众平台申请订阅消息模板，并在调用时传入 tmplId
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { type, bookingData, shopOpenid, tmplId, action } = event

  // 获取当前用户的 openid（用于店长设置）
  if (action === 'getOpenid') {
    const wxContext = cloud.getWXContext()
    return { code: 0, openid: wxContext.OPENID }
  }

  if (!shopOpenid) {
    return { code: -1, msg: '缺少店长openid' }
  }
  if (!tmplId) {
    return { code: -1, msg: '缺少模板ID，请在微信公众平台申请订阅消息模板' }
  }

  try {
    let data = {}
    let page = '/pages/roster/roster'

    if (type === 'new_booking') {
      // 新预约通知
      data = {
        thing1: { value: (bookingData.serviceName || '').substring(0, 20) },
        time2: { value: (bookingData.dateText || '') + ' ' + (bookingData.bookingTime || '') },
        thing3: { value: (bookingData.name || '').substring(0, 20) },
        phone_number4: { value: bookingData.phone || '' },
        amount5: { value: '¥' + (bookingData.servicePrice || 0) }
      }
    } else if (type === 'cancel_booking') {
      // 取消预约通知
      data = {
        thing1: { value: (bookingData.serviceName || '').substring(0, 20) },
        time2: { value: (bookingData.dateText || '') + ' ' + (bookingData.bookingTime || '') },
        thing3: { value: (bookingData.name || '').substring(0, 20) },
        phone_number4: { value: bookingData.phone || '' },
        thing5: { value: ((bookingData.cancelBy || '客户') + '取消了预约').substring(0, 20) }
      }
    } else {
      return { code: -1, msg: '不支持的消息类型: ' + type }
    }

    const result = await cloud.openapi.subscribeMessage.send({
      touser: shopOpenid,
      page: page,
      templateId: tmplId,
      data: data,
      miniprogramState: 'developer' // 开发阶段用 'developer'，上线后改为 'formal'
    })

    return { code: 0, msg: '通知已发送', result }
  } catch (err) {
    console.error('发送订阅消息失败：', err)
    // errCode 43101 表示用户未订阅或订阅已过期，不算严重错误
    return { code: -1, msg: '发送失败', error: err.message, errCode: err.errCode }
  }
}
