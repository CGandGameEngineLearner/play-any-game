/**
 * index.js - 统一入口，CLI 主文件
 * 
 * AI 游戏代肝工具的 CLI 界面。
 * 支持的命令：
 *   - screenshot [窗口标题]  : 截取屏幕
 *   - capture <窗口标题>    : 截取指定窗口
 *   - click <x> <y>         : 点击坐标（点击后 0.2s 自动截图）
 *   - find <按钮名称> [截图路径] : 查找按钮位置
 * 
 * 使用方式：
 *   npx tsx scripts/index.ts screenshot
 *   npx tsx scripts/index.ts capture "游戏窗口"
 *   npx tsx scripts/index.ts click 540 820
 *   npx tsx scripts/index.ts find "开始挑战"
 */

import { takeScreenshot } from './screenshot.js';
import { captureWindow } from './window.js';
import { click } from './click.js';
import { findButton, findAllButtons } from './find-button.js';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 命令列表
const COMMANDS = {
    screenshot: 'screenshot',
    capture: 'capture',
    click: 'click',
    find: 'find',
    findAll: 'find-all',
    help: 'help',
};

/**
 * 打印帮助信息
 */
function printHelp() {
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

  click <x> <y>
    在指定坐标点击。
    点击后 0.2 秒自动截取新截图并返回路径。

  find <按钮名称> [截图路径]
    在截图中查找按钮位置。
    返回匹配区域的中心坐标 {x, y}。

  find-all <按钮名称> [截图路径]
    查找所有匹配的按钮位置。

示例:
  npx tsx scripts/index.ts screenshot
  npx tsx scripts/index.ts capture "原神"
  npx tsx scripts/index.ts click 540 820
  npx tsx scripts/index.ts find "开始挑战" screenshots/screenshot_20260403.png
`);
}

/**
 * 获取最新截图文件路径
 * @returns {string|null}
 */
function getLatestScreenshot() {
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

/**
 * 处理 screenshot 命令
 */
async function handleScreenshot(args) {
    const windowTitle = args._.length > 1 ? args._[1] : undefined;
    console.log('[CLI] 执行 screenshot' + (windowTitle ? ' (窗口: ' + windowTitle + ')' : ''));
    
    const screenshotPath = await takeScreenshot(windowTitle);
    console.log(`[OK] ${screenshotPath}`);
    return screenshotPath;
}

/**
 * 处理 capture 命令
 */
async function handleCapture(args) {
    const windowTitle = args._[1];
    if (!windowTitle) {
        console.error('[ERROR] 请指定窗口标题');
        console.log('用法: npx tsx scripts/index.ts capture <窗口标题>');
        process.exit(1);
    }
    
    console.log('[CLI] 执行 capture (窗口: ' + windowTitle + ')');
    
    // captureWindow 返回 Buffer，需要保存到文件
    const buffer = await captureWindow(windowTitle);
    
    // 保存到 screenshots 目录
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_${String(now.getMilliseconds()).padStart(3, '0')}`;
    const filename = `screenshot_${timestamp}.png`;
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const filepath = path.join(screenshotsDir, filename);
    fs.writeFileSync(filepath, buffer);
    
    console.log(`[OK] ${filepath}`);
    return filepath;
}

/**
 * 处理 click 命令
 */
async function handleClick(args) {
    const x = parseInt(args._[1]);
    const y = parseInt(args._[2]);
    
    if (isNaN(x) || isNaN(y)) {
        console.error('[ERROR] 请提供有效的坐标');
        console.log('用法: npx tsx scripts/index.ts click <x> <y>');
        process.exit(1);
    }
    
    console.log('[CLI] 执行 click (' + x + ', ' + y + ')');
    
    // 点击后自动截图
    const newScreenshotPath = await click(x, y, true);
    
    if (newScreenshotPath) {
        console.log(`[OK] 点击完成，新截图: ${newScreenshotPath}`);
    } else {
        console.log('[OK] 点击完成');
    }
    
    return newScreenshotPath;
}

/**
 * 处理 find 命令
 */
async function handleFind(args) {
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
        // 输出 JSON 格式，方便 AI 解析
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('[WARN] 未找到匹配按钮');
        console.log('null');
    }
    
    return result;
}

/**
 * 处理 find-all 命令
 */
async function handleFindAll(args) {
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

/**
 * 主函数
 */
async function main() {
    const args = minimist(process.argv.slice(2));
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
        console.error(`[ERROR] 执行失败: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }
}

// 执行主函数
main();
