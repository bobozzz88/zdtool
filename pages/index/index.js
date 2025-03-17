// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    motto: '智慧家庭',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    isLogin: false,
    phone: '',
    password: '',
    showLoginForm: false,
    showRegisterForm: false,
    // 月度数据
    monthlyExpense: '0.00',
    monthlyIncome: '0.00',
    monthlyBalance: '0.00',
    budgetRemaining: '0.00',
    // AI洞察
    aiInsights: [
      '本月餐饮支出较上月增长30%，建议适当控制外卖频率',
      '本周交通支出异常，可以考虑更多使用公共交通',
      '距离信用卡还款日还有3天，请注意及时还款',
      '本月已节省200元，继续保持好习惯'
    ]
  },

  onLoad() {
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLogin: true,
        userInfo: userInfo,
        hasUserInfo: true
      });
      // 加载用户数据
      this.loadUserData();
    }
  },

  // 加载用户数据
  loadUserData() {
    // 这里应该从服务器获取数据
    // 目前使用模拟数据
    this.setData({
      monthlyExpense: '2,358.00',
      monthlyIncome: '6,000.00',
      monthlyBalance: '3,642.00',
      budgetRemaining: '642.00'
    });
  },

  // 刷新AI洞察
  refreshInsights() {
    wx.showLoading({
      title: '分析中...',
    });

    // 模拟API调用延迟
    setTimeout(() => {
      this.setData({
        aiInsights: [
          '发现新的省钱机会：订阅服务可以选择年付方案，预计每月可省15元',
          '本月投资收益率达到4%，高于平均水平',
          '检测到可能的重复订阅，建议查看并优化',
          '您的记账习惯非常好，已持续记账30天'
        ]
      });
      wx.hideLoading();
    }, 1000);
  },

  // 跳转到账本页面
  navigateToFinance() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    wx.switchTab({
      url: '../finance/finance'
    });
  },

  // 显示登录表单
  showLogin() {
    this.setData({
      showLoginForm: true,
      showRegisterForm: false
    });
  },

  // 显示注册表单
  showRegister() {
    this.setData({
      showLoginForm: false,
      showRegisterForm: true
    });
  },

  // 关闭登录/注册表单
  closeForm() {
    this.setData({
      showLoginForm: false,
      showRegisterForm: false
    });
  },

  // 输入手机号
  inputPhone(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入密码
  inputPassword(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 登录
  login() {
    const { phone, password } = this.data;
    
    if (!phone || !password) {
      wx.showToast({
        title: '请输入手机号和密码',
        icon: 'none'
      });
      return;
    }
    
    // 这里应该有实际的登录逻辑，连接到后端API
    // 这里简化处理，只要输入了手机号和密码就视为登录成功
    
    // 创建用户信息
    const userInfo = {
      nickName: `用户${phone.substring(phone.length - 4)}`,
      avatarUrl: defaultAvatarUrl,
      phone: phone
    };
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    this.setData({
      isLogin: true,
      userInfo: userInfo,
      hasUserInfo: true,
      showLoginForm: false
    });
    
    // 加载用户数据
    this.loadUserData();
    
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
  },

  // 注册
  register() {
    const { phone, password } = this.data;
    
    if (!phone || !password) {
      wx.showToast({
        title: '请输入手机号和密码',
        icon: 'none'
      });
      return;
    }
    
    if (phone.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }
    
    if (password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      });
      return;
    }
    
    // 这里应该有实际的注册逻辑，连接到后端API
    // 这里简化处理，只要输入了符合规则的手机号和密码就视为注册成功
    
    // 创建用户信息
    const userInfo = {
      nickName: `用户${phone.substring(phone.length - 4)}`,
      avatarUrl: defaultAvatarUrl,
      phone: phone
    };
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    this.setData({
      isLogin: true,
      userInfo: userInfo,
      hasUserInfo: true,
      showRegisterForm: false
    });
    
    // 加载用户数据
    this.loadUserData();
    
    wx.showToast({
      title: '注册成功',
      icon: 'success'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userInfo');
          
          this.setData({
            isLogin: false,
            userInfo: {
              avatarUrl: defaultAvatarUrl,
              nickName: '',
            },
            hasUserInfo: false,
            // 清除数据
            monthlyExpense: '0.00',
            monthlyIncome: '0.00',
            monthlyBalance: '0.00',
            budgetRemaining: '0.00'
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        // 保存到本地存储
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          isLogin: true
        });

        // 加载用户数据
        this.loadUserData();

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  navigateToAnalysis() {
    wx.navigateTo({
      url: '/pages/analysis/analysis'
    });
  },

  navigateToAiAssistant() {
    wx.navigateTo({
      url: '/pages/assistant/assistant'
    });
  },

  navigateToBudget() {
    wx.navigateTo({
      url: '/pages/budget/budget'
    });
  }
})
