---
name: play-any-game
description:厌倦了肝得要死的游戏？天天刷刷刷不知道有什么意义？到底tmd是我在玩游戏还是在上班？让AI帮你刷刷刷吧！解放你的时间，你只需体验游戏的精华，不必体验游戏中的重复劳动。当用户提到"帮我玩游戏"、"自动刷图"、"自动刷副本"、"自动刷体力"、"游戏外挂"、"游戏自动化"、"游戏脚本"、"t天梯"、"刷深渊"、"刷材料"、"刷资源"时使用此技能。适用于崩坏星穹铁道、原神、明日方舟、各类手游刷刷刷场景，也支持PC端游的重复任务自动执行。
---

# Play Any Game - AI游戏代肝技能

## 核心能力

让AI agent通过图像识别+自动操作来替你完成游戏中的重复劳动。

## 工作原理

```
用户请求 → AI分析游戏画面 → 识别UI元素/按钮 → 自动执行操作 → 循环直到任务完成
```

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

## Node.js 自动化工具

项目内置了一套 Node.js 截图+点击工具，提供更精确的屏幕控制能力。

### 工具位置

```
C:\Users\lijinwen\lobsterai\project\play-any-game\
├── scripts/
│   ├── index.js       # CLI 主入口
│   ├── screenshot.js  # 截图功能
│   ├── window.js      # 窗口捕获
│   ├── click.js       # 鼠标点击
│   └── find-button.js # 按钮查找
└── screenshots/       # 截图存放目录
```

### 安装依赖

```bash
cd C:\Users\lijinwen\lobsterai\project\play-any-game
npm install
```

### CLI 命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `screenshot [窗口标题]` | 截取屏幕 | `npx tsx scripts/index.ts screenshot` |
| `capture <窗口标题>` | 截取指定窗口 | `npx tsx scripts/index.ts capture "原神"` |
| `click <x> <y>` | 点击坐标（0.2s后自动截图） | `npx tsx scripts/index.ts click 540 820` |
| `find <按钮名称> [截图路径]` | 查找按钮位置 | `npx tsx scripts/index.ts find "开始挑战"` |

### 典型工作流

```bash
# 1. 截取游戏窗口
npx tsx scripts/index.ts capture "原神"
# 返回: screenshots/screenshot_20260403_111920_500.png

# 2. 查找按钮位置
npx tsx scripts/index.ts find "开始挑战" screenshots/screenshot_20260403_111920_500.png
# 返回: {x: 540, y: 820, confidence: 0.85}

# 3. 点击按钮（点击后自动截图）
npx tsx scripts/index.ts click 540 820
# 返回: screenshots/screenshot_20260403_111923_700.png（新截图）

# 4. 继续分析新截图执行下一步
```

### API 调用（JavaScript）

```javascript
import { takeScreenshot } from './scripts/screenshot.js';
import { click } from './scripts/click.js';
import { findButton } from './scripts/find-button.js';

// 截图
const screenshotPath = await takeScreenshot();

// 查找按钮
const button = await findButton(screenshotPath, '开始挑战');
if (button) {
    // 点击
    const newScreenshot = await click(button.x, button.y);
}
```

## 参考资料

- [game-ai-controller skill](../game-ai-controller/SKILL.md) - 游戏UI扫描和自动化控制
- [references/game-patterns.md](references/game-patterns.md) - 常见游戏自动化模式参考
