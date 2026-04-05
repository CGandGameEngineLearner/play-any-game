#!/usr/bin/env python3
import argparse
import json
import sys
import time
from datetime import datetime
from typing import Optional

from scripts.click import click, right_click
from scripts.keyboard import press_key, hold_key
from scripts.screenshot import take_screenshot
from scripts.window import get_window_info, activate_window, list_windows, find_window_by_partial_title

def print_help():
    help_text = """
🎮 AI 游戏代肝工具 - CLI (Python 版)

用法:
  python main.py <command> [args]

命令:
  screenshot [窗口标题]
    截取屏幕截图。
    如果指定窗口标题，则截取指定窗口；否则截取主屏幕。
    返回截图文件路径。

  capture <窗口标题>
    截取指定窗口的截图。
    返回截图文件路径。

  click <x> <y> [窗口标题] [--background]
    在指定坐标点击。
    如果提供了窗口标题，则 x, y 是相对于窗口的坐标。
    点击后 0.2 秒自动截取新截图并返回路径。
    --background: 使用后台点击模式（不抢鼠标）

  rightclick <x> <y> [窗口标题] [--background]
    右键点击指定坐标。

  key <按键名> [窗口标题]
    按下指定按键。
    按键后自动截图。
    支持的按键: W, A, S, D, Q, E, R, T, Z, X, C, V, B, N, M
               F, G, H, J, K, L, Y, U, I, O, P, 1-9, 0
               Space, Enter, Escape/Esc, Tab, Shift, Ctrl, Alt
               F1-F8

  hold <按键名> <按住时间(ms)> [窗口标题]
    按住指定按键一段时间(毫秒)。
    松开后自动截图。

  windows
    列出所有可见窗口。

示例:
  python main.py screenshot
  python main.py capture "原神"
  python main.py click 540 820 "原神"
  python main.py click 540 820 "原神" --background
  python main.py key LeftAlt "原神"
  python main.py hold W 1000 "原神"
"""
    print(help_text)

def create_result(action: str, **kwargs) -> dict:
    """创建标准返回结果"""
    result = {
        'action': action,
        'timestamp': datetime.now().isoformat()
    }
    result.update(kwargs)
    return result

def handle_screenshot(args):
    window_title = args.window_title if hasattr(args, 'window_title') and args.window_title else None
    print(f'[CLI] 执行 screenshot' + (f' (窗口: {window_title})' if window_title else ''))
    
    try:
        screenshot_path = take_screenshot(window_title)
        result = create_result(
            'screenshot',
            windowTitle=window_title,
            screenshotPath=screenshot_path
        )
        print(f'📸 图片路径: {screenshot_path}')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return screenshot_path
    except Exception as e:
        print(f'[ERROR] 截图失败: {e}')
        sys.exit(1)

def handle_capture(args):
    window_title = args.window_title
    if not window_title:
        print('[ERROR] 请指定窗口标题')
        print('用法: python main.py capture <窗口标题>')
        sys.exit(1)
    
    print(f'[CLI] 执行 capture (窗口: {window_title})')
    
    try:
        screenshot_path = take_screenshot(window_title)
        result = create_result(
            'capture',
            windowTitle=window_title,
            screenshotPath=screenshot_path
        )
        print(f'📸 图片路径: {screenshot_path}')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return screenshot_path
    except Exception as e:
        print(f'[ERROR] 截图失败: {e}')
        sys.exit(1)

def handle_click(args):
    x = args.x
    y = args.y
    window_title = args.window_title if hasattr(args, 'window_title') and args.window_title else None
    background = args.background if hasattr(args, 'background') else False
    
    print(f'[CLI] 执行 click ({x}, {y})' + (f' 窗口: {window_title}' if window_title else ''))
    
    try:
        success = click(x, y, window_title, background)
        if not success:
            print('[ERROR] 点击失败')
            sys.exit(1)
        
        print('[CLI] 等待 200ms 后截图...')
        time.sleep(0.2)
        screenshot_path = take_screenshot(window_title)
        
        result = create_result(
            'click',
            x=x,
            y=y,
            windowTitle=window_title,
            background=background,
            screenshotPath=screenshot_path
        )
        print(f'📸 点击后截图路径: {screenshot_path}')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return screenshot_path
    except Exception as e:
        print(f'[ERROR] 点击失败: {e}')
        sys.exit(1)

def handle_rightclick(args):
    x = args.x
    y = args.y
    window_title = args.window_title if hasattr(args, 'window_title') and args.window_title else None
    background = args.background if hasattr(args, 'background') else False
    
    print(f'[CLI] 执行 rightclick ({x}, {y})' + (f' 窗口: {window_title}' if window_title else ''))
    
    try:
        success = right_click(x, y, window_title, background)
        if not success:
            print('[ERROR] 右键点击失败')
            sys.exit(1)
        
        print('[CLI] 等待 200ms 后截图...')
        time.sleep(0.2)
        screenshot_path = take_screenshot(window_title)
        
        result = create_result(
            'rightclick',
            x=x,
            y=y,
            windowTitle=window_title,
            background=background,
            screenshotPath=screenshot_path
        )
        print(f'📸 右键点击后截图路径: {screenshot_path}')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return screenshot_path
    except Exception as e:
        print(f'[ERROR] 右键点击失败: {e}')
        sys.exit(1)

def handle_key(args):
    key_name = args.key
    window_title = args.window_title if hasattr(args, 'window_title') and args.window_title else None
    
    print(f'[CLI] 执行 key ({key_name})' + (f' 窗口: {window_title}' if window_title else ''))
    
    try:
        press_key(key_name, 100)
        
        print('[CLI] 等待 300ms 后截图...')
        time.sleep(0.3)
        screenshot_path = take_screenshot(window_title)
        
        result = create_result(
            'key',
            key=key_name,
            windowTitle=window_title,
            screenshotPath=screenshot_path
        )
        print(f'📸 按键后截图路径: {screenshot_path}')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return screenshot_path
    except Exception as e:
        print(f'[ERROR] 按键失败: {e}')
        sys.exit(1)

def handle_hold(args):
    key_name = args.key
    hold_ms = args.hold_ms
    window_title = args.window_title if hasattr(args, 'window_title') and args.window_title else None
    
    print(f'[CLI] 执行 hold ({key_name}, {hold_ms}ms)' + (f' 窗口: {window_title}' if window_title else ''))
    
    try:
        hold_key(key_name, hold_ms, 200)
        
        print('[CLI] 等待 300ms 后截图...')
        time.sleep(0.3)
        screenshot_path = take_screenshot(window_title)
        
        result = create_result(
            'hold',
            key=key_name,
            holdMs=hold_ms,
            windowTitle=window_title,
            screenshotPath=screenshot_path
        )
        print(f'📸 按住后截图路径: {screenshot_path}')
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return screenshot_path
    except Exception as e:
        print(f'[ERROR] 按住失败: {e}')
        sys.exit(1)

def handle_windows(args):
    print('[CLI] 列出所有可见窗口:')
    windows = list_windows()
    for i, win in enumerate(windows, 1):
        print(f'{i}. [{win["hwnd"]}] {win["title"]}')
    
    result = create_result('windows', windows=windows)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return windows

def main():
    parser = argparse.ArgumentParser(description='🎮 AI 游戏代肝工具')
    subparsers = parser.add_subparsers(dest='command', help='命令')
    
    parser_screenshot = subparsers.add_parser('screenshot', help='截取屏幕截图')
    parser_screenshot.add_argument('window_title', nargs='?', help='窗口标题（可选）')
    
    parser_capture = subparsers.add_parser('capture', help='截取指定窗口')
    parser_capture.add_argument('window_title', help='窗口标题')
    
    parser_click = subparsers.add_parser('click', help='点击坐标')
    parser_click.add_argument('x', type=int, help='X 坐标')
    parser_click.add_argument('y', type=int, help='Y 坐标')
    parser_click.add_argument('window_title', nargs='?', help='窗口标题（可选）')
    parser_click.add_argument('--background', action='store_true', help='后台点击模式')
    
    parser_rightclick = subparsers.add_parser('rightclick', help='右键点击坐标')
    parser_rightclick.add_argument('x', type=int, help='X 坐标')
    parser_rightclick.add_argument('y', type=int, help='Y 坐标')
    parser_rightclick.add_argument('window_title', nargs='?', help='窗口标题（可选）')
    parser_rightclick.add_argument('--background', action='store_true', help='后台点击模式')
    
    parser_key = subparsers.add_parser('key', help='按下按键')
    parser_key.add_argument('key', help='按键名称')
    parser_key.add_argument('window_title', nargs='?', help='窗口标题（可选）')
    
    parser_hold = subparsers.add_parser('hold', help='按住按键')
    parser_hold.add_argument('key', help='按键名称')
    parser_hold.add_argument('hold_ms', type=int, help='按住时间（毫秒）')
    parser_hold.add_argument('window_title', nargs='?', help='窗口标题（可选）')
    
    parser_windows = subparsers.add_parser('windows', help='列出所有窗口')
    
    args = parser.parse_args()
    
    if not args.command:
        print_help()
        return
    
    print(f'[CLI] 游戏代肝工具启动，命令: {args.command}')
    
    commands = {
        'screenshot': handle_screenshot,
        'capture': handle_capture,
        'click': handle_click,
        'rightclick': handle_rightclick,
        'key': handle_key,
        'hold': handle_hold,
        'windows': handle_windows,
    }
    
    handler = commands.get(args.command)
    if handler:
        handler(args)
    else:
        print(f'[ERROR] 未知命令: {args.command}')
        print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()
