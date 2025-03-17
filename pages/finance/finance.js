const app = getApp()

Page({
  data: {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    monthlyExpense: 0,
    monthlyIncome: 0,
    monthlyBalance: 0,
    monthlyBudget: 3000,
    budgetProgress: 0,
    showRecordModal: false,
    showBudgetModal: false,
    showFilterModal: false,
    showRecordDetailModal: false,
    currentRecord: {},
    recordType: 'expense',
    isRefreshing: false,
    hasMore: false,
    pageSize: 20,
    currentPage: 1,
    newRecord: {
      id: '',
      amount: '',
      category: '',
      note: '',
      date: '',
      icon: '',
      receiptImages: []
    },
    expenseCategories: [
      { name: '餐饮', icon: '🍚' },
      { name: '交通', icon: '🚌' },
      { name: '购物', icon: '🛍️' },
      { name: '娱乐', icon: '🎮' },
      { name: '居住', icon: '🏠' },
      { name: '医疗', icon: '💊' },
      { name: '教育', icon: '📚' },
      { name: '其他', icon: '📝' }
    ],
    incomeCategories: [
      { name: '工资', icon: '💰' },
      { name: '奖金', icon: '🎁' },
      { name: '投资', icon: '📈' },
      { name: '兼职', icon: '💼' },
      { name: '其他', icon: '📝' }
    ],
    budgetCategories: [],
    newBudget: '',
    filter: {
      type: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    },
    records: [],
    aiAnalysis: {
      monthlyTrend: [],
      categoryDistribution: [],
      suggestions: [],
      abnormalExpenses: []
    },
    emptyTips: {
      show: true,
      text: '暂无记录，点击"记一笔"开始记账吧！'
    },
    isLogin: false,
    userInfo: null
  },

  onLoad() {
    this.checkLoginStatus();
    this.initData();
    
    // 初始化预算分类
    this.setData({
      budgetCategories: this.data.expenseCategories.map(cat => ({
        ...cat,
        budget: ''
      }))
    });
  },

  onShow() {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 如果已登录，加载数据
    if (this.data.isLogin) {
      this.loadMonthlyData();
      this.loadRecords(); // 确保加载记录
      this.performAIAnalysis();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLogin: true,
        userInfo: userInfo
      });
    } else {
      this.setData({
        isLogin: false,
        userInfo: null
      });
      
      // 未登录时跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
      
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
    }
  },

  // 初始化数据
  initData() {
    // 如果未登录，不初始化数据
    if (!this.data.isLogin) {
      return;
    }
    
    // 从本地存储加载预算设置
    const savedBudget = wx.getStorageSync('monthlyBudget');
    const savedCategoryBudgets = wx.getStorageSync('categoryBudgets');
    
    // 初始化预算分类
    let budgetCategories = this.data.expenseCategories.map(category => ({
      ...category,
      budget: 0,
      used: '0.00',
      progress: '0'
    }));
    
    // 如果有保存的分类预算，使用保存的数据
    if (savedCategoryBudgets && savedCategoryBudgets.length > 0) {
      budgetCategories = savedCategoryBudgets;
    }
    
    this.setData({ 
      budgetCategories,
      monthlyBudget: savedBudget || 3000
    });
    
    // 加载本月数据
    this.loadMonthlyData();
    
    // 加载账单记录
    this.loadRecords();
    
    // 执行AI分析
    this.performAIAnalysis();
  },

  // 加载月度数据
  loadMonthlyData() {
    // 如果未登录，不加载数据
    if (!this.data.isLogin) {
      return;
    }
    
    // 重新加载预算设置
    const savedBudget = wx.getStorageSync('monthlyBudget');
    const savedCategoryBudgets = wx.getStorageSync('categoryBudgets');
    
    let monthlyBudget = this.data.monthlyBudget;
    if (savedBudget) {
      monthlyBudget = parseFloat(savedBudget);
      this.setData({ monthlyBudget });
    }
    
    let budgetCategories = this.data.budgetCategories;
    if (savedCategoryBudgets && savedCategoryBudgets.length > 0) {
      budgetCategories = savedCategoryBudgets;
      this.setData({ budgetCategories });
    }
    
    const { currentYear, currentMonth } = this.data;
    const yearMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // 从存储中获取所有记录
    const allRecords = wx.getStorageSync('financeRecords') || [];
    
    // 筛选当月记录
    const monthRecords = allRecords.filter(record => {
      return record.date.startsWith(yearMonth);
    });
    
    // 计算月度收支
    let monthlyExpense = 0;
    let monthlyIncome = 0;
    
    // 计算分类支出
    const categoryExpenses = {};
    
    monthRecords.forEach(record => {
      if (record.type === 'expense') {
        monthlyExpense += parseFloat(record.amount);
        
        // 累计分类支出
        if (!categoryExpenses[record.category]) {
          categoryExpenses[record.category] = 0;
        }
        categoryExpenses[record.category] += parseFloat(record.amount);
      } else {
        monthlyIncome += parseFloat(record.amount);
      }
    });
    
    const monthlyBalance = monthlyIncome - monthlyExpense;
    const budgetProgress = Math.min((monthlyExpense / monthlyBudget) * 100, 100);
    
    // 更新分类预算使用情况
    let hasCategoryBudgets = false;
    
    const updatedBudgetCategories = budgetCategories.map(category => {
      const used = categoryExpenses[category.name] || 0;
      const budget = parseFloat(category.budget) || 0;
      const progress = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
      
      if (budget > 0) {
        hasCategoryBudgets = true;
      }
      
      return {
        ...category,
        used: used.toFixed(2),
        progress: progress.toFixed(0)
      };
    });
    
    this.setData({
      monthlyExpense: monthlyExpense.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyBalance: monthlyBalance.toFixed(2),
      budgetProgress: budgetProgress.toFixed(0),
      budgetCategories: updatedBudgetCategories,
      hasCategoryBudgets
    });
  },

  // 加载记录
  loadRecords() {
    // 如果未登录，不加载数据
    if (!this.data.isLogin) {
      return;
    }
    
    const { currentYear, currentMonth, filter } = this.data;
    const yearMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // 从存储中获取所有记录
    let allRecords = wx.getStorageSync('financeRecords') || [];
    
    // 筛选当月记录
    let monthRecords = allRecords.filter(record => {
      return record.date.startsWith(yearMonth);
    });
    
    // 应用筛选条件
    if (filter && filter.type !== 'all') {
      monthRecords = monthRecords.filter(record => record.type === filter.type);
    }
    
    if (filter && filter.startDate) {
      monthRecords = monthRecords.filter(record => record.date >= filter.startDate);
    }
    
    if (filter && filter.endDate) {
      monthRecords = monthRecords.filter(record => record.date <= filter.endDate);
    }
    
    if (filter && filter.minAmount) {
      const minAmount = parseFloat(filter.minAmount);
      monthRecords = monthRecords.filter(record => parseFloat(record.amount) >= minAmount);
    }
    
    if (filter && filter.maxAmount) {
      const maxAmount = parseFloat(filter.maxAmount);
      monthRecords = monthRecords.filter(record => parseFloat(record.amount) <= maxAmount);
    }
    
    // 按日期分组
    const recordsByDate = {};
    monthRecords.forEach(record => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = {
          date: record.date,
          items: [],
          totalExpense: 0,
          totalIncome: 0
        };
      }
      
      recordsByDate[record.date].items.push(record);
      
      if (record.type === 'expense') {
        recordsByDate[record.date].totalExpense += parseFloat(record.amount);
      } else {
        recordsByDate[record.date].totalIncome += parseFloat(record.amount);
      }
    });
    
    // 转换为数组并按日期降序排序
    const records = Object.values(recordsByDate).sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
    
    // 更新状态
    this.setData({
      records,
      hasMore: false // 简化处理，实际应用中可以根据记录总数判断
    });
  },

  // 切换月份
  previousMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    this.setData({ currentYear, currentMonth });
    this.loadMonthlyData();
    this.loadRecords();
    this.performAIAnalysis();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    this.setData({ currentYear, currentMonth });
    this.loadMonthlyData();
    this.loadRecords();
    this.performAIAnalysis();
  },

  // 记账相关
  addRecord() {
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const now = new Date();
    this.setData({
      showRecordModal: true,
      newRecord: {
        id: '',
        amount: '',
        category: '',
        note: '',
        date: this.formatDate(now),
        icon: '',
        receiptImages: []
      }
    });
  },

  hideRecordModal() {
    this.setData({
      showRecordModal: false
    });
  },

  selectType(e) {
    this.setData({
      recordType: e.currentTarget.dataset.type,
      'newRecord.category': '',
      'newRecord.icon': ''
    });
  },

  inputAmount(e) {
    this.setData({
      'newRecord.amount': e.detail.value
    });
  },

  selectCategory(e) {
    const { category, icon } = e.currentTarget.dataset;
    this.setData({
      'newRecord.category': category,
      'newRecord.icon': icon
    });
  },

  inputNote(e) {
    this.setData({
      'newRecord.note': e.detail.value
    });
  },

  dateChange(e) {
    this.setData({
      'newRecord.date': e.detail.value
    });
  },

  uploadReceipt() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const currentImages = this.data.newRecord.receiptImages || [];
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        const allImages = [...currentImages, ...newImages].slice(0, 9);
        
        this.setData({
          'newRecord.receiptImages': allImages
        });
        
        wx.showToast({
          title: '票据上传成功',
          icon: 'success'
        });
      }
    });
  },

  // 预览已上传的票据
  previewUploadedReceipt(e) {
    const { index } = e.currentTarget.dataset;
    const { receiptImages } = this.data.newRecord;
    if (receiptImages && receiptImages.length > 0) {
      wx.previewImage({
        current: receiptImages[index],
        urls: receiptImages
      });
    }
  },

  // 删除已上传的票据
  removeUploadedReceipt(e) {
    const { index } = e.currentTarget.dataset;
    const receiptImages = [...this.data.newRecord.receiptImages];
    receiptImages.splice(index, 1);
    
    this.setData({
      'newRecord.receiptImages': receiptImages
    });
    
    wx.showToast({
      title: '已删除票据',
      icon: 'success'
    });
  },

  async saveRecord() {
    const { newRecord, recordType } = this.data;
    
    // 验证输入
    if (!newRecord.amount || !newRecord.category) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 获取现有记录
    const records = wx.getStorageSync('financeRecords') || [];
    
    // 判断是编辑还是新增
    if (newRecord.id) {
      // 编辑现有记录
      const index = records.findIndex(item => item.id === newRecord.id);
      if (index !== -1) {
        // 更新记录，保留原始ID和创建时间
        const originalRecord = records[index];
        records[index] = {
          id: originalRecord.id,
      type: recordType,
          category: newRecord.category,
          amount: parseFloat(newRecord.amount).toFixed(2),
          note: newRecord.note || '',
          date: newRecord.date || this.formatDate(new Date()),
          icon: newRecord.icon,
          receiptImages: newRecord.receiptImages || [],
          createTime: originalRecord.createTime,
          userId: this.data.userInfo.phone
        };
        
        // 保存到存储
        wx.setStorageSync('financeRecords', records);
        
        // 更新数据
    this.loadMonthlyData();
    this.loadRecords();
    this.performAIAnalysis();
    
        // 关闭弹窗并提示
        this.setData({ showRecordModal: false });
    wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      }
    } else {
      // 创建新记录
      const record = {
        id: Date.now().toString(),
        type: recordType,
        category: newRecord.category,
        amount: parseFloat(newRecord.amount).toFixed(2),
        note: newRecord.note || '',
        date: newRecord.date || this.formatDate(new Date()),
        icon: newRecord.icon,
        receiptImages: newRecord.receiptImages || [],
        createTime: new Date().toISOString(),
        userId: this.data.userInfo.phone
      };
      
      records.push(record);
      
      // 保存到存储
      wx.setStorageSync('financeRecords', records);
      
      // 更新数据
      this.loadMonthlyData();
      this.loadRecords();
      this.performAIAnalysis();
      
      // 关闭弹窗并提示
      this.setData({ showRecordModal: false });
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    }
  },

  // 预算管理
  manageBudget() {
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 重新加载预算设置
    const savedBudget = wx.getStorageSync('monthlyBudget');
    const savedCategoryBudgets = wx.getStorageSync('categoryBudgets');
    
    let monthlyBudget = this.data.monthlyBudget;
    if (savedBudget) {
      monthlyBudget = parseFloat(savedBudget);
    }
    
    let budgetCategories = [...this.data.budgetCategories];
    if (savedCategoryBudgets && savedCategoryBudgets.length > 0) {
      budgetCategories = savedCategoryBudgets;
    }
    
    console.log('打开预算设置:', {
      monthlyBudget,
      budgetCategories
    });
    
    this.setData({
      showBudgetModal: true,
      newBudget: monthlyBudget,
      budgetCategories
    });
  },

  hideBudgetModal() {
    this.setData({
      showBudgetModal: false
    });
  },

  inputBudget(e) {
    this.setData({
      newBudget: e.detail.value
    });
  },

  inputCategoryBudget(e) {
    const { index } = e.currentTarget.dataset;
    const { budgetCategories } = this.data;
    
    // 确保输入的是有效数字
    const value = e.detail.value.trim();
    const budget = value === '' ? 0 : parseFloat(value);
    
    // 更新预算值
    budgetCategories[index].budget = value;
    
    this.setData({
      budgetCategories
    });
  },

  saveBudget() {
    const { newBudget, budgetCategories } = this.data;
    
    // 验证输入
    if (!newBudget || isNaN(parseFloat(newBudget))) {
      wx.showToast({
        title: '请输入有效的预算金额',
        icon: 'none'
      });
      return;
    }

    // 处理分类预算
    const categoryBudgets = budgetCategories.map(cat => {
      // 确保budget是数字或空字符串
      const budget = cat.budget === '' ? 0 : parseFloat(cat.budget) || 0;
      
      return {
        ...cat,
        budget: cat.budget, // 保持原始输入格式
        used: cat.used || '0.00',
        progress: cat.progress || '0'
      };
    });
    
    // 保存预算设置
    const budgetValue = parseFloat(newBudget);
    wx.setStorageSync('monthlyBudget', budgetValue);
    wx.setStorageSync('categoryBudgets', categoryBudgets);
    
    console.log('保存预算设置:', {
      monthlyBudget: budgetValue,
      categoryBudgets: categoryBudgets
    });
    
    // 更新状态
    this.setData({
      monthlyBudget: budgetValue,
      budgetCategories: categoryBudgets,
      showBudgetModal: false
    });
    
    // 重新计算预算进度
    this.loadMonthlyData();
    
    wx.showToast({
      title: '预算设置成功',
      icon: 'success'
    });
  },

  // 筛选相关
  showFilter() {
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showFilterModal: true
    });
  },

  hideFilterModal() {
    this.setData({
      showFilterModal: false
    });
  },

  selectFilterType(e) {
    this.setData({
      'filter.type': e.currentTarget.dataset.type
    });
  },

  startDateChange(e) {
    this.setData({
      'filter.startDate': e.detail.value
    });
  },

  endDateChange(e) {
    this.setData({
      'filter.endDate': e.detail.value
    });
  },

  inputMinAmount(e) {
    this.setData({
      'filter.minAmount': e.detail.value
    });
  },

  inputMaxAmount(e) {
    this.setData({
      'filter.maxAmount': e.detail.value
    });
  },

  resetFilter() {
    this.setData({
      filter: {
        type: 'all',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: ''
      }
    });
  },

  applyFilter() {
    const { filter } = this.data;
    
    // 验证日期范围
    if (filter.startDate && filter.endDate) {
      if (filter.startDate > filter.endDate) {
        wx.showToast({
          title: '开始日期不能大于结束日期',
          icon: 'none'
        });
        return;
      }
    }
    
    // 验证金额范围
    if (filter.minAmount && filter.maxAmount) {
      if (parseFloat(filter.minAmount) > parseFloat(filter.maxAmount)) {
        wx.showToast({
          title: '最小金额不能大于最大金额',
          icon: 'none'
        });
        return;
      }
    }
    
    // 重新加载记录
    this.loadRecords();
    this.hideFilterModal();
  },

  // 查看记录详情
  viewRecord(e) {
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const recordId = e.currentTarget.dataset.id;
    
    // 获取所有记录
    const allRecords = wx.getStorageSync('financeRecords') || [];
    
    // 查找当前记录
    const record = allRecords.find(item => item.id === recordId);
    
    if (record) {
      // 格式化创建时间
      const createTime = new Date(record.createTime);
      const createTimeFormatted = `${createTime.getFullYear()}-${(createTime.getMonth() + 1).toString().padStart(2, '0')}-${createTime.getDate().toString().padStart(2, '0')} ${createTime.getHours().toString().padStart(2, '0')}:${createTime.getMinutes().toString().padStart(2, '0')}`;
      
      // 设置当前记录并显示详情弹窗
      this.setData({
        currentRecord: {
          ...record,
          createTimeFormatted
        },
        showRecordDetailModal: true
      });
    } else {
      wx.showToast({
        title: '记录不存在',
        icon: 'none'
      });
    }
  },

  // 隐藏记录详情
  hideRecordDetail() {
    this.setData({
      showRecordDetailModal: false
    });
  },

  // 从详情页编辑记录
  editRecord() {
    const { currentRecord } = this.data;
    
    // 设置编辑数据并显示编辑弹窗
    this.setData({
      recordType: currentRecord.type,
      newRecord: {
        id: currentRecord.id,
        amount: currentRecord.amount,
        category: currentRecord.category,
        note: currentRecord.note || '',
        date: currentRecord.date,
        icon: currentRecord.icon,
        receiptImages: currentRecord.receiptImages || []
      },
      showRecordDetailModal: false,
      showRecordModal: true
    });
  },

  // 从详情页删除记录
  deleteRecordFromDetail() {
    const { currentRecord } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 获取所有记录
          const allRecords = wx.getStorageSync('financeRecords') || [];
          
          // 过滤掉要删除的记录
          const updatedRecords = allRecords.filter(record => record.id !== currentRecord.id);
          
          // 保存更新后的记录
          wx.setStorageSync('financeRecords', updatedRecords);
          
          // 重新加载数据
          this.loadMonthlyData();
          this.loadRecords();
          this.performAIAnalysis();
          
          // 关闭详情弹窗
          this.setData({
            showRecordDetailModal: false
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 查看票据大图
  viewReceiptImage(e) {
    const { index } = e.currentTarget.dataset;
    const { currentRecord } = this.data;
    if (currentRecord.receiptImages && currentRecord.receiptImages.length > 0) {
      wx.previewImage({
        current: currentRecord.receiptImages[index],
        urls: currentRecord.receiptImages
      });
    }
  },

  // 删除记录
  async deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 获取所有记录
          const allRecords = wx.getStorageSync('financeRecords') || [];
          
          // 过滤掉要删除的记录
          const updatedRecords = allRecords.filter(record => record.id !== recordId);
          
          // 保存更新后的记录
          wx.setStorageSync('financeRecords', updatedRecords);
          
          // 重新加载数据
    this.loadMonthlyData();
    this.loadRecords();
    this.performAIAnalysis();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 下拉刷新
  async onRefresh() {
    if (this.data.isRefreshing) return;
    
    this.setData({ isRefreshing: true });
    await this.loadRecords();
    this.setData({ isRefreshing: false });
  },

  // 加载更多
  async onLoadMore() {
    if (!this.data.hasMore) return;
    
    const nextPage = this.data.currentPage + 1;
    await this.loadRecordsByPage(nextPage);
    
    this.setData({
      currentPage: nextPage
    });
  },

  // 分页加载记录
  async loadRecordsByPage(page) {
    const { currentYear, currentMonth, pageSize } = this.data;
    const yearMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // 从存储中获取所有记录
    const allRecords = wx.getStorageSync('financeRecords') || [];
    
    // 筛选当月记录
    const monthRecords = allRecords.filter(record => {
      return record.date.startsWith(yearMonth);
    });

    // 计算分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return monthRecords.slice(start, end);
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 执行AI分析
  performAIAnalysis() {
    // 如果未登录，不执行分析
    if (!this.data.isLogin) {
      return;
    }
    
    // 从存储中获取所有记录
    const allRecords = wx.getStorageSync('financeRecords') || [];
    
    // 筛选当前用户的记录
    const userRecords = allRecords.filter(record => {
      return record.userId === this.data.userInfo.phone;
    });
    
    if (userRecords.length === 0) {
      this.setData({
        aiAnalysis: {
          monthlyTrend: [],
          categoryDistribution: [],
      suggestions: [
            '开始记录您的收支，获取个性化财务建议'
          ],
          abnormalExpenses: []
        }
      });
      return;
    }
    
    // 计算近6个月的消费趋势
    const monthlyTrend = this.calculateMonthlyTrend(userRecords);
    
    // 计算支出分类分布
    const categoryDistribution = this.calculateCategoryDistribution(userRecords);
    
    // 生成智能建议
    const suggestions = this.generateSuggestions(userRecords);
    
    // 检测异常支出
    const abnormalExpenses = this.detectAbnormalExpenses(userRecords);
    
    this.setData({
      aiAnalysis: {
        monthlyTrend,
        categoryDistribution,
        suggestions,
        abnormalExpenses
      }
    });
  },
  
  // 计算月度消费趋势
  calculateMonthlyTrend(records) {
    const now = new Date();
    const result = [];
    
    // 计算近6个月的数据
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
      
      // 筛选当月记录
      const monthRecords = records.filter(record => {
        return record.date.startsWith(yearMonth) && record.type === 'expense';
      });
      
      // 计算总支出
      let expense = 0;
      monthRecords.forEach(record => {
        expense += parseFloat(record.amount);
      });
      
      result.push({
        month: `${month}月`,
        expense: expense.toFixed(2)
      });
    }
    
    return result;
  },
  
  // 计算支出分类分布
  calculateCategoryDistribution(records) {
    const { currentYear, currentMonth } = this.data;
    const yearMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // 筛选当月支出记录
    const expenseRecords = records.filter(record => {
      return record.date.startsWith(yearMonth) && record.type === 'expense';
    });
    
    // 按分类汇总
    const categoryMap = {};
    let totalExpense = 0;
    
    expenseRecords.forEach(record => {
      const amount = parseFloat(record.amount);
      totalExpense += amount;
      
      if (!categoryMap[record.category]) {
        categoryMap[record.category] = 0;
      }
      
      categoryMap[record.category] += amount;
    });
    
    // 转换为数组并计算百分比
    const result = Object.keys(categoryMap).map(category => {
      const amount = categoryMap[category];
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      
      return {
        category,
        amount: amount.toFixed(2),
        percentage
      };
    });
    
    // 按百分比降序排序
    return result.sort((a, b) => b.percentage - a.percentage);
  },
  
  // 生成智能建议
  generateSuggestions(records) {
    const suggestions = [];
    const { currentYear, currentMonth } = this.data;
    
    // 获取当月支出记录
    const yearMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const monthExpenseRecords = records.filter(record => {
      return record.date.startsWith(yearMonth) && record.type === 'expense';
    });
    
    // 计算总支出
    let totalExpense = 0;
    monthExpenseRecords.forEach(record => {
      totalExpense += parseFloat(record.amount);
    });
    
    // 预算相关建议
    if (totalExpense > this.data.monthlyBudget * 0.9) {
      suggestions.push('本月支出已接近预算上限，建议控制消费');
    }
    
    // 分类支出建议
    const categoryMap = {};
    monthExpenseRecords.forEach(record => {
      if (!categoryMap[record.category]) {
        categoryMap[record.category] = 0;
      }
      categoryMap[record.category] += parseFloat(record.amount);
    });
    
    // 找出支出最高的分类
    let maxCategory = '';
    let maxAmount = 0;
    
    Object.keys(categoryMap).forEach(category => {
      if (categoryMap[category] > maxAmount) {
        maxCategory = category;
        maxAmount = categoryMap[category];
      }
    });
    
    if (maxCategory && totalExpense > 0) {
      const percentage = Math.round((maxAmount / totalExpense) * 100);
      if (percentage > 40) {
        suggestions.push(`${maxCategory}支出占比${percentage}%，建议适当控制`);
      }
    }
    
    // 如果没有足够的数据，给出通用建议
    if (suggestions.length === 0) {
      if (records.length < 5) {
        suggestions.push('持续记录您的收支，获取更精准的财务分析');
      } else {
        suggestions.push('您的消费习惯良好，继续保持');
      }
    }
    
    return suggestions;
  },
  
  // 检测异常支出
  detectAbnormalExpenses(records) {
    const { currentYear, currentMonth } = this.data;
    const yearMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // 筛选当月支出记录
    const expenseRecords = records.filter(record => {
      return record.date.startsWith(yearMonth) && record.type === 'expense';
    });
    
    // 按分类计算平均值和标准差
    const categoryStats = {};
    expenseRecords.forEach(record => {
      const { category, amount } = record;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          amounts: [],
          sum: 0,
          count: 0
        };
      }
      
      const parsedAmount = parseFloat(amount);
      categoryStats[category].amounts.push(parsedAmount);
      categoryStats[category].sum += parsedAmount;
      categoryStats[category].count++;
    });
    
    // 计算每个分类的平均值和标准差
    Object.keys(categoryStats).forEach(category => {
      const { amounts, sum, count } = categoryStats[category];
      const mean = sum / count;
      
      let variance = 0;
      amounts.forEach(amount => {
        variance += Math.pow(amount - mean, 2);
      });
      
      const stdDev = Math.sqrt(variance / count);
      
      categoryStats[category].mean = mean;
      categoryStats[category].stdDev = stdDev;
    });
    
    // 检测异常值（超过平均值+2倍标准差的支出）
    const abnormalExpenses = [];
    
    expenseRecords.forEach(record => {
      const { category, amount, date } = record;
      const stats = categoryStats[category];
      
      if (stats && stats.count >= 3) {
        const parsedAmount = parseFloat(amount);
        if (parsedAmount > stats.mean + 2 * stats.stdDev) {
          abnormalExpenses.push({
            date,
            category,
            amount: parsedAmount.toFixed(2),
            reason: `高于${category}平均支出`
          });
        }
      }
    });
    
    // 最多返回3条异常记录
    return abnormalExpenses.slice(0, 3);
  },
});