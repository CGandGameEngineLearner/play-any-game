import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Monitor } from 'node-screenshots';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR: string = path.join(__dirname, '..', 'screenshots');

function ensureScreenshotsDir(): void {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}_${ms}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

async function takeScreenshotWithNodeScreenshots(filepath: string): Promise<string> {
  try {
    // 截取主屏幕
    const monitors = Monitor.all();
    if (monitors.length === 0) {
      throw new Error('未找到可用的显示器');
    }
    
    const image = await monitors[0].captureImage();
    
    // 将图片转换为Buffer并保存到文件
    const buffer = await image.toPng();
    fs.writeFileSync(filepath, buffer);
    
    console.log('[screenshot] 截图已保存: ' + filepath);
    return filepath;
  } catch (err) {
    throw new Error('node-screenshots截图失败: ' + (err as Error).message);
  }
}

function getRelativePath(absolutePath: string): string {
  const skillDir = path.join(__dirname, '..');
  return path.relative(skillDir, absolutePath);
}

export async function takeScreenshot(windowTitle?: string): Promise<string> {
  ensureScreenshotsDir();

  const timestamp = getTimestamp();
  let filename = 'screenshot_' + timestamp + '.png';
  
  if (windowTitle) {
    const sanitizedTitle = sanitizeFileName(windowTitle);
    filename = 'screenshot_' + sanitizedTitle + '_' + timestamp + '.png';
  }
  
  const filepath = path.join(SCREENSHOTS_DIR, filename);

  try {
    const resultPath = await takeScreenshotWithNodeScreenshots(filepath);
    return getRelativePath(resultPath);
  } catch (err) {
    console.error('[screenshot] 截图失败: ' + (err as Error).message);
    throw err;
  }
}

export default { takeScreenshot };
