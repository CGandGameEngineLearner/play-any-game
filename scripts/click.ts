import { mouse, straightTo, Button } from '@nut-tree-fork/nut-js';

mouse.config.autoDelayMs = 100;
mouse.config.mouseSpeed = 800;

export async function click(x: number, y: number, autoScreenshot: boolean = true, windowTitle?: string): Promise<string | null> {
  console.log('[click] 移动鼠标到目标位置: (' + x + ', ' + y + ')');
  await mouse.move(straightTo({ x, y }));
  
  console.log('[click] 等待 300ms 让用户看到鼠标位置...');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('[click] 执行点击...');
  await mouse.leftClick();

  if (autoScreenshot) {
    const { takeScreenshot } = await import('./screenshot.js');
    console.log('[click] 等待 200ms 后截图...');
    await new Promise(resolve => setTimeout(resolve, 200));
    const screenshotPath = await takeScreenshot(windowTitle);
    return screenshotPath;
  }
  return null;
}

export async function rightClick(x: number, y: number, autoScreenshot: boolean = true, windowTitle?: string): Promise<string | null> {
  console.log('[click] 右键点击: (' + x + ', ' + y + ')');
  await mouse.move(straightTo({ x, y }));
  await new Promise(resolve => setTimeout(resolve, 300));
  await mouse.rightClick();

  if (autoScreenshot) {
    const { takeScreenshot } = await import('./screenshot.js');
    await new Promise(resolve => setTimeout(resolve, 200));
    const screenshotPath = await takeScreenshot(windowTitle);
    return screenshotPath;
  }
  return null;
}

export async function moveMouse(x: number, y: number): Promise<void> {
  console.log('[click] 移动鼠标: (' + x + ', ' + y + ')');
  await mouse.move(straightTo({ x, y }));
}

export default { click, rightClick, moveMouse };
