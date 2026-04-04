import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

async function performClickWithPowerShell(x: number, y: number): Promise<void> {
  const psScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class MouseInput {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT {
        public uint type;
        public InputUnion u;
    }
    
    [StructLayout(LayoutKind.Explicit)]
    public struct InputUnion {
        [FieldOffset(0)] public MOUSEINPUT mi;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }
    
    public const int INPUT_MOUSE = 0;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    
    public static void Click(int x, int y) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(50);
        
        INPUT[] inputs = new INPUT[2];
        
        inputs[0].type = INPUT_MOUSE;
        inputs[0].u.mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
        
        inputs[1].type = INPUT_MOUSE;
        inputs[1].u.mi.dwFlags = MOUSEEVENTF_LEFTUP;
        
        SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
    }
    
    public static void RightClick(int x, int y) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(50);
        
        INPUT[] inputs = new INPUT[2];
        
        inputs[0].type = INPUT_MOUSE;
        inputs[0].u.mi.dwFlags = MOUSEEVENTF_RIGHTDOWN;
        
        inputs[1].type = INPUT_MOUSE;
        inputs[1].u.mi.dwFlags = MOUSEEVENTF_RIGHTUP;
        
        SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
    }
    
    public static void MoveMouse(int x, int y) {
        SetCursorPos(x, y);
    }
}
'@

[MouseInput]::Click($args[0], $args[1])
Write-Output 'OK'
`;

  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, 'click_' + Date.now() + '.ps1');
  
  const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  const scriptContent = Buffer.from(psScript, 'utf8');
  const scriptWithBOM = Buffer.concat([BOM, scriptContent]);
  fs.writeFileSync(scriptPath, scriptWithBOM);

  try {
    const { stdout } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '" ' + x + ' ' + y);
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

export async function click(x: number, y: number, autoScreenshot: boolean = true, windowTitle?: string): Promise<string | null> {
  console.log('[click] 移动鼠标到目标位置: (' + x + ', ' + y + ')');
  await moveMouse(x, y);
  
  console.log('[click] 等待 300ms 让用户看到鼠标位置...');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('[click] 执行点击...');
  await performClickWithPowerShell(x, y);

  if (autoScreenshot) {
    const { takeScreenshot } = await import('./screenshot.js');
    console.log('[click] 等待 200ms 后截图...');
    await new Promise(resolve => setTimeout(resolve, 200));
    const screenshotPath = await takeScreenshot(windowTitle);
    return screenshotPath;
  }
  return null;
}

export async function moveMouse(x: number, y: number): Promise<void> {
  const psScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class MouseMove {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
}
'@

[MouseMove]::SetCursorPos($args[0], $args[1])
Write-Output 'OK'
`;

  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, 'move_mouse_' + Date.now() + '.ps1');
  
  const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  const scriptContent = Buffer.from(psScript, 'utf8');
  const scriptWithBOM = Buffer.concat([BOM, scriptContent]);
  fs.writeFileSync(scriptPath, scriptWithBOM);

  try {
    await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '" ' + x + ' ' + y);
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    console.log('[click] 鼠标移动到: (' + x + ', ' + y + ')');
  } catch (err) {
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    throw new Error('鼠标移动失败: ' + (err as Error).message);
  }
}

export async function rightClick(x: number, y: number): Promise<void> {
  const psScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class MouseRightClick {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT {
        public uint type;
        public InputUnion u;
    }
    
    [StructLayout(LayoutKind.Explicit)]
    public struct InputUnion {
        [FieldOffset(0)] public MOUSEINPUT mi;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }
    
    public const int INPUT_MOUSE = 0;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    
    public static void RightClick(int x, int y) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(50);
        
        INPUT[] inputs = new INPUT[2];
        
        inputs[0].type = INPUT_MOUSE;
        inputs[0].u.mi.dwFlags = MOUSEEVENTF_RIGHTDOWN;
        
        inputs[1].type = INPUT_MOUSE;
        inputs[1].u.mi.dwFlags = MOUSEEVENTF_RIGHTUP;
        
        SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
    }
}
'@

[MouseRightClick]::RightClick($args[0], $args[1])
Write-Output 'OK'
`;

  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, 'right_click_' + Date.now() + '.ps1');
  
  const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  const scriptContent = Buffer.from(psScript, 'utf8');
  const scriptWithBOM = Buffer.concat([BOM, scriptContent]);
  fs.writeFileSync(scriptPath, scriptWithBOM);

  try {
    const { stdout } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '" ' + x + ' ' + y);
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
