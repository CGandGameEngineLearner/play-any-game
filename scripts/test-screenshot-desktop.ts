import * as screenshot from 'screenshot-desktop';
import fs from 'fs';

async function testScreenshotDesktop() {
  try {
    // 测试截取屏幕
    console.log('正在截取屏幕...');
    const buffer = await screenshot();
    console.log('截图成功，大小: ' + buffer.length + ' 字节');
    
    // 保存到文件
    fs.writeFileSync('test.png', buffer);
    console.log('截图已保存到 test.png');
  } catch (error) {
    console.error('错误:', error);
  }
}

testScreenshotDesktop();
