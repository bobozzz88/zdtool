// 图标工具函数
const fs = require('fs');
const path = require('path');

// 导入图标
const icons = require('../images/tabbar_new/index.js');

// 将base64图标保存为文件
function saveIconsToFiles() {
  const iconDir = path.join(__dirname, '../images/tabbar');
  
  // 确保目录存在
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  
  // 保存位置图标
  saveBase64ToFile(icons.locationIcon, path.join(iconDir, 'location.png'));
  saveBase64ToFile(icons.locationSelectedIcon, path.join(iconDir, 'location_selected.png'));
  
  // 保存账本图标
  saveBase64ToFile(icons.financeIcon, path.join(iconDir, 'finance.png'));
  saveBase64ToFile(icons.financeSelectedIcon, path.join(iconDir, 'finance_selected.png'));
  
  // 保存社区图标
  saveBase64ToFile(icons.communityIcon, path.join(iconDir, 'community.png'));
  saveBase64ToFile(icons.communitySelectedIcon, path.join(iconDir, 'community_selected.png'));
  
  console.log('所有图标已保存到', iconDir);
}

// 将base64图标保存为文件
function saveBase64ToFile(base64Data, filePath) {
  // 移除data:image/png;base64,前缀
  const base64Image = base64Data.split(';base64,').pop();
  
  // 将base64转换为buffer并写入文件
  const imageBuffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(filePath, imageBuffer);
  
  console.log('已保存图标:', filePath);
}

// 执行保存
saveIconsToFiles();

module.exports = {
  saveIconsToFiles
}; 