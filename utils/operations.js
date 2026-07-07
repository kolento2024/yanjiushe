// 操作日志工具（云数据库 + 本地缓存双写）
const COLLECTION = 'operation_logs'
const STORAGE_KEY = 'operation_logs'

// 懒加载 db，避免模块加载时云开发未初始化
let _db = null
function getDB() {
  if (_db) return _db
  if (!wx.cloud) {
    console.warn('云开发未初始化，日志将仅输出到本地')
    return null
  }
  _db = wx.cloud.database()
  return _db
}

function now() {
  const d = new Date()
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 生成唯一 ID
function uid() {
  return 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

// 标准化时间格式为 "YYYY-MM-DD HH:mm:ss"（兼容中文 locale 等非标准格式）
function normalizeTime(t) {
  if (!t) return now()
  // 将各种日期分隔符统一替换为 -，再解析
  const d = new Date(String(t).replace(/\//g, '-').replace(/\./g, '-'))
  if (isNaN(d.getTime())) return now()
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 添加操作日志，失败不影响主流程
function addLog(type, params) {
  // 统一标准化时间（不依赖调用方传入的格式）
  const time = normalizeTime(params.time)

  let detail = ''
  switch (type) {
    case 'book':
      detail = `${params.nickName} 在 ${time} 预约了【${params.serviceName}】（${params.bookingDate} ${params.bookingTime}）`
      break
    case 'cancel_by_user':
      detail = `${params.nickName} 在 ${time} 取消了自己的【${params.serviceName}】课程（${params.bookingDate} ${params.bookingTime}）`
      break
    case 'cancel_by_owner':
      detail = `店长 在 ${time} 取消了${params.studentName}的【${params.serviceName}】课程（${params.bookingDate} ${params.bookingTime}）`
      break
    case 'add_student':
      detail = `店长 在 ${time} 添加了学员【${params.studentName}】（${params.serviceName}）`
      break
    default:
      detail = `${time} — 未知操作`
  }

  const logItem = {
    _id: uid(),
    type,
    time,
    detail,
    createdAt: new Date().toISOString()
  }

  // 1. 先写本地 storage（保证一定生效）
  try {
    const localLogs = wx.getStorageSync(STORAGE_KEY) || []
    localLogs.unshift(logItem)
    // 最多保留 500 条
    if (localLogs.length > 500) localLogs.length = 500
    wx.setStorageSync(STORAGE_KEY, localLogs)
    console.log('[操作日志] 本地已记录:', detail)
  } catch (e) {
    console.warn('[操作日志] 本地写入失败:', e)
  }

  // 2. 再尝试云端写入（尽力而为）
  const db = getDB()
  if (!db) return Promise.resolve()

  return db.collection(COLLECTION).add({
    data: {
      _id: logItem._id, // 同步本地 _id，确保合并去重能匹配
      type,
      time,
      detail,
      createdAt: db.serverDate()
    }
  }).catch(err => {
    console.warn('[操作日志] 云端写入失败(可能因权限不足):', err)
    // 本地已有备份，无需额外处理
  })
}

// 获取所有日志（云端 + 本地合并，按时间倒序，最多200条）
async function getLogs() {
  const db = getDB()
  let cloudLogs = []

  // 1. 尝试读云端日志
  if (db) {
    try {
      const MAX_LIMIT = 20
      const countResult = await db.collection(COLLECTION).count()
      const total = Math.min(countResult.total, 200)
      if (total > 0) {
        const batchTimes = Math.ceil(total / MAX_LIMIT)
        const tasks = []
        for (let i = 0; i < batchTimes; i++) {
          tasks.push(
            db.collection(COLLECTION)
              .orderBy('createdAt', 'desc')
              .skip(i * MAX_LIMIT)
              .limit(MAX_LIMIT)
              .get()
          )
        }
        const results = await Promise.allSettled(tasks)
        cloudLogs = results
          .filter(r => r.status === 'fulfilled')
          .reduce((acc, cur) => acc.concat(cur.value.data), [])
      }
    } catch (e) {
      console.error('云端获取日志失败:', e)
    }
  }

  // 2. 读本地日志
  let localLogs = []
  try {
    localLogs = wx.getStorageSync(STORAGE_KEY) || []
  } catch (e) {}

  // 3. 合并去重（本地有云端没有的补进去，按 time 倒序）
  const cloudIds = new Set(cloudLogs.map(item => item._id))
  const localOnly = localLogs.filter(item => !cloudIds.has(item._id))

  // 归一化 time 字段，确保所有数据的格式统一
  const normalizeItem = (item) => ({
    ...item,
    time: normalizeTime(item.time)
  })

  const merged = [...cloudLogs.map(normalizeItem), ...localOnly.map(normalizeItem)].sort((a, b) => {
    // createdAt 可能是云端的 serverDate（对象），兼容处理
    const getTs = (item) => {
      const t = item.createdAt
      if (t && typeof t === 'object' && t.getTime) return t.getTime()
      if (typeof t === 'string') return new Date(t).getTime()
      // 兜底：用 time 字段
      if (item.time) return new Date(item.time).getTime()
      return 0
    }
    return getTs(b) - getTs(a)
  })

  return merged.slice(0, 200)
}

// 清空日志
async function clearLogs() {
  // 先清本地
  try {
    wx.setStorageSync(STORAGE_KEY, [])
  } catch (e) {}

  // 再清云端
  const db = getDB()
  if (!db) return
  
  try {
    const MAX_LIMIT = 20
    const countResult = await db.collection(COLLECTION).count()
    const total = countResult.total
    if (total === 0) return
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const allIds = []
    for (let i = 0; i < batchTimes; i++) {
      const res = await db.collection(COLLECTION)
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .field({ _id: true })
        .get()
      allIds.push(...res.data.map(item => item._id))
    }
    const deleteBatchTimes = Math.ceil(allIds.length / MAX_LIMIT)
    const deleteTasks = []
    for (let i = 0; i < deleteBatchTimes; i++) {
      const ids = allIds.slice(i * MAX_LIMIT, (i + 1) * MAX_LIMIT)
      deleteTasks.push(
        db.collection(COLLECTION).where({
          _id: db.command.in(ids)
        }).remove()
      )
    }
    await Promise.all(deleteTasks)
  } catch (e) {
    console.error('清空日志失败', e)
    throw e
  }
}

module.exports = {
  addLog,
  getLogs,
  clearLogs
}
