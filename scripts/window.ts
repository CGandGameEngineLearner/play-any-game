import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Window } from 'node-screenshots';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getRelativePath(absolutePath: string): string {
  const skillDir = path.join(__dirname, '..');
  return path.relative(skillDir, absolutePath);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
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

function findWindowByTitle(windowTitle: string): any {
  const windows = Window.all();
  
  for (const win of windows) {
    try {
      const title = (win as any).title?.() || '';
      if (title.includes(windowTitle)) {
        return win;
      }
    } catch (e) {
    }
  }
  
  return null;
}

export async function captureWindow(windowTitle: string): Promise<string> {
  const timestamp = getTimestamp();
  const sanitizedTitle = sanitizeFileName(windowTitle);
  const filename = 'screenshot_' + sanitizedTitle + '_' + timestamp + '.png';
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const filepath = path.join(screenshotsDir, filename);
  
  try {
    const targetWindow = findWindowByTitle(windowTitle);
    
    if (!targetWindow) {
      throw new Error('未找到窗口: ' + windowTitle);
    }
    
    const image = await targetWindow.captureImage();
    const buffer = await image.toPng();
    fs.writeFileSync(filepath, buffer);
    
    console.log('[window] 窗口截图已保存: ' + filepath);
    return getRelativePath(filepath);
  } catch (err) {
    console.error('[window] 窗口截图失败: ' + (err as Error).message);
    throw err;
  }
}

export interface WindowInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
}

export function getWindowInfo(windowTitle: string): WindowInfo | null {
  const win = findWindowByTitle(windowTitle);
  if (!win) return null;
  
  try {
    const x = (win as any).x();
    const y = (win as any).y();
    const width = (win as any).width();
    const height = (win as any).height();
    const title = (win as any).title?.() || windowTitle;
    
    return { x, y, width, height, title };
  } catch (e) {
    console.error('[window] 获取窗口信息失败:', (e as Error).message);
    return null;
  }
}

export function toScreenCoords(relativeX: number, relativeY: number, windowInfo: WindowInfo): { x: number; y: number } {
  return {
    x: windowInfo.x + relativeX,
    y: windowInfo.y + relativeY
  };
}

export default { captureWindow, getWindowInfo, toScreenCoords };
