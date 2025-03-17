const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 生成邀请码
function generateInviteCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'add':
        // 添加新成员
        const inviteCode = generateInviteCode()
        const result = await db.collection('members').add({
          data: {
            _openid: wxContext.OPENID,
            name: data.name,
            phone: data.phone,
            avatar: data.avatar || '/images/icons/default-avatar.png',
            inviteCode,
            role: data.role || 'member',
            status: 'active',
            location: {
              latitude: 0,
              longitude: 0,
              updateTime: db.serverDate()
            },
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        return {
          success: true,
          memberId: result._id,
          inviteCode
        }

      case 'update':
        // 更新成员信息
        await db.collection('members').doc(data.memberId).update({
          data: {
            name: data.name,
            phone: data.phone,
            avatar: data.avatar,
            updateTime: db.serverDate()
          }
        })
        return { success: true }

      case 'delete':
        // 删除成员
        await db.collection('members').doc(data.memberId).update({
          data: {
            status: 'inactive',
            updateTime: db.serverDate()
          }
        })
        return { success: true }

      case 'join':
        // 通过邀请码加入
        const member = await db.collection('members')
          .where({
            inviteCode: data.inviteCode,
            status: 'active'
          })
          .get()

        if (member.data.length === 0) {
          return {
            success: false,
            error: '无效的邀请码'
          }
        }

        // 更新成员关联
        await db.collection('memberRelations').add({
          data: {
            memberId: member.data[0]._id,
            relatedOpenId: wxContext.OPENID,
            permission: 'view',
            createTime: db.serverDate()
          }
        })

        return { 
          success: true,
          memberInfo: member.data[0]
        }

      case 'list':
        // 获取成员列表
        const relations = await db.collection('memberRelations')
          .where({
            relatedOpenId: wxContext.OPENID
          })
          .get()

        const memberIds = relations.data.map(r => r.memberId)
        memberIds.push(wxContext.OPENID) // 包含自己

        const members = await db.collection('members')
          .where({
            _id: _.in(memberIds),
            status: 'active'
          })
          .get()

        return {
          success: true,
          members: members.data
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