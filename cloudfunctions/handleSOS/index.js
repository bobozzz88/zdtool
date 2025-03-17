const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'create':
        // 创建SOS记录
        const result = await db.collection('sosRecords').add({
          data: {
            memberId: data.memberId,
            location: {
              latitude: data.latitude,
              longitude: data.longitude,
              address: data.address
            },
            status: 'pending',
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })

        // 发送短信通知
        await cloud.callFunction({
          name: 'sendSMS',
          data: {
            phoneNumber: data.contactPhone,
            memberName: data.memberName,
            location: data.address
          }
        })

        // 发送订阅消息
        await cloud.openapi.subscribeMessage.send({
          touser: data.contactOpenId,
          templateId: 'YOUR_TEMPLATE_ID', // 替换为您的模板ID
          data: {
            thing1: { value: data.memberName },
            thing2: { value: data.address },
            time3: { value: new Date().toLocaleString() },
            thing4: { value: '待处理' },
            thing5: { value: '请尽快查看并处理' }
          }
        })

        return {
          success: true,
          sosId: result._id
        }

      case 'update':
        // 更新SOS状态
        await db.collection('sosRecords').doc(data.sosId).update({
          data: {
            status: data.status,
            updateTime: db.serverDate()
          }
        })
        return { success: true }

      case 'list':
        // 获取SOS记录列表
        const records = await db.collection('sosRecords')
          .where({
            memberId: data.memberId
          })
          .orderBy('createTime', 'desc')
          .get()

        return {
          success: true,
          records: records.data
        }

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