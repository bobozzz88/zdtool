const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { type, zoneId, memberId } = event

  try {
    // 获取安全区域信息
    const zone = await db.collection('safeZones').doc(zoneId).get()
    
    // 获取成员信息
    const member = await db.collection('members').doc(memberId).get()

    // 构建通知内容
    const content = `${member.data.name}${type === 'enter' ? '进入了' : '离开了'}${zone.data.name}`

    // 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: zone.data._openid, // 发送给区域创建者
      templateId: 'YOUR_TEMPLATE_ID', // 替换为您的模板ID
      data: {
        thing1: { value: member.data.name }, // 成员名称
        thing2: { value: zone.data.name }, // 区域名称
        thing3: { value: type === 'enter' ? '进入' : '离开' }, // 动作
        time4: { value: new Date().toLocaleString() }, // 时间
        thing5: { value: '点击查看详情' } // 备注
      },
      page: 'pages/location/location' // 跳转页面
    })

    // 保存通知记录
    await db.collection('notifications').add({
      data: {
        type,
        zoneId,
        memberId,
        content,
        createTime: db.serverDate(),
        status: 'sent'
      }
    })

    return {
      success: true,
      result
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error
    }
  }
} 