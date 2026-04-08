# 🎮 Play Any Game - AI游戏伴侣助手

> **不是游戏代肝助手，而是游戏伙伴。当你卡关了、不知道怎么操作时，AI 帮你看画面、解答问题、伸出援手。**

## 🚀 快速开始

```markdown
用户：我卡在这个机关谜题了，不知道怎么解
AI（派蒙）：嗯嗯，让派蒙看一眼！
    - 截图分析当前画面
    - 识别机关状态和可交互元素
    - 给出解题步骤说明
    - 如需要可直接帮你点击操作
搞定啦！这个机关要先激活左边的符文，再点中间的传送阵～
```

## ✨ 功能特点

- 📸 **截图分析** - 实时看到你的游戏画面，理解当前状态
- 💬 **解答问题** - 卡关了？不知道怎么操作？AI 告诉你该怎么做
- 🖱️ **辅助操作** - 帮你点击界面按钮，解决眼前的问题
- 🎭 **角色扮演** - 玩原神时化身派蒙，玩星铁时化身三月七

## 📋 支持的游戏

| 游戏 | AI 角色 | 触发关键词 |
|------|---------|-----------|
| 原神 | 派蒙 | 原神、genshin、派蒙、paimon |
| 崩坏：星穹铁道 | 三月七 | 星穹铁道、星铁、starrail、崩铁、三月七 |

## 🔧 工作原理

```
AI 分析截图 ──→ 执行操作 ──→ 自动截图 ──→ 返回给 AI
     ↑                                        │
     └────────────────────────────────────────┘
```

每次操作后自动截图，让 AI 能看到操作效果，再决定下一步。

### 技术实现

1. **AI 识图** - 多模态大模型直接识别界面元素
2. **自然语言定位** - 通过文字描述找到按钮（无需预设模板）
3. **点击操作** - 前台/后台两种模式
4. **SOUL 切换** - 进入游戏时自动切换 AI 角色人设

## 📦 安装

```bash
# 使用 ClawHub 安装
clawhub install play-any-game
```

### 配置 API Key

```bash
# 方式1：命令行配置
python main.py config --set-api-key YOUR_API_KEY

# 方式2：环境变量
set DASHSCOPE_API_KEY=YOUR_API_KEY
```

## 🖥️ 常用命令

```bash
# AI识图点击按钮
python main.py click_text "地图按钮" "原神"

# 截取游戏画面
python main.py capture "原神"

# 坐标点击
python main.py click 540 820 "原神"

# 开始游戏会话（切换 AI 角色）
python main.py game start 原神

# 结束游戏会话
python main.py game end
```

## ⚠️ 注意事项

- 游戏窗口需在**可见状态**，AI 才能分析画面
- **辅助性质**：AI 帮你解决问题，不是全自动挂机代肝
- 高难度策略内容仍需玩家自己操作
- 不要将 API Key 提交到 git 仓库

## 📖 详细文档

- [SKILL.md](SKILL.md) - 完整技术文档与 CLI 参考
- [games/genshin-impact/SOUL.md](games/genshin-impact/SOUL.md) - 派蒙角色设定
- [games/honkai-starrail/SOUL.md](games/honkai-starrail/SOUL.md) - 三月七角色设定

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License