import { takeScreenshot } from './screenshot.js';
import { captureWindow, getWindowInfo, toScreenCoords } from './window.js';
import { click } from './click.js';
import { findButton, findAllButtons } from './find-button.js';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CommandArgs {
  _: string[];
}

interface ScreenshotResult {
  action: string;
  windowTitle: string | null;
  screenshotPath: string;
  timestamp: string;
}

interface ClickResult {
  action: string;
  x: number;
  y: number;
  screenshotPath: string | null;
  timestamp: string;
}

interface CaptureResult {
  action: string;
  windowTitle: string;
  screenshotPath: string;
  timestamp: string;
}

interface ButtonMatch {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

const COMMANDS = {
  screenshot: 'screenshot',
  capture: 'capture',
  click: 'click',
  find: 'find',
  findAll: 'find-all',
  help: 'help',
};

function printHelp(): void {
  console.log(`
🎮 AI 游戏代肝工具 - CLI

用法:
  npx tsx scripts/index.ts <command> [args]

命令:
  screenshot [窗口标题]
    截取屏幕截图。
    如果指定窗口标题，则截取指定窗口；否则截取主屏幕。
    返回截图文件路径。

  capture <窗口标题>
    截取指定窗口的截图。
    返回截图文件路径。

  click <x> <y> [窗口标题]
    在指定坐标点击。
    如果提供了窗口标题，则 x, y 是相对于窗口的坐标。
    点击后 0.2 秒自动截取新截图并返回路径。

  find <按钮名称> [截图路径]
    在截图中查找按钮位置。
    返回匹配区域的中心坐标 {x, y}。

  find-all <按钮名称> [截图路径]
    查找所有匹配的按钮位置。

示例:
  npx tsx scripts/index.ts screenshot
  npx tsx scripts/index.ts capture "原神"
  npx tsx scripts/index.ts click 540 820 "原神"  # 相对于原神窗口的坐标
  npx tsx scripts/index.ts click 1600 50              # 屏幕绝对坐标
  npx tsx scripts/index.ts find "开始挑战" screenshots/screenshot_20260403.png
`);
}

function getLatestScreenshot(): string | null {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    return null;
  }

  const files = fs.readdirSync(screenshotsDir)
    .filter(f => f.startsWith('screenshot_') && f.endsWith('.png'))
    .map(f => ({
      name: f,
      path: path.join(screenshotsDir, f),
      mtime: fs.statSync(path.join(screenshotsDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files.length > 0 ? files[0].path : null;
}

async function handleScreenshot(args: CommandArgs): Promise<string> {
  const windowTitle = args._.length > 1 ? args._[1] : undefined;
  console.log('[CLI] 执行 screenshot' + (windowTitle ? ' (窗口: ' + windowTitle + ')' : ''));
  
  const screenshotPath = await takeScreenshot(windowTitle);
  
  const result: ScreenshotResult = {
    action: 'screenshot',
    windowTitle: windowTitle || null,
    screenshotPath: screenshotPath,
    timestamp: new Date().toISOString()
  };
  console.log('\n========================================');
  console.log('📸 图片路径: ' + screenshotPath);
  console.log('========================================\n');
  console.log(JSON.stringify(result, null, 2));
  
  return screenshotPath;
}

async function handleCapture(args: CommandArgs): Promise<string> {
  const windowTitle = args._[1];
  if (!windowTitle) {
    console.error('[ERROR] 请指定窗口标题');
    console.log('用法: npx tsx scripts/index.ts capture <窗口标题>');
    process.exit(1);
  }
  
  console.log('[CLI] 执行 capture (窗口: ' + windowTitle + ')');
  
  const screenshotPath = await captureWindow(windowTitle);
  
  const result: CaptureResult = {
    action: 'capture',
    windowTitle: windowTitle,
    screenshotPath: screenshotPath,
    timestamp: new Date().toISOString()
  };
  console.log('\n========================================');
  console.log('📸 图片路径: ' + screenshotPath);
  console.log('========================================\n');
  console.log(JSON.stringify(result, null, 2));
  
  return screenshotPath;
}

async function handleClick(args: CommandArgs): Promise<string | null> {
  const x = parseInt(args._[1]);
  const y = parseInt(args._[2]);
  const windowTitle = args._[3];
  
  if (isNaN(x) || isNaN(y)) {
    console.error('[ERROR] 请提供有效的坐标');
    console.log('用法: npx tsx scripts/index.ts click <x> <y> [窗口标题]');
    process.exit(1);
  }
  
  let finalX = x;
  let finalY = y;
  
  if (windowTitle) {
    console.log('[CLI] 获取窗口信息: ' + windowTitle);
    const winInfo = getWindowInfo(windowTitle);
    if (!winInfo) {
      console.error('[ERROR] 未找到窗口: ' + windowTitle);
      process.exit(1);
    }
    
    console.log('[CLI] 窗口位置: (' + winInfo.x + ', ' + winInfo.y + ')');
    console.log('[CLI] 窗口大小: ' + winInfo.width + 'x' + winInfo.height);
    
    const screenCoords = toScreenCoords(x, y, winInfo);
    finalX = screenCoords.x;
    finalY = screenCoords.y;
    console.log('[CLI] 相对坐标 (' + x + ', ' + y + ') -> 屏幕坐标 (' + finalX + ', ' + finalY + ')');
  } else {
    console.log('[CLI] 执行 click (屏幕坐标: ' + finalX + ', ' + finalY + ')');
  }
  
  const newScreenshotPath = await click(finalX, finalY, true, windowTitle);
  
  const result: ClickResult = {
    action: 'click',
    x: finalX,
    y: finalY,
    screenshotPath: newScreenshotPath,
    timestamp: new Date().toISOString()
  };
  if (newScreenshotPath) {
    console.log('\n========================================');
    console.log('📸 点击后截图路径: ' + newScreenshotPath);
    console.log('========================================\n');
  }
  console.log(JSON.stringify(result, null, 2));
  
  return newScreenshotPath;
}

async function handleFind(args: CommandArgs): Promise<ButtonMatch | null> {
  const buttonName = args._[1];
  let screenshotPath = args._[2] || getLatestScreenshot();
  
  if (!buttonName) {
    console.error('[ERROR] 请提供按钮名称');
    console.log('用法: npx tsx scripts/index.ts find <按钮名称> [截图路径]');
    process.exit(1);
  }
  
  if (!screenshotPath) {
    console.error('[ERROR] 未找到截图文件，请先执行 screenshot 或 capture 命令');
    process.exit(1);
  }
  
  console.log(`[CLI] 执行 find ("${buttonName}", "${screenshotPath}")`);
  
  const result = await findButton(screenshotPath, buttonName);
  
  if (result) {
    console.log(`[OK] 找到按钮: x=${result.x}, y=${result.y}, 置信度=${(result.confidence * 100).toFixed(1)}%`);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('[WARN] 未找到匹配按钮');
    console.log('null');
  }
  
  return result;
}

async function handleFindAll(args: CommandArgs): Promise<ButtonMatch[]> {
  const buttonName = args._[1];
  let screenshotPath = args._[2] || getLatestScreenshot();
  
  if (!buttonName) {
    console.error('[ERROR] 请提供按钮名称');
    console.log('用法: npx tsx scripts/index.ts find-all <按钮名称> [截图路径]');
    process.exit(1);
  }
  
  if (!screenshotPath) {
    console.error('[ERROR] 未找到截图文件，请先执行 screenshot 或 capture 命令');
    process.exit(1);
  }
  
  console.log(`[CLI] 执行 find-all ("${buttonName}", "${screenshotPath}")`);
  
  const results = await findAllButtons(screenshotPath, buttonName);
  
  console.log(`[OK] 找到 ${results.length} 个匹配区域:`);
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] x=${r.x}, y=${r.y}, 置信度=${(r.confidence * 100).toFixed(1)}%`);
  });
  
  return results;
}

async function main(): Promise<void> {
  const args = minimist(process.argv.slice(2)) as CommandArgs;
  const command = args._[0];

  console.log(`[CLI] 游戏代肝工具启动，命令: ${command || '(无)'}`);

  try {
    switch (command) {
      case COMMANDS.screenshot:
        await handleScreenshot(args);
        break;

      case COMMANDS.capture:
        await handleCapture(args);
        break;

      case COMMANDS.click:
        await handleClick(args);
        break;

      case COMMANDS.find:
        await handleFind(args);
        break;

      case COMMANDS.findAll:
      case 'find-all':
        await handleFindAll(args);
        break;

      case COMMANDS.help:
      case undefined:
        printHelp();
        break;

      default:
        console.error(`[ERROR] 未知命令: ${command}`);
        console.log('运行 "npx tsx scripts/index.ts help" 查看帮助');
        process.exit(1);
    }
  } catch (err) {
    console.error(`[ERROR] 执行失败: ${(err as Error).message}`);
    console.error((err as Error).stack);
    process.exit(1);
  }
}

main();
