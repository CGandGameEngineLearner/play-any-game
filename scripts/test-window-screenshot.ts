import * as screenshot from 'window-screenshot';

async function testWindowScreenshot() {
  try {
    // 测试截取所有窗口
    console.log('正在获取所有窗口...');
    const windows = await screenshot.listWindows();
    console.log('找到 ' + windows.length + ' 个窗口:');
    
    windows.forEach((w, index) => {
      console.log(`${index + 1}. 标题: "${w.title}", ID: ${w.id}`);
    });
    
    // 尝试截取第一个窗口
    if (windows.length > 0) {
      console.log('\n正在截取第一个窗口...');
      const result = await screenshot.captureWindow(windows[0].id, 'test.png');
      console.log('截图成功: ' + result);
    }
  } catch (error) {
    console.error('错误:', error);
  }
}

testWindowScreenshot();
