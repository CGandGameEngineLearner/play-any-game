import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);



async function performClickWithPowerShell(x: number, y: number): Promise<void> {
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
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    
    if (stdout.includes('OK')) {
      console.log('[click] 点击成功: (' + x + ', ' + y + ')');
      return;
    }
    throw new Error('PowerShell 点击失败: ' + stdout);
  } catch (err) {
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    throw err;
  }
}

export async function click(x: number, y: number, autoScreenshot: boolean = true): Promise<string | null> {
  await performClickWithPowerShell(x, y);

  if (autoScreenshot) {
    const { takeScreenshot } = await import('./screenshot.js');
    await new Promise(resolve => setTimeout(resolve, 200));
    const screenshotPath = await takeScreenshot();
    return screenshotPath;
  }
  return null;
}

export async function moveMouse(x: number, y: number): Promise<void> {
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
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    console.log('[click] 鼠标移动到: (' + x + ', ' + y + ')');
  } catch (err) {
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    throw new Error('鼠标移动失败: ' + (err as Error).message);
  }
}

export async function rightClick(x: number, y: number): Promise<void> {
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
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    
    if (stdout.includes('OK')) {
      console.log('[click] 右键点击成功: (' + x + ', ' + y + ')');
      return;
    }
    throw new Error('PowerShell 右键点击失败: ' + stdout);
  } catch (err) {
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    throw err;
  }
}

export default { click, moveMouse, rightClick };
