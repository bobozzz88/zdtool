const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'record':
        // 记录轨迹点
        await db.collection('trajectoryPoints').add({
          data: {
            memberId: data.memberId,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed || 0,
            accuracy: data.accuracy || 0,
            altitude: data.altitude || 0,
            createTime: db.serverDate()
          }
        })
        return { success: true }

      case 'query':
        // 查询轨迹
        const { memberId, startTime, endTime } = data
        const points = await db.collection('trajectoryPoints')
          .where({
            memberId,
            createTime: _.gte(new Date(startTime)).and(_.lte(new Date(endTime)))
          })
          .orderBy('createTime', 'asc')
          .get()

        return {
          success: true,
          points: points.data
        }

      case 'clear':
        // 清理历史轨迹（保留最近7天）
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        await db.collection('trajectoryPoints')
          .where({
            createTime: _.lt(sevenDaysAgo)
          })
          .remove()

        return { success: true }

      default:
        return {
          success: false,
          error: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error
    }
  }
} 