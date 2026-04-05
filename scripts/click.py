import ctypes
import time
import random
import win32api
import win32con
import win32gui
from typing import Optional, Tuple

user32 = ctypes.windll.user32

def get_window_handle(window_title: str) -> Optional[int]:
    """获取窗口句柄"""
    hwnd = win32gui.FindWindow(None, window_title)
    return hwnd if hwnd else None

def get_window_rect(hwnd: int) -> Optional[Tuple[int, int, int, int]]:
    """获取窗口位置和大小 (left, top, right, bottom)"""
    try:
        return win32gui.GetWindowRect(hwnd)
    except Exception:
        return None

def get_window_info(window_title: str) -> Optional[dict]:
    """获取窗口信息"""
    hwnd = get_window_handle(window_title)
    if not hwnd:
        return None
    
    rect = get_window_rect(hwnd)
    if not rect:
        return None
    
    left, top, right, bottom = rect
    return {
        'hwnd': hwnd,
        'left': left,
        'top': top,
        'width': right - left,
        'height': bottom - top
    }

def activate_window(hwnd: int) -> bool:
    """激活窗口"""
    try:
        win32gui.SetForegroundWindow(hwnd)
        time.sleep(0.05)
        return True
    except Exception:
        return False

def make_lparam(x: int, y: int) -> int:
    """构造 LPARAM 参数 (y << 16) | x"""
    return (y << 16) | (x & 0xFFFF)

def mouse_event(flags: int, dx: int = 0, dy: int = 0, data: int = 0, extra_info: int = 0):
    """调用 mouse_event API"""
    user32.mouse_event(flags, dx, dy, data, extra_info)

def move_mouse_absolute(x: int, y: int):
    """移动鼠标到绝对坐标 (参考 BetterGI MouseEventSimulator.Move)"""
    screen_width = win32api.GetSystemMetrics(0)
    screen_height = win32api.GetSystemMetrics(1)
    
    normalized_x = int(x * 65535 / screen_width)
    normalized_y = int(y * 65535 / screen_height)
    
    mouse_event(
        win32con.MOUSEEVENTF_ABSOLUTE | win32con.MOUSEEVENTF_MOVE,
        normalized_x, normalized_y
    )

def left_button_down():
    """鼠标左键按下"""
    mouse_event(win32con.MOUSEEVENTF_LEFTDOWN)

def left_button_up():
    """鼠标左键释放"""
    mouse_event(win32con.MOUSEEVENTF_LEFTUP)

def right_button_down():
    """鼠标右键按下"""
    mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN)

def right_button_up():
    """鼠标右键释放"""
    mouse_event(win32con.MOUSEEVENTF_RIGHTUP)

def click_foreground(x: int, y: int) -> bool:
    """
    前台物理点击 (参考 BetterGI MouseEventSimulator.Click)
    使用 mouse_event API 模拟真实鼠标操作
    """
    if x == 0 and y == 0:
        return False
    
    move_mouse_absolute(x, y)
    time.sleep(0.01)
    
    left_button_down()
    time.sleep(0.02 + random.random() * 0.01)
    left_button_up()
    
    return True

def click_background(hwnd: int, x: int, y: int) -> bool:
    """
    后台虚拟点击 (参考 BetterGI PostMessageSimulator.LeftButtonClickBackground)
    使用 PostMessage 发送窗口消息，不抢夺鼠标
    """
    try:
        lparam = make_lparam(x, y)
        
        win32gui.PostMessage(hwnd, win32con.WM_ACTIVATE, 1, 0)
        time.sleep(0.01)
        
        win32gui.PostMessage(hwnd, win32con.WM_LBUTTONDOWN, 1, lparam)
        time.sleep(0.1)
        win32gui.PostMessage(hwnd, win32con.WM_LBUTTONUP, 0, lparam)
        
        return True
    except Exception:
        return False

def right_click_background(hwnd: int, x: int, y: int) -> bool:
    """后台虚拟右键点击"""
    try:
        lparam = make_lparam(x, y)
        
        win32gui.PostMessage(hwnd, win32con.WM_ACTIVATE, 1, 0)
        time.sleep(0.01)
        
        win32gui.PostMessage(hwnd, win32con.WM_RBUTTONDOWN, 1, lparam)
        time.sleep(0.1)
        win32gui.PostMessage(hwnd, win32con.WM_RBUTTONUP, 0, lparam)
        
        return True
    except Exception:
        return False

def click(x: int, y: int, window_title: Optional[str] = None, background: bool = False) -> bool:
    """
    统一点击接口
    
    Args:
        x: X 坐标（相对于窗口或屏幕）
        y: Y 坐标（相对于窗口或屏幕）
        window_title: 窗口标题（可选）
        background: 是否后台点击
    
    Returns:
        是否成功
    """
    print(f'[click] 点击坐标: ({x}, {y})')
    
    if window_title:
        win_info = get_window_info(window_title)
        if not win_info:
            print(f'[click] 未找到窗口: {window_title}')
            return False
        
        hwnd = win_info['hwnd']
        screen_x = win_info['left'] + x
        screen_y = win_info['top'] + y
        
        print(f'[click] 窗口位置: ({win_info["left"]}, {win_info["top"]})')
        print(f'[click] 屏幕坐标: ({screen_x}, {screen_y})')
        
        if background:
            print('[click] 使用后台点击模式')
            return click_background(hwnd, x, y)
        else:
            print('[click] 使用前台点击模式')
            activate_window(hwnd)
            time.sleep(0.05 + random.random() * 0.03)
            return click_foreground(screen_x, screen_y)
    else:
        if background:
            print('[click] 后台模式需要指定窗口标题')
            return False
        return click_foreground(x, y)

def right_click(x: int, y: int, window_title: Optional[str] = None, background: bool = False) -> bool:
    """右键点击"""
    print(f'[click] 右键点击坐标: ({x}, {y})')
    
    if window_title:
        win_info = get_window_info(window_title)
        if not win_info:
            print(f'[click] 未找到窗口: {window_title}')
            return False
        
        hwnd = win_info['hwnd']
        screen_x = win_info['left'] + x
        screen_y = win_info['top'] + y
        
        if background:
            return right_click_background(hwnd, x, y)
        else:
            activate_window(hwnd)
            time.sleep(0.05)
            move_mouse_absolute(screen_x, screen_y)
            time.sleep(0.02)
            right_button_down()
            time.sleep(0.02 + random.random() * 0.01)
            right_button_up()
            return True
    else:
        if background:
            return False
        move_mouse_absolute(x, y)
        time.sleep(0.02)
        right_button_down()
        time.sleep(0.02)
        right_button_up()
        return True
