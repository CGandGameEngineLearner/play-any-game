import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ButtonColorConfig {
  r: number;
  g: number;
  b: number;
  tolerance: number;
}

interface ButtonMatch {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

const BUTTON_COLOR_CONFIGS: Record<string, ButtonColorConfig> = {
  '开始': { r: 50, g: 150, b: 255, tolerance: 80 },
  '挑战': { r: 255, g: 100, b: 50, tolerance: 100 },
  '确认': { r: 50, g: 200, b: 100, tolerance: 80 },
  '取消': { r: 200, g: 80, b: 80, tolerance: 80 },
  '关闭': { r: 150, g: 150, b: 150, tolerance: 100 },
  '确定': { r: 50, g: 200, b: 100, tolerance: 80 },
  '下一步': { r: 50, g: 150, b: 255, tolerance: 80 },
  '跳过': { r: 180, g: 180, b: 180, tolerance: 100 },
};

function getColorConfigForButton(buttonName: string): ButtonColorConfig {
  if (BUTTON_COLOR_CONFIGS[buttonName]) {
    return BUTTON_COLOR_CONFIGS[buttonName];
  }
  for (const [key, config] of Object.entries(BUTTON_COLOR_CONFIGS)) {
    if (buttonName.includes(key) || key.includes(buttonName)) {
      return config;
    }
  }
  return BUTTON_COLOR_CONFIGS['开始'];
}

export async function findButton(imagePath: string, buttonName: string): Promise<ButtonMatch | null> {
  let absolutePath = imagePath;
  if (!path.isAbsolute(imagePath)) {
    absolutePath = path.join(__dirname, '..', imagePath);
  }

  if (!fs.existsSync(absolutePath)) {
    console.error('[find-button] 截图文件不存在: ' + absolutePath);
    return null;
  }

  try {
    const colorConfig = getColorConfigForButton(buttonName);
    console.log('[find-button] 查找按钮 "' + buttonName + '"，颜色: R=' + colorConfig.r + ', G=' + colorConfig.g + ', B=' + colorConfig.b + ', tolerance=' + colorConfig.tolerance);

    const results = await findColorRegionsFast(absolutePath, colorConfig);
    
    if (results.length === 0) {
      console.log('[find-button] 未找到匹配区域');
      return null;
    }

    const best = results[0];
    console.log('[find-button] 找到匹配区域: 中心=(' + best.x + ', ' + best.y + '), 区域=' + best.width + 'x' + best.height + ', 置信度=' + (best.confidence * 100).toFixed(1) + '%');
    
    return best;
  } catch (err) {
    console.error('[find-button] 查找按钮失败: ' + (err as Error).message);
    return null;
  }
}

export async function findAllButtons(imagePath: string, buttonName: string): Promise<ButtonMatch[]> {
  let absolutePath = imagePath;
  if (!path.isAbsolute(imagePath)) {
    absolutePath = path.join(__dirname, '..', imagePath);
  }

  if (!fs.existsSync(absolutePath)) {
    console.error('[find-button] 截图文件不存在: ' + absolutePath);
    return [];
  }

  try {
    const colorConfig = getColorConfigForButton(buttonName);
    const results = await findColorRegionsFast(absolutePath, colorConfig);
    return results;
  } catch (err) {
    console.error('[find-button] 查找按钮失败: ' + (err as Error).message);
    return [];
  }
}

async function findColorRegionsFast(imagePath: string, colorConfig: ButtonColorConfig): Promise<ButtonMatch[]> {
  const escapedPath = imagePath.replace(/'/g, "''");
  const step = 5;
  
  const psScript = [
    'Add-Type -AssemblyName System.Drawing',
    '',
    '$bitmap = [System.Drawing.Bitmap]::FromFile("' + escapedPath + '")',
    '$width = $bitmap.Width',
    '$height = $bitmap.Height',
    '$targetR = ' + colorConfig.r,
    '$targetG = ' + colorConfig.g,
    '$targetB = ' + colorConfig.b,
    '$tolerance = ' + colorConfig.tolerance,
    '$step = ' + step,
    '',
    'function Get-ColorDistance($r1, $g1, $b1, $r2, $g2, $b2) {',
    '    [Math]::Sqrt(($r1 - $r2) * ($r1 - $r2) + ($g1 - $g2) * ($g1 - $g2) + ($b1 - $b2) * ($b1 - $b2))',
    '}',
    '',
    '$matches = @()',
    '',
    'for ($y = 0; $y -lt $height; $y += $step) {',
    '    for ($x = 0; $x -lt $width; $x += $step) {',
    '        $pixel = $bitmap.GetPixel($x, $y)',
    '        $dist = Get-ColorDistance $pixel.R $pixel.G $pixel.B $targetR $targetG $targetB',
    '        if ($dist -le $tolerance) {',
    '            $matches += @{x=$x; y=$y; r=$pixel.R; g=$pixel.G; b=$pixel.B}',
    '        }',
    '    }',
    '}',
    '',
    '$bitmap.Dispose()',
    '',
    'if ($matches.Count -eq 0) {',
    '    Write-Output "NULL"',
    '    exit',
    '}',
    '',
    '# Group nearby matches into regions',
    '$regions = @()',
    '$visited = @{}',
    '',
    'foreach ($m in $matches) {',
    '    $key = "$($m.x),$($m.y)"',
    '    if ($visited.ContainsKey($key)) { continue }',
    '    ',
    '    $queue = @(@($m.x, $m.y))',
    '    $region = @()',
    '    $minX = $m.x; $maxX = $m.x; $minY = $m.y; $maxY = $m.y',
    '    ',
    '    while ($queue.Count -gt 0) {',
    '        $item = $queue[0]',
    '        $queue = $queue[1..$queue.Count]',
    '        $cx = $item[0]; $cy = $item[1]',
    '        $ck = "$cx,$cy"',
    '        if ($visited.ContainsKey($ck)) { continue }',
    '        $visited[$ck] = $true',
    '        ',
    '        $region += ,@($cx, $cy)',
    '        $minX = [Math]::Min($minX, $cx)',
    '        $maxX = [Math]::Max($maxX, $cx)',
    '        $minY = [Math]::Min($minY, $cy)',
    '        $maxY = [Math]::Max($maxY, $cy)',
    '        ',
    '        foreach ($n in $matches) {',
    '            $nk = "$($n.x),$($n.y)"',
    '            if ($visited.ContainsKey($nk)) { continue }',
    '            $dx = [Math]::Abs($n.x - $cx)',
    '            $dy = [Math]::Abs($n.y - $cy)',
    '            if ($dx -le $step * 2 -and $dy -le $step * 2) {',
    '                $queue += ,@($n.x, $n.y)',
    '                $visited[$nk] = $true',
    '            }',
    '        }',
    '    }',
    '    ',
    '    $area = $region.Count',
    '    if ($area -ge 5) {',
    '        $regions += @{',
    '            minX = $minX',
    '            maxX = $maxX',
    '            minY = $minY',
    '            maxY = $maxY',
    '            width = $maxX - $minX + 1',
    '            height = $maxY - $minY + 1',
    '            area = $area',
    '            centerX = [Math]::Floor(($minX + $maxX) / 2)',
    '            centerY = [Math]::Floor(($minY + $maxY) / 2)',
    '        }',
    '    }',
    '}',
    '',
    'if ($regions.Count -eq 0) {',
    '    Write-Output "NULL"',
    '} else {',
    '    $regions | Sort-Object -Property area -Descending | Select-Object -First 5 | ForEach-Object {',
    '        $confidence = [Math]::Min($_.area / 500, 1)',
    '        Write-Output "$($_.centerX),$($_.centerY),$($_.width),$($_.height),$confidence"',
    '    }',
    '}'
  ].join('\r\n');

  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, 'find_fast_' + Date.now() + '.ps1');
  fs.writeFileSync(scriptPath, psScript, { encoding: 'utf8' });

  try {
    const { stdout } = await execAsync('powershell -ExecutionPolicy Bypass -File "' + scriptPath + '"', { maxBuffer: 1024 * 1024 * 10 });
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    
    const result = stdout.trim();
    
    if (result === 'NULL' || result === '') {
      return [];
    }
    
    const results: ButtonMatch[] = [];
    const lines = result.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(',');
      if (parts.length >= 5) {
        results.push({
          x: parseInt(parts[0]),
          y: parseInt(parts[1]),
          width: parseInt(parts[2]),
          height: parseInt(parts[3]),
          confidence: parseFloat(parts[4])
        });
      }
    }
    
    return results;
  } catch (err) {
    try { fs.unlinkSync(scriptPath); } catch (e) { }
    if ((err as any).message && (err as any).message.includes('maxBuffer')) {
      console.warn('[find-button] 结果过多，截断处理');
      return [];
    }
    throw err;
  }
}

export default { findButton, findAllButtons };
