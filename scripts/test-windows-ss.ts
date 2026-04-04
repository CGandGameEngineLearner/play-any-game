import * as ss from 'windows-ss';

async function testWindowsSS() {
  try {
    // 测试截取屏幕
    console.log('正在截取屏幕...');
    const buffer = await ss.captureScreen();
    console.log('截图成功，大小: ' + buffer.length + ' 字节');
    
    // 保存到文件
    const fs = require('fs');
    fs.writeFileSync('test.png', buffer);
    console.log('截图已保存到 test.png');
  } catch (error) {
    console.error('错误:', error);
  }
}

testWindowsSS();
