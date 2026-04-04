import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getRelativePath(absolutePath: string): string {
  const skillDir = path.join(__dirname, '..');
  return path.relative(skillDir, absolutePath);
}

async function captureWindowWithPowerShell(windowTitle: string, filepath: string): Promise<string> {
  const psScript = `
Add-Type -TypeDefinition @' 
using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.IO;
using System.Diagnostics;

public class WindowCapture {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleDC(IntPtr hdc);
    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleBitmap(IntPtr hdc, int nWidth, int nHeight);
    [DllImport("gdi32.dll")]
    public static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);
    [DllImport("gdi32.dll")]
    public static extern bool BitBlt(IntPtr hdcDest, int xDest, int yDest, int wDest, int hDest, IntPtr hdcSrc, int xSrc, int ySrc, int rop);
    [DllImport("gdi32.dll")]
    public static extern bool DeleteDC(IntPtr hdc);
    [DllImport("gdi32.dll")]
    public static extern bool DeleteObject(IntPtr hObject);
    
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    public const int SRCCOPY = 0x00CC0020;
    
    public static byte[] CaptureWindow(IntPtr hWnd) {
        RECT rect;
        GetWindowRect(hWnd, out rect);
        int width = rect.Right - rect.Left;
        int height = rect.Bottom - rect.Top;
        
        IntPtr hdcWindow = GetDC(hWnd);
        IntPtr hdcMem = CreateCompatibleDC(hdcWindow);
        IntPtr hBitmap = CreateCompatibleBitmap(hdcWindow, width, height);
        IntPtr hOld = SelectObject(hdcMem, hBitmap);
        
        BitBlt(hdcMem, 0, 0, width, height, hdcWindow, 0, 0, SRCCOPY);
        
        SelectObject(hdcMem, hOld);
        
        Bitmap bmp = Bitmap.FromHbitmap(hBitmap);
        
        using (MemoryStream ms = new MemoryStream()) {
            bmp.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            DeleteObject(hBitmap);
            DeleteDC(hdcMem);
            ReleaseDC(hWnd, hdcWindow);
            bmp.Dispose();
            return ms.ToArray();
        }
    }
    
    public static IntPtr FindWindowByTitle(string title) {
        var processes = Process.GetProcesses();
        foreach (var p in processes) {
            try {
                if (!string.IsNullOrEmpty(p.MainWindowTitle) && p.MainWindowTitle.Contains(title)) {
                    return p.MainWindowHandle;
                }
            } catch { }
        }
        return IntPtr.Zero;
    }
}
'@ -ReferencedAssemblies System.Drawing.dll

$target = $args[0]
$hWnd = [WindowCapture]::FindWindowByTitle($target)

if ($hWnd -eq [IntPtr]::Zero) {
    Write-Error "Window not found: $target"
    exit 1
}

$bytes = [WindowCapture]::CaptureWindow($hWnd)
[Convert]::ToBase64String($bytes)
`;

  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, 'window_capture_' + Date.now() + '.ps1');
  
  // 使用 UTF-8 BOM 编码
  const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  const scriptContent = Buffer.from(psScript, 'utf8');
  const scriptWithBOM = Buffer.concat([BOM, scriptContent]);
  fs.writeFileSync(scriptPath, scriptWithBOM);

  try {
    // 增加 maxBuffer 到 50MB
    const { stdout, stderr } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '" "' + windowTitle + '"', {
      maxBuffer: 50 * 1024 * 1024
    });
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    
    if (stderr && stderr.includes('Error')) {
      throw new Error('窗口截图失败: ' + stderr);
    }
    
    const base64 = stdout.trim();
    if (!base64) {
      throw new Error('窗口截图失败: 未获取到截图数据');
    }
    
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    console.log('[window] 窗口截图已保存: ' + filepath);
    return filepath;
  } catch (err) {
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    throw err;
  }
}

export async function captureWindow(windowTitle: string): Promise<string> {
  const timestamp = new Date();
  const ts = timestamp.getFullYear() +
    String(timestamp.getMonth() + 1).padStart(2, '0') +
    String(timestamp.getDate()).padStart(2, '0') + '_' +
    String(timestamp.getHours()).padStart(2, '0') +
    String(timestamp.getMinutes()).padStart(2, '0') +
    String(timestamp.getSeconds()).padStart(2, '0') + '_' +
    String(timestamp.getMilliseconds()).padStart(3, '0');
  const filename = 'screenshot_' + ts + '.png';
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const filepath = path.join(screenshotsDir, filename);
  
  try {
    const resultPath = await captureWindowWithPowerShell(windowTitle, filepath);
    return getRelativePath(resultPath);
  } catch (err) {
    console.error('[window] 窗口截图失败: ' + (err as Error).message);
    throw err;
  }
}

export default { captureWindow };
