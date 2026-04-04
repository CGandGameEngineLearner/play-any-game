import { keyboard, Key } from '@nut-tree-fork/nut-js';

keyboard.config.autoDelayMs = 100;

export async function pressKey(keyName: string, delayMs: number = 100): Promise<void> {
  const keyMap: { [key: string]: Key } = {
    'W': Key.W, 'A': Key.A, 'S': Key.S, 'D': Key.D,
    'Q': Key.Q, 'E': Key.E, 'R': Key.R, 'T': Key.T,
    'Z': Key.Z, 'X': Key.X, 'C': Key.C, 'V': Key.V, 'B': Key.B, 'N': Key.N, 'M': Key.M,
    'F': Key.F, 'G': Key.G, 'H': Key.H, 'J': Key.J, 'K': Key.K, 'L': Key.L,
    'Y': Key.Y, 'U': Key.U, 'I': Key.I, 'O': Key.O, 'P': Key.P,
    '1': Key.Num1, '2': Key.Num2, '3': Key.Num3, '4': Key.Num4, '5': Key.Num5,
    '6': Key.Num6, '7': Key.Num7, '8': Key.Num8, '9': Key.Num9, '0': Key.Num0,
    'Space': Key.Space, 'Enter': Key.Enter, 'Escape': Key.Escape, 'Esc': Key.Escape, 'Tab': Key.Tab,
    'LeftShift': Key.LeftShift, 'RightShift': Key.RightShift, 'Shift': Key.LeftShift,
    'LeftCtrl': Key.LeftControl, 'RightCtrl': Key.RightControl, 'Ctrl': Key.LeftControl,
    'LeftAlt': Key.LeftAlt, 'RightAlt': Key.RightAlt, 'Alt': Key.LeftAlt,
    'F1': Key.F1, 'F2': Key.F2, 'F3': Key.F3, 'F4': Key.F4,
    'F5': Key.F5, 'F6': Key.F6, 'F7': Key.F7, 'F8': Key.F8
  };
  
  const key = keyMap[keyName];
  if (!key) {
    console.error('[keyboard] 未知按键: ' + keyName);
    return;
  }
  
  console.log('[keyboard] 按键: ' + keyName);
  await keyboard.pressKey(key);
  await keyboard.releaseKey(key);
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

export async function holdKey(keyName: string, holdMs: number, delayMs: number = 100): Promise<void> {
  const keyMap: { [key: string]: Key } = {
    'W': Key.W, 'A': Key.A, 'S': Key.S, 'D': Key.D,
    'Q': Key.Q, 'E': Key.E, 'R': Key.R, 'T': Key.T,
    'Z': Key.Z, 'X': Key.X, 'C': Key.C, 'V': Key.V, 'B': Key.B, 'N': Key.N, 'M': Key.M,
    'F': Key.F, 'G': Key.G, 'H': Key.H, 'J': Key.J, 'K': Key.K, 'L': Key.L,
    'Y': Key.Y, 'U': Key.U, 'I': Key.I, 'O': Key.O, 'P': Key.P,
    'Space': Key.Space, 'LeftShift': Key.LeftShift, 'Shift': Key.LeftShift,
    'LeftCtrl': Key.LeftControl, 'Ctrl': Key.LeftControl,
    'LeftAlt': Key.LeftAlt, 'Alt': Key.LeftAlt
  };
  
  const key = keyMap[keyName];
  if (!key) {
    console.error('[keyboard] 未知按键: ' + keyName);
    return;
  }
  
  console.log('[keyboard] 按住 ' + keyName + ' ' + holdMs + 'ms');
  await keyboard.pressKey(key);
  await new Promise(resolve => setTimeout(resolve, holdMs));
  await keyboard.releaseKey(key);
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

export async function keySequence(keys: string[], delayMs: number = 200): Promise<void> {
  console.log('[keyboard] 按键序列: ' + keys.join(' + '));
  for (const key of keys) {
    await pressKey(key, delayMs);
  }
}

export default { pressKey, holdKey, keySequence };
