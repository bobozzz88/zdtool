// 创建PNG图标文件
const fs = require('fs');
const path = require('path');

// 位置图标 - 简单的圆形图标
function createLocationIcon(color) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 绘制定位图标
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  // 绘制中心点
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/8, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  return canvas.toDataURL('image/png');
}

// 账本图标 - 简单的钱币图标
function createFinanceIcon(color) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 绘制圆形
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // 绘制¥符号
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¥', size/2, size/2);
  
  return canvas.toDataURL('image/png');
}

// 社区图标 - 简单的人形图标
function createCommunityIcon(color) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 绘制头部
  ctx.beginPath();
  ctx.arc(size/2, size/3, size/6, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  // 绘制身体
  ctx.beginPath();
  ctx.moveTo(size/3, size/2);
  ctx.lineTo(size*2/3, size/2);
  ctx.lineTo(size*2/3, size*3/4);
  ctx.lineTo(size/3, size*3/4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  return canvas.toDataURL('image/png');
}

// 保存图标
function saveBase64ToFile(base64Data, filePath) {
  // 移除data:image/png;base64,前缀
  const base64Image = base64Data.split(';base64,').pop();
  
  // 将base64转换为buffer并写入文件
  const imageBuffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(filePath, imageBuffer);
  
  console.log('已保存图标:', filePath);
}

// 注意：这个脚本需要在浏览器环境中运行，因为它使用了canvas
// 在Node.js环境中，你需要使用node-canvas库
console.log('请注意：这个脚本需要在浏览器环境中运行，因为它使用了canvas');
console.log('在Node.js环境中，你需要使用node-canvas库'); 