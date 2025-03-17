Page({
  data: {
    title: '',
    assignee: '',
    deadline: ''
  },

  onTitleInput: function(e) {
    this.setData({
      title: e.detail.value
    });
  },

  onAssigneeInput: function(e) {
    this.setData({
      assignee: e.detail.value
    });
  },

  onDateChange: function(e) {
    this.setData({
      deadline: e.detail.value
    });
  },

  submitTask: function() {
    const { title, assignee, deadline } = this.data;
    
    if (!title || !assignee || !deadline) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 创建新任务对象
    const newTask = {
      id: Date.now(),
      title,
      assignee,
      deadline,
      status: '未完成'
    };

    // 获取页面栈
    const pages = getCurrentPages();
    const taskPage = pages[pages.length - 2];
    
    // 更新任务列表
    const tasks = taskPage.data.tasks;
    tasks.push(newTask);
    taskPage.setData({
      tasks: tasks
    });

    // 返回任务列表页
    wx.navigateBack();

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  }
})