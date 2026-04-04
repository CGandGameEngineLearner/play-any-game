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
                if (!string.IsNullOrEmpty(p.MainWindowTitle)) {
                    Console.WriteLine("Found window: " + p.MainWindowTitle + " (Process: " + p.ProcessName + ")");
                    if (p.MainWindowTitle.Contains(title)) {
                        Console.WriteLine("Matched!");
                        return p.MainWindowHandle;
                    }
                }
            } catch { }
        }
        return IntPtr.Zero;
    }
}
'@ -ReferencedAssemblies System.Drawing.dll

$target = "原神"
Write-Host "Searching for window: $target"
$hWnd = [WindowCapture]::FindWindowByTitle($target)

if ($hWnd -eq [IntPtr]::Zero) {
    Write-Error "找不到窗口: $target"
    exit 1
}

Write-Host "Found window handle: $hWnd"
$bytes = [WindowCapture]::CaptureWindow($hWnd)
[Convert]::ToBase64String($bytes)
