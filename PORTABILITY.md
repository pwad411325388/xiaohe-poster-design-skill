# 跨智能体使用说明

本仓库的核心入口是符合 Agent Skills 开放格式的 `SKILL.md`。标准要求技能目录至少包含带 YAML frontmatter 的 `SKILL.md`，并允许旁边放置 `scripts/`、`references/` 和 `assets/` 等资源。因此，跨平台分发时应复制整个 `xiaohe-poster-design-skill/` 目录，而不是只复制一段提示词或只复制 `SKILL.md`。

## 最小兼容能力

一个智能体只要能完成下面四件事，就能使用本 skill 的核心工作流：

1. 读取 `SKILL.md` 的 `name`、`description` 和 Markdown 正文。
2. 从 skill 根目录解析 `references/...`、`assets/...` 和 `scripts/...` 的相对路径。
3. 在涉及文案、比例、切片、人像安全区和交付格式时，按正文中的用户确认闸门与用户沟通。
4. 在需要实际渲染时访问本地文件，并使用 Node.js 22+、npm 执行 `scripts/render.mjs` 与 `scripts/verify.mjs`。

如果客户端没有本地 shell、文件系统或 Node.js，仍可让智能体读取并执行设计决策流程，但不能声称已经运行渲染器或生成 PNG；应明确说明缺少运行环境。

## 客户端安装方式

| 客户端 | 推荐方式 | 自动发现 | 备注 |
|---|---|---:|---|
| Codex | 将整个目录放到 `~/.codex/skills/xiaohe-poster-design-skill/`，或项目的 `.agents/skills/` 下 | 通常支持 | `agents/openai.yaml` 仅是可选的 Codex UI 元数据，不是核心依赖。 |
| Claude Code | 将整个目录放到 `~/.claude/skills/xiaohe-poster-design-skill/`，或项目的 `.claude/skills/` 下 | 支持 | Claude Code 的 skill 目录与命令入口遵循 Agent Skills 标准；可直接使用 `/xiaohe-poster-design-skill`。 |
| 豆包 | 若客户端提供自定义技能/知识库导入，导入整个目录；否则把 `SKILL.md` 作为工作指令，并同时提供 `references/`、`assets/`、`scripts/` | 取决于版本 | 需要客户端允许访问附件与本地运行环境，才能执行随附脚本。 |
| MiniMax | 若客户端提供 Agent Skills 或自定义指令目录，导入整个目录；否则按“手动导入”方式提供 `SKILL.md` 与资源目录 | 取决于版本 | 不假设某个固定目录或命令名，以客户端当前文档为准。 |
| 其他 Agent Skills 客户端 | 放入该客户端的 skill 目录 | 由客户端决定 | 只要读取标准 frontmatter 和相对资源路径即可使用。 |

## 手动导入模板

对于没有原生 skill 目录的客户端，可以发送以下说明，并附上仓库文件夹：

```text
请先读取附件目录中的 SKILL.md，将它作为本次海报任务的工作规范。
保留 SKILL.md 同级的 references、assets、scripts 文件夹，并按相对路径读取它们。
严格执行其中的用户确认闸门；没有用户确认的文案、比例处理或交付包选项，不要自行判定。
如果当前环境不能运行 Node.js 22+ 或访问本地文件，请说明限制，不要虚报已经生成 poster.png。
```

## 兼容边界

- 设计规则、字段、确认流程和输出结构是跨智能体的核心内容。
- `agents/openai.yaml` 是可忽略的供应商 UI 元数据；忽略它不会影响设计工作流。
- `scripts/` 使用标准 Node.js ESM 与 npm 依赖；不同客户端可以调用这些脚本，也可以根据同一份 `single-image-spec.json` 自行实现等价渲染器。
- 客户端自己的工具权限、图片预览方式、技能发现方式和文件上传限制不属于本 skill 的规范；使用时应以该客户端的实际能力为准。

## 参考规范

- [Agent Skills specification](https://agentskills.io/specification)
- [Agent Skills overview](https://agentskills.io/)
- [Claude Code skills documentation](https://code.claude.com/docs/en/skills)
