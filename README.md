# Xiaohe Poster Design Skill

一个遵循 [Agent Skills 开放格式](https://agentskills.io/specification) 的跨智能体海报设计 skill，用于制作复古颗粒感黑白人像、粉丝海报和编辑风格拼贴海报。

核心规范只有一个：`SKILL.md`。Codex、Claude Code 以及其它兼容 Agent Skills 的客户端可以共享同一份规范；不兼容该格式的客户端也可以通过手动导入使用。详见 [PORTABILITY.md](PORTABILITY.md)。

## 功能

- 严格使用用户提供的原始照片，不重绘人物脸部、姿态或服装。
- 固定 `reference-01` 版式：1 张主图、4 张辅助图、4 个切片窗口、5 个文字岛。
- 输出硬性交付的扁平海报 `poster.png`。
- 可选输出完整 Photoshop 素材包：中文图层 PSD、六个语义层、完整人像素材、未链接蒙版和青绿色效果。
- 主图比例不一致时先提供裁切 / 不裁切决策图，由用户选择。
- 动态检查切片窗口内的人像完整性、居中程度和文字岛安全间距。
- 交付扁平海报；完整 Photoshop 素材包必须单独询问并遵循用户选择。

## 安装与兼容性

跨智能体使用时，请复制或克隆整个仓库目录，保留 `SKILL.md`、`references/`、`assets/` 和 `scripts/` 的相对位置。

Codex：

```text
~/.codex/skills/xiaohe-poster-design-skill
```

Claude Code：

```text
~/.claude/skills/xiaohe-poster-design-skill
```

对于豆包、MiniMax 或其它没有原生 skill 目录的客户端，请在其自定义技能/知识库入口导入整个目录；如果只能提供文本，则先让智能体读取 `SKILL.md`，并同时提供 `references/`、`assets/` 与 `scripts/`。客户端是否能自动发现、预览图片或执行脚本，取决于客户端本身，不能由仓库单方面保证。

运行随附渲染器要求 Node.js 22 或更高版本、npm、本地文件系统和 shell。安装依赖后可运行单元测试：

```bash
npm install
npm test
```

## 使用约定

制作前需要确认人物名、主标题、副标题和五个文字岛文案，并单独询问用户是否需要完整 Photoshop 素材包。扁平海报始终交付；只有用户明确选择需要时才生成 `PS导入素材包-中文-完整版/`。

如果客户端不支持本地 Node.js 或文件操作，仍可使用 `SKILL.md` 执行设计决策与确认流程，但必须明确说明无法运行随附渲染器，不能虚报已经生成 `poster.png`。

## 许可证

本项目采用 MIT License。参考图片已获作者授权用于本项目公开发布。
