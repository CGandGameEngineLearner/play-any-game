/**
 * click.js - 鼠标点击功能
 * 
 * 使用 PowerShell 模拟鼠标点击（Windows 平台）。
 * 支持绝对坐标点击，点击后 0.2 秒自动截图。
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 使用 PowerShell 模拟鼠标点击
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @returns {Promise<void>}
 */
async function performClickWithPowerShell(x, y) {
    // 使用 [System.Windows.Forms.Cursor]::Position 和 [System.Windows.Forms.Mouse_event]
    const psScript = [
        'Add-Type -AssemblyName System.Windows.Forms',
        '',
        '[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(' + x + ', ' + y + ')',
        '[System.Windows.Forms.Mouse_event]::PerformClick([System.Windows.Forms.MouseButtons]::Left, ' + x + ', ' + y + ', 0, 0)',
        '',
        'Write-Output \'OK\''
    ].join('\r\n');

    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, 'click_' + Date.now() + '.ps1');
    fs.writeFileSync(scriptPath, psScript, { encoding: 'utf8' });

    try {
        const { stdout } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        
        if (stdout.includes('OK')) {
            console.log('[click] 点击成功: (' + x + ', ' + y + ')');
            return;
        }
        throw new Error('PowerShell 点击失败: ' + stdout);
    } catch (err) {
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        throw err;
    }
}

/**
 * 点击指定坐标，点击后 0.2 秒自动截取新截图
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {boolean} autoScreenshot - 是否自动截图，默认 true
 * @returns {Promise<string|null>} 如果 autoScreenshot 为 true，返回新截图路径；否则返回 null
 */
export async function click(x, y, autoScreenshot = true) {
    await performClickWithPowerShell(x, y);

    if (autoScreenshot) {
        // 延迟导入以避免循环依赖
        const { takeScreenshot } = await import('./screenshot.js');
        // 等待 0.2 秒后自动截图
        await new Promise(resolve => setTimeout(resolve, 200));
        const screenshotPath = await takeScreenshot();
        return screenshotPath;
    }
    return null;
}

/**
 * 移动鼠标到指定位置（不点击）
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @returns {Promise<void>}
 */
export async function moveMouse(x, y) {
    const psScript = [
        'Add-Type -AssemblyName System.Windows.Forms',
        '[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(' + x + ', ' + y + ')',
        'Write-Output \'OK\''
    ].join('\r\n');

    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, 'move_mouse_' + Date.now() + '.ps1');
    fs.writeFileSync(scriptPath, psScript, { encoding: 'utf8' });

    try {
        await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        console.log('[click] 鼠标移动到: (' + x + ', ' + y + ')');
    } catch (err) {
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        throw new Error('鼠标移动失败: ' + err.message);
    }
}

/**
 * 右键点击
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @returns {Promise<void>}
 */
export async function rightClick(x, y) {
    const psScript = [
        'Add-Type -AssemblyName System.Windows.Forms',
        '',
        '$mouse_event = [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") | Out-Null',
        '$oldPos = [System.Windows.Forms.Cursor]::Position',
        '[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(' + x + ', ' + y + ')',
        '[System.Windows.Forms.Mouse_event]::MouseEvent([System.Windows.Forms.MouseButtons]::Right, 0, 0, 0, 0)',
        'Start-Sleep -Milliseconds 50',
        '[System.Windows.Forms.Cursor]::Position = $oldPos',
        '',
        'Write-Output \'OK\''
    ].join('\r\n');

    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, 'right_click_' + Date.now() + '.ps1');
    fs.writeFileSync(scriptPath, psScript, { encoding: 'utf8' });

    try {
        const { stdout } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"');
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        
        if (stdout.includes('OK')) {
            console.log('[click] 右键点击成功: (' + x + ', ' + y + ')');
            return;
        }
        throw new Error('PowerShell 右键点击失败: ' + stdout);
    } catch (err) {
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
        throw err;
    }
}

export default { click, moveMouse, rightClick };
