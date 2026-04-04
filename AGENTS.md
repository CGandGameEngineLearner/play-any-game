# 项目规则 - Play Any Game

## 项目定位

Play Any Game 是一个专为 OpenClaw 设计的AI游戏伴侣助手技能，通过图像识别和自动操作来帮助用户完成游戏中的重复劳动。

## 核心功能

- 🤖 **全自动运行** - AI通过图像识别判断游戏状态，自动执行操作
- 🎯 **多游戏支持** - 崩坏星穹铁道、原神、明日方舟、各类手游、PC端游
- ⏰ **24小时挂机** - 可以长时间运行，解放双手
- 📊 **任务汇报** - 完成后自动汇报刷取成果和统计

## 工作原理

```
用户请求 → AI分析游戏画面 → 识别UI元素/按钮 → 自动执行操作 → 循环直到任务完成
```

## OpenClaw 集成要求

### 1. 技能调用方式

OpenClaw 应通过以下方式调用本技能：

```bash
# 截图
npx tsx scripts/index.ts screenshot

# 截取指定窗口
npx tsx scripts/index.ts capture "游戏窗口标题"

# 点击坐标
npx tsx scripts/index.ts click 540 820

# 查找按钮
npx tsx scripts/index.ts find "按钮名称"
```

### 2. 输出格式处理

技能返回标准JSON格式，OpenClaw 应解析以下字段：

- `action`: 操作类型（screenshot、capture、click、find）
- `screenshotPath`: 截图文件路径（相对于skill目录）
- `timestamp`: 操作时间戳
- 其他操作特定字段（如 click 的 x、y 坐标）

### 3. 游戏SOUL使用

OpenClaw 应支持加载和使用 `game-souls/` 目录下的游戏定制SOUL文件：

- 每个SOUL文件对应一个游戏的角色化助手
- 应根据用户当前玩的游戏选择相应的SOUL
- 应遵循SOUL文件中定义的角色性格和交互方式

### 4. 截图管理

- OpenClaw 应定期清理 `screenshots/` 目录，避免存储空间占用过大
- 应保留关键操作的截图用于调试和分析

## 安全注意事项

- **游戏窗口可见**：AI需要游戏窗口在可见状态才能分析画面
- **反作弊风险**：部分游戏可能有反自动化检测，请用户自行评估风险
- **防烧屏**：长时间挂机时应开启防烧屏措施
- **策略判断**：AI只做重复性劳动，不处理需要真正策略判断的高难度内容

## 技术规范

### 环境要求

- Node.js 16+
- npm 或 yarn
- Windows 操作系统（使用PowerShell实现截图和点击）
- **本机运行**：技能需要在本机直接运行，不能在沙箱环境中运行，因为需要访问本机的窗口系统和进程

### 本机测试要求

由于技能需要访问本机的窗口系统，必须在本机直接运行测试：

```bash
# 打开本机的PowerShell
cd .trae/skills/play-any-game
npm install
npx tsx scripts/index.ts capture "原神"
```

**注意**：在沙箱环境中运行会失败，因为沙箱无法访问本机的窗口系统。

### 安装步骤

```bash
# 安装依赖
cd .trae/skills/play-any-game
npm install

# 类型检查
npm run typecheck

# 编译（可选）
npm run build
```

### 目录结构

```
.trae/skills/play-any-game/
├── game-souls/         # 游戏定制SOUL目录
├── scripts/           # TypeScript核心脚本
├── screenshots/       # 截图存储目录
├── references/        # 参考资料
├── SKILL.md           # 技能详细文档
├── README.md          # 项目说明
├── package.json       # 依赖配置
└── tsconfig.json      # TypeScript配置
```

## 扩展指南

### 添加新游戏支持

1. 在 `game-souls/` 目录创建新的SOUL.md文件
2. 按照模板定义游戏角色的人设和能力
3. 测试技能在该游戏中的表现

### 功能扩展

- 添加更多游戏的SOUL文件
- 增强图像识别能力
- 支持更多自动化操作
- 优化token消耗

## 故障排除

### 常见问题

1. **截图失败**：确保游戏窗口在可见状态
2. **点击无反应**：检查坐标是否正确，确保游戏窗口在前台
3. **识别错误**：可能需要调整按钮颜色配置
4. **性能问题**：减少截图频率，优化循环逻辑

### 日志和调试

- 查看控制台输出获取详细信息
- 检查 `screenshots/` 目录的截图文件
- 使用 `npm run typecheck` 检查TypeScript类型错误

## 版本兼容性

- 支持 OpenClaw v2.0+
- 与其他游戏自动化技能兼容
- 定期更新以支持新游戏和新功能
