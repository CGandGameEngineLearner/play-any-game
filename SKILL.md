---
name: play-any-game
description: AI游戏伴侣助手 - 当你在游戏中遇到困难、卡关、不知道怎么操作时，AI可以帮你分析游戏画面、解答问题、甚至简单操作界面帮你解决问题。不是全自动代肝，而是你的游戏伙伴，在你需要的时候伸出援手。当用户提到"帮我看下这个怎么过"、"这个怎么操作"、"卡关了"、"不知道怎么弄"时使用此技能。支持原神、崩坏星穹铁道等各类游戏。
---

# Play Any Game - AI游戏伴侣助手

## 项目定位

**不是游戏代肝助手，而是游戏伴侣助手。**

当你玩游戏时遇到困难：
- 🤔 不知道这个机关怎么解？
- 😵 卡在这个Boss打不过？
- 🤷 找不到NPC在哪？
- 😕 不知道这个界面怎么操作？

AI可以：
1. **截图分析** - 看到你的游戏画面，理解当前状态
2. **解答问题** - 告诉你该怎么解决
3. **简单操作** - 帮你点击界面、解决问题

## 核心能力

让AI成为你的游戏伙伴，在你需要时伸出援手。

## 工作原理

```
用户请求 → AI分析游戏画面 → 识别UI元素/按钮 → 自动执行操作 → 截图反馈 → 循环直到任务完成
```

## Token优化策略 - 截图机制

### 核心设计理念

为了优化AI调用的token消耗，本skill采用**截图文件引用**而非**base64编码**的方式：

1. **所有操作自动截图**：每次执行操作（截图、点击、查找按钮）都会自动生成截图
2. **按时间顺序存储**：截图按时间戳命名，存放在 `screenshots/` 目录
3. **返回相对路径**：所有操作返回相对于skill目录的截图路径，便于AI引用
4. **JSON格式输出**：CLI命令输出标准JSON格式，方便AI解析

### 截图目录结构

```
.trae/skills/play-any-game/
├── screenshots/
│   ├── screenshot_20260404_143025_123.png  # 最早的操作截图
│   ├── screenshot_20260404_143026_456.png  # 点击后的截图
│   ├── screenshot_20260404_143028_789.png  # 继续操作的截图
│   └── ...
```

### 截图文件命名格式

```
screenshot_YYYYMMDD_HHmmss_SSS.png
```

- `YYYYMMDD`: 日期（年月日）
- `HHmmss`: 时间（时分秒）
- `SSS`: 毫秒（确保唯一性）

### 操作与截图的对应关系

| 操作 | 自动截图 | 返回内容 | 用途 |
|------|---------|---------|------|
| `screenshot` | ✅ | `{action, screenshotPath, timestamp}` | 获取当前游戏画面 |
| `capture <窗口>` | ✅ | `{action, windowTitle, screenshotPath, timestamp}` | 截取指定游戏窗口 |
| `click <x> <y>` | ✅（延迟0.2s） | `{action, x, y, screenshotPath, timestamp}` | 点击后查看结果 |
| `find <按钮>` | ❌ | `{x, y, width, height, confidence}` | 查找按钮位置 |

### AI使用截图的工作流

```javascript
// 1. AI执行操作并获取截图
const result = await runCommand('npx tsx scripts/index.ts click 540 820');
const { action, x, y, screenshotPath } = JSON.parse(result);

// 2. AI引用截图文件进行分析
// AI通过文件路径引用截图，而不是传输base64
// 这样可以大幅减少token消耗

// 3. AI根据截图决定下一步操作
if (需要继续) {
    await runCommand('npx tsx scripts/index.ts click 600 900');
}
```

### Token优化效果

- **传统方式**：每次传输base64编码的截图（~500KB图片 = ~700K tokens）
- **优化方式**：只传输文件路径（~100 bytes = ~150 tokens）
- **优化比例**：节省约 **99.98%** 的token消耗

### 注意事项

1. **截图文件管理**：长时间运行会产生大量截图，建议定期清理
2. **路径引用**：AI需要能够访问skill目录下的截图文件
3. **时间顺序**：截图按时间戳排序，AI可以通过文件名推断操作顺序
4. **相对路径**：所有路径都是相对于skill目录的相对路径，便于移植

## 使用工作流

### 1. 游戏环境识别

首先，AI需要了解当前游戏和任务：
- 当前是什么游戏？
- 要完成什么任务？（如：刷遗物、刷材料、刷体力、爬塔等）
- 任务在哪里接取/在哪刷？

### 2. 屏幕扫描 (game-ai-controller skill)

使用 `game-ai-controller` skill 进行游戏UI扫描：
- 扫描当前画面有哪些可点击的按钮
- 识别游戏中的关键UI元素位置
- 获取游戏角色状态信息

### 3. 制定策略

根据任务目标，制定执行计划：
- 进入哪个副本/活动
- 需要循环多少次
- 何时退出/重试

### 4. 执行循环

使用 `browser` tool 或 `canvas` 进行自动化操作：
- 点击"开始"按钮进入副本
- 等待战斗结束
- 领取奖励
- 重复直到体力耗尽或任务完成

### 5. 任务汇报

完成后告知用户：
- 完成了多少次
- 获得了什么奖励
- 总耗时

## 支持的游戏类型

- **手游**：崩坏星穹铁道、原神、明日方舟、各类手游自动刷
- **PC端游**：需要重复执行的日常任务
- **模拟器**：蓝叠、夜神、MuMu等模拟器上的游戏

## 典型场景示例

### 崩坏星穹铁道 - 刷忘却之庭

```
用户：帮我把忘却之庭从10层刷到满星
AI：开始自动刷取...
- 进入忘却之庭第10层
- 识别敌方血量，等待自动战斗结束
- 领取通关奖励
- 继续下一层...
完成！共刷了15层，获得星琼60个，尘土若干，总耗时23分钟
```

### 原神 - 刷圣遗物

```
用户：帮我刷一下绝缘套
AI：开始自动刷取...
- 进入秘境：炽烈的炎之魔女
- 等待战斗结束
- 领取奖励
- 重新挑战...
完成！共刷了20次，获得有效属性圣遗物3个，总耗时18分钟
```

## 注意事项

- AI通过图像识别判断游戏状态，需要游戏窗口在可见状态
- 部分游戏可能有反自动化检测，请自行评估风险
- 长时间挂机建议开启防烧屏措施
- AI不会帮你做需要真正策略判断的高难度副本，只做重复性劳动
- **截图文件管理**：所有操作都会生成截图，按时间顺序存储在 `screenshots/` 目录
- **Token优化**：通过文件路径引用截图而非base64编码，大幅减少token消耗
- **路径引用**：AI需要能够访问skill目录下的截图文件进行分析

## AI使用示例

### AI使用示例

#### 示例1：自动刷副本

```typescript
// AI的执行逻辑
async function autoDungeon() {
    // 1. 获取当前画面
    const result1 = await runCommand('npx tsx scripts/index.ts capture "原神"');
    const { screenshotPath: path1 } = JSON.parse(result1);
    
    // 2. 查找"进入副本"按钮
    const result2 = await runCommand(`npx tsx scripts/index.ts find "进入副本" ${path1}`);
    const button = JSON.parse(result2);
    
    // 3. 点击按钮
    const result3 = await runCommand(`npx tsx scripts/index.ts click ${button.x} ${button.y}`);
    const { screenshotPath: path2 } = JSON.parse(result3);
    
    // 4. 等待战斗结束（通过截图判断）
    await waitForBattleEnd(path2);
    
    // 5. 领取奖励
    const result4 = await runCommand('npx tsx scripts/index.ts screenshot');
    const { screenshotPath: path3 } = JSON.parse(result4);
    
    // 6. 查找"领取"按钮
    const result5 = await runCommand(`npx tsx scripts/index.ts find "领取" ${path3}`);
    const claimButton = JSON.parse(result5);
    await runCommand(`npx tsx scripts/index.ts click ${claimButton.x} ${claimButton.y}`);
    
    // 7. 重复直到体力耗尽
    // ...
}
```

#### 示例2：截图路径引用

```typescript
import fs from 'fs';

// AI通过文件路径引用截图，而不是传输base64
const screenshotPath: string = "screenshots/screenshot_20260404_143025_123.png";

// AI可以读取这个文件进行分析
const imageBuffer: Buffer = fs.readFileSync(screenshotPath);
const analysis = await analyzeImage(imageBuffer);

// 这样每次只传输文件路径（~100 bytes），而不是base64（~700K tokens）
// 大幅降低token消耗
```

#### 示例3：操作历史追踪

```typescript
// AI可以通过截图文件名追踪操作历史
const screenshots: string[] = [
    "screenshots/screenshot_20260404_143025_123.png",  // 初始截图
    "screenshots/screenshot_20260404_143026_456.png",  // 点击后
    "screenshots/screenshot_20260404_143028_789.png",  // 继续操作
    "screenshots/screenshot_20260404_143030_012.png",  // 最终状态
];

// 按时间顺序查看操作历史
screenshots.forEach((path: string) => {
    console.log(`操作步骤: ${path}`);
    // AI可以按顺序分析这些截图，理解操作过程
});
```

## Node.js 自动化工具

项目内置了一套 Node.js 截图+点击工具，提供更精确的屏幕控制能力。

### 工具位置

```
.trae/skills/play-any-game/
├── scripts/
│   ├── index.ts       # CLI 主入口
│   ├── screenshot.ts  # 截图功能
│   ├── window.ts      # 窗口捕获
│   ├── click.ts       # 鼠标点击
│   └── find-button.ts # 按钮查找
└── screenshots/       # 截图存放目录
```

### 安装依赖

```bash
cd .trae/skills/play-any-game
npm install
```

### 编译TypeScript

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

### CLI 命令

| 命令 | 说明 | 返回格式 | 示例 |
|------|------|---------|------|
| `screenshot [窗口标题]` | 截取屏幕 | JSON | `npx tsx scripts/index.ts screenshot` |
| `capture <窗口标题>` | 截取指定窗口 | JSON | `npx tsx scripts/index.ts capture "原神"` |
| `click <x> <y>` | 点击坐标（0.2s后自动截图） | JSON | `npx tsx scripts/index.ts click 540 820` |
| `find <按钮名称> [截图路径]` | 查找按钮位置 | JSON | `npx tsx scripts/index.ts find "开始挑战"` |

### 命令返回格式

所有命令都返回标准JSON格式，便于AI解析：

```json
{
  "action": "click",
  "x": 540,
  "y": 820,
  "screenshotPath": "screenshots/screenshot_20260404_143025_123.png",
  "timestamp": "2026-04-04T14:30:25.123Z"
}
```

**重要**：`screenshotPath` 是相对于skill目录的路径，AI可以通过这个路径引用截图文件。

### 典型工作流

```bash
# 1. 截取游戏窗口（自动返回截图路径）
npx tsx scripts/index.ts capture "原神"
# 返回: {"action":"capture","windowTitle":"原神","screenshotPath":"screenshots/screenshot_20260404_143025_123.png","timestamp":"2026-04-04T14:30:25.123Z"}

# 2. 查找按钮位置（在步骤1的截图中查找）
npx tsx scripts/index.ts find "开始挑战" screenshots/screenshot_20260404_143025_123.png
# 返回: {"x":540,"y":820,"width":120,"height":50,"confidence":0.85}

# 3. 点击按钮（点击后自动截图）
npx tsx scripts/index.ts click 540 820
# 返回: {"action":"click","x":540,"y":820,"screenshotPath":"screenshots/screenshot_20260404_143026_456.png","timestamp":"2026-04-04T14:30:26.456Z"}

# 4. 继续分析新截图执行下一步
# AI通过 screenshotPath 引用新截图，决定下一步操作
```

### API 调用（TypeScript）

```typescript
import { takeScreenshot } from './scripts/screenshot.js';
import { click } from './scripts/click.js';
import { findButton } from './scripts/find-button.js';

// 截图（返回相对路径）
const screenshotPath: string = await takeScreenshot();
// 返回: "screenshots/screenshot_20260404_143025_123.png"

// 查找按钮
const button = await findButton(screenshotPath, '开始挑战');
if (button) {
    // 点击（点击后自动截图并返回新截图路径）
    const newScreenshot = await click(button.x, button.y);
    // 返回: "screenshots/screenshot_20260404_143026_456.png"
}
```

### 截图管理建议

1. **定期清理**：长时间运行会产生大量截图，建议定期清理 `screenshots/` 目录
2. **保留关键截图**：可以保留关键节点的截图用于调试和复盘
3. **磁盘空间**：注意监控磁盘空间，避免截图占用过多存储
4. **批量删除**：可以使用以下命令清理超过N天的截图：
   ```bash
   # Windows PowerShell
   Get-ChildItem .trae\skills\play-any-game\screenshots\*.png | 
   Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
   Remove-Item
   ```

## 游戏定制SOUL

本skill支持为不同游戏创建定制的SOUL.md文件，让AI化身成游戏中的角色人设，提供更具沉浸感的游戏辅助体验。

### 目录结构

```
.trae/skills/play-any-game/
├── game-souls/         # 游戏定制SOUL目录
│   ├── genshin-impact-soul.md  # 原神 - 派蒙
│   └── ...            # 其他游戏的SOUL文件
└── scripts/           # 核心脚本
```

### 功能特性

1. **角色化交互**：AI以游戏角色的身份与用户交流
2. **实时画面分析**：通过截图实时观察游戏画面
3. **游戏知识问答**：回答关于游戏的各种问题
4. **自动化操作**：控制鼠标键盘执行游戏操作

### 使用方法

1. 选择对应游戏的SOUL文件
2. AI会以该角色的身份与你互动
3. 可以询问游戏相关问题
4. 可以让AI帮助执行游戏操作

### 示例：原神 - 派蒙

```markdown
# 派蒙 - 原神游戏助手

## 基本信息

- **名称**: 派蒙
- **身份**: 旅行者的应急食品、向导、伙伴
- **性格**: 活泼可爱、好奇心强、有点贪吃、偶尔犯点小迷糊
- **口头禅**: "应急食品！"、"旅行者~"、"哇~好厉害！"

## 核心能力

- 实时分析游戏画面
- 回答原神相关问题
- 执行游戏内操作
- 提供游戏攻略建议
```

## 参考资料

- [game-ai-controller skill](../game-ai-controller/SKILL.md) - 游戏UI扫描和自动化控制
- [references/game-patterns.md](references/game-patterns.md) - 常见游戏自动化模式参考
- [game-souls/genshin-impact-soul.md](game-souls/genshin-impact-soul.md) - 原神派蒙SOUL
- [AGENTS.md](AGENTS.md) - OpenClaw项目规则
- [CLAUDE.md](CLAUDE.md) - Claude模型配置
