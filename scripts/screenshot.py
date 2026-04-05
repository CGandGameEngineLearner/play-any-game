import os
import time
from datetime import datetime
from typing import Optional
import win32gui
import win32ui
import win32con
from PIL import Image

SCREENSHOTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'screenshots')

def ensure_screenshots_dir():
    """确保截图目录存在"""
    if not os.path.exists(SCREENSHOTS_DIR):
        os.makedirs(SCREENSHOTS_DIR)

def get_timestamp() -> str:
    """获取时间戳字符串"""
    now = datetime.now()
    return now.strftime('%Y%m%d_%H%M%S_%f')[:-3]

def sanitize_filename(name: str) -> str:
    """清理文件名"""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '_')
    return name.replace(' ', '_')

def capture_screen() -> Image.Image:
    """截取全屏"""
    hwnd = win32gui.GetDesktopWindow()
    left, top, right, bottom = win32gui.GetWindowRect(hwnd)
    width = right - left
    height = bottom - top
    
    hdesktop = win32gui.GetDesktopWindow()
    hwndDC = win32gui.GetWindowDC(hdesktop)
    mfcDC = win32ui.CreateDCFromHandle(hwndDC)
    saveDC = mfcDC.CreateCompatibleDC()
    
    saveBitMap = win32ui.CreateBitmap()
    saveBitMap.CreateCompatibleBitmap(mfcDC, width, height)
    saveDC.SelectObject(saveBitMap)
    
    result = saveDC.BitBlt((0, 0), (width, height), mfcDC, (0, 0), win32con.SRCCOPY)
    
    bmpinfo = saveBitMap.GetInfo()
    bmpstr = saveBitMap.GetBitmapBits(True)
    
    img = Image.frombuffer(
        'RGB',
        (bmpinfo['bmWidth'], bmpinfo['bmHeight']),
        bmpstr, 'raw', 'BGRX', 0, 1
    )
    
    win32gui.DeleteObject(saveBitMap.GetHandle())
    saveDC.DeleteDC()
    mfcDC.DeleteDC()
    win32gui.ReleaseDC(hdesktop, hwndDC)
    
    return img

def capture_window(window_title: str) -> Optional[Image.Image]:
    """截取指定窗口"""
    hwnd = win32gui.FindWindow(None, window_title)
    if not hwnd:
        print(f'[screenshot] 未找到窗口: {window_title}')
        return None
    
    if win32gui.IsIconic(hwnd):
        print('[screenshot] 窗口被最小化，正在恢复...')
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        time.sleep(0.3)
    
    left, top, right, bottom = win32gui.GetWindowRect(hwnd)
    width = right - left
    height = bottom - top
    
    hwndDC = win32gui.GetWindowDC(hwnd)
    mfcDC = win32ui.CreateDCFromHandle(hwndDC)
    saveDC = mfcDC.CreateCompatibleDC()
    
    saveBitMap = win32ui.CreateBitmap()
    saveBitMap.CreateCompatibleBitmap(mfcDC, width, height)
    saveDC.SelectObject(saveBitMap)
    
    result = saveDC.BitBlt((0, 0), (width, height), mfcDC, (0, 0), win32con.SRCCOPY)
    
    bmpinfo = saveBitMap.GetInfo()
    bmpstr = saveBitMap.GetBitmapBits(True)
    
    img = Image.frombuffer(
        'RGB',
        (bmpinfo['bmWidth'], bmpinfo['bmHeight']),
        bmpstr, 'raw', 'BGRX', 0, 1
    )
    
    win32gui.DeleteObject(saveBitMap.GetHandle())
    saveDC.DeleteDC()
    mfcDC.DeleteDC()
    win32gui.ReleaseDC(hwnd, hwndDC)
    
    return img

def take_screenshot(window_title: Optional[str] = None) -> str:
    """
    截图并保存
    
    Args:
        window_title: 窗口标题（可选）
    
    Returns:
        截图文件的相对路径
    """
    ensure_screenshots_dir()
    
    timestamp = get_timestamp()
    if window_title:
        safe_title = sanitize_filename(window_title)
        filename = f'screenshot_{safe_title}_{timestamp}.png'
    else:
        filename = f'screenshot_{timestamp}.png'
    
    filepath = os.path.join(SCREENSHOTS_DIR, filename)
    
    try:
        if window_title:
            print(f'[screenshot] 截取窗口: {window_title}')
            img = capture_window(window_title)
            if img is None:
                print('[screenshot] 窗口截图失败，尝试全屏截图')
                img = capture_screen()
        else:
            print('[screenshot] 截取全屏')
            img = capture_screen()
        
        img.save(filepath)
        print(f'[screenshot] 截图已保存: {filepath}')
        
        return os.path.relpath(filepath, os.path.dirname(__file__))
    except Exception as e:
        print(f'[screenshot] 截图失败: {e}')
        raise
