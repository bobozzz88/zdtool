Page({
  data: {
    tasks: [
      {
        id: 1,
        title: '买菜',
        status: '未完成',
        deadline: '今天',
        assignee: '妈妈'
      },
      {
        id: 2,
        title: '修理水龙头',
        status: '未完成',
        deadline: '明天',
        assignee: '爸爸'
      }
    ]
  },

  onLoad: function() {
    this.getTasks();
  },

  // 获取任务列表
  getTasks: function() {
    // 这里可以接入真实的后端API
    // 目前使用模拟数据
  },

  // 添加新任务
  addTask: function() {
    wx.navigateTo({
      url: '/pages/task/add/add'
    });
  },

  // 完成任务
  completeTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const tasks = this.data.tasks;
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      task.status = task.status === '未完成' ? '已完成' : '未完成';
      this.setData({ tasks: tasks });
    }
  }
})