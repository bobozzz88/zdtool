const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 检查是否是指定的重复日期
function isRepeatDay(repeatDays) {
  const today = new Date().getDay() || 7 // 转换周日的0为7
  return repeatDays.includes(today.toString())
}

// 检查时间是否匹配
function isTimeMatch(reminderTime) {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  return currentTime === reminderTime
}

exports.main = async (event, context) => {
  try {
    // 获取所有活动的提醒
    const reminders = await db.collection('reminders')
      .where({
        status: 'active'
      })
      .get()

    for (const reminder of reminders.data) {
      let shouldNotify = false

      if (reminder.ruleType === 'time') {
        // 时间规则
        if (isRepeatDay(reminder.repeatDays) && isTimeMatch(reminder.time)) {
          shouldNotify = true
        }
      }

      if (shouldNotify) {
        // 发送通知
        for (const memberId of reminder.members) {
          await cloud.callFunction({
            name: 'sendNotification',
            data: {
              type: 'reminder',
              reminderId: reminder._id,
              memberId
            }
          })
        }

        // 记录提醒历史
        await db.collection('reminderHistory').add({
          data: {
            reminderId: reminder._id,
            triggerTime: db.serverDate(),
            status: 'sent'
          }
        })
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error
    }
  }
} 