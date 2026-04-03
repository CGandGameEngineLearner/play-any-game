/**
 * screenshot.js - 截图核心功能
 * 
 * 使用 PowerShell + Windows API 截取屏幕。
 * 截图保存到 screenshots/ 目录，文件名格式：screenshot_YYYYMMDD_HHmmss_SSS.png
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// screenshots 目录路径
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * 确保 screenshots 目录存在
 */
function ensureScreenshotsDir() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
}

/**
 * 生成带毫秒的时间戳字符串
 * @returns {string} 格式：YYYYMMDD_HHmmss_SSS
 */
function getTimestamp() {
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

/**
 * 使用 PowerShell 截取屏幕（通过临时脚本文件）
 * @param {string} filepath - 保存路径
 * @returns {Promise<string>} 截图文件路径
 */
async function takeScreenshotWithPowerShell(filepath) {
    // PowerShell 脚本，使用 $ 开头（不用转义，因为在文件里）
    const psScript = [
        'Add-Type -AssemblyName System.Windows.Forms',
        'Add-Type -AssemblyName System.Drawing',
        '',
        '$screen = [System.Windows.Forms.Screen]::PrimaryScreen',
        '$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)',
        '$graphics = [System.Drawing.Graphics]::FromImage($bitmap)',
        '$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)',
        '',
        "$bitmap.Save('" + filepath.replace(/\\/g, '\\\\').replace(/'/g, "''") + "', [System.Drawing.Imaging.ImageFormat]::Png)",
        '$graphics.Dispose()',
        '$bitmap.Dispose()',
        '',
        'Write-Output \'OK\''
    ].join('\n');

    // 写入临时脚本文件
    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, 'screenshot_' + Date.now() + '.ps1');
    fs.writeFileSync(scriptPath, psScript, { encoding: 'utf8' });

    try {
        const { stdout } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        
        if (stdout.includes('OK')) {
            console.log('[screenshot] 截图已保存: ' + filepath);
            return filepath;
        }
        throw new Error('PowerShell 截图失败: ' + stdout);
    } catch (err) {
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        throw err;
    }
}

/**
 * 截取屏幕截图
 * @param {string} [windowTitle] - 可选，指定窗口标题。如果不指定则截取主屏幕。
 * @returns {Promise<string>} 截图文件路径
 */
export async function takeScreenshot(windowTitle) {
    ensureScreenshotsDir();

    const timestamp = getTimestamp();
    const filename = 'screenshot_' + timestamp + '.png';
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    try {
        // 直接使用 PowerShell 截图（更可靠）
        return await takeScreenshotWithPowerShell(filepath);
    } catch (err) {
        console.error('[screenshot] 截图失败: ' + err.message);
        throw err;
    }
}

export default { takeScreenshot };
