const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs')

const SmsClient = tencentcloud.sms.v20210111.Client

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 初始化短信客户端
const client = new SmsClient({
  credential: {
    secretId: 'YOUR_SECRET_ID',
    secretKey: 'YOUR_SECRET_KEY'
  },
  region: 'ap-guangzhou',
  profile: {
    signMethod: 'HmacSHA256',
    httpProfile: {
      reqMethod: 'POST',
      reqTimeout: 30,
      endpoint: 'sms.tencentcloudapi.com'
    }
  }
})

exports.main = async (event, context) => {
  const { phoneNumber, memberName, location } = event

  try {
    const params = {
      SmsSdkAppId: 'YOUR_SDK_APP_ID',
      SignName: 'YOUR_SIGN_NAME',
      TemplateId: 'YOUR_TEMPLATE_ID',
      PhoneNumberSet: [phoneNumber],
      TemplateParamSet: [memberName, location]
    }

    const result = await client.SendSms(params)

    return {
      success: true,
      result
    }
  } catch (error) {
    console.error('发送短信失败:', error)
    return {
      success: false,
      error
    }
  }
} 