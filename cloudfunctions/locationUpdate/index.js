const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 计算两点之间的距离（米）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degree) {
  return degree * Math.PI / 180;
}

// 检查时间是否在范围内
function isTimeInRange(startTime, endTime) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= startTime && currentTime <= endTime;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { latitude, longitude, memberId } = event

  try {
    // 更新成员位置
    await db.collection('members').doc(memberId).update({
      data: {
        location: {
          latitude,
          longitude,
          updateTime: db.serverDate()
        }
      }
    })

    // 获取相关的安全区域
    const safeZones = await db.collection('safeZones')
      .where({
        members: memberId
      })
      .get()

    // 检查每个安全区域
    for (const zone of safeZones.data) {
      // 检查时间条件
      if (!zone.timeSettings.isAllDay && 
          !isTimeInRange(zone.timeSettings.startTime, zone.timeSettings.endTime)) {
        continue
      }

      // 计算距离
      const distance = calculateDistance(
        latitude,
        longitude,
        zone.location.latitude,
        zone.location.longitude
      )

      // 检查是否需要发送通知
      const isInZone = distance <= zone.radius
      const lastStatus = await db.collection('zoneStatus')
        .where({
          zoneId: zone._id,
          memberId
        })
        .limit(1)
        .get()

      if (lastStatus.data.length === 0 || lastStatus.data[0].isInZone !== isInZone) {
        // 状态发生变化，需要发送通知
        if ((isInZone && zone.alerts.enter) || (!isInZone && zone.alerts.leave)) {
          // 发送通知
          await cloud.callFunction({
            name: 'sendNotification',
            data: {
              type: isInZone ? 'enter' : 'leave',
              zoneId: zone._id,
              memberId
            }
          })
        }

        // 更新状态
        if (lastStatus.data.length === 0) {
          await db.collection('zoneStatus').add({
            data: {
              zoneId: zone._id,
              memberId,
              isInZone,
              updateTime: db.serverDate()
            }
          })
        } else {
          await db.collection('zoneStatus').doc(lastStatus.data[0]._id).update({
            data: {
              isInZone,
              updateTime: db.serverDate()
            }
          })
        }
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