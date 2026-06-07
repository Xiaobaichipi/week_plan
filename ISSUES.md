# Issues & Decisions Log

> 记录项目开发过程中的问题、决策和待办事项。

---

## 2026-06-08 — 项目初始化

### 决策记录

| # | 决策项 | 结论 | 详见 |
|---|--------|------|------|
| D-001 | 应用形态 | 纯前端单页应用（HTML/JS），File System Access API 读写本地文件 | week_plan_2026-06-08.md |
| D-002 | 设计系统 | Cursor Design System（暖奶油色画布、CursorGothic/Inter、hairline 无阴影、Cursor Orange 单一品牌色） | cursor/DESIGN.md |
| D-003 | 动画引擎 | GSAP（ScrollTrigger + 微交互），克制风格 duration≤0.4s | - |
| D-004 | 数据模型 | Markdown + YAML frontmatter，文件命名 `week_plan_YYYY-MM-DD.md` | - |
| D-005 | 数据范围 | 多周计划库（CRUD），每周围绕时间分配+任务+决策+风险 | - |
| D-006 | 页面布局 | 单页单视图 + 抽屉菜单，纵向瀑布流 | - |
| D-007 | 周选择器 | 左右箭头翻页（主交互）+ 抽屉迷你时间轴（快速跳转） | - |
| D-008 | 任务编辑 | 内联编辑（点击变输入框，失焦保存） | - |
| D-009 | 创建新周 | 默认从上周复制，备选空白和模板 | - |
| D-010 | 文件导入 | 自动扫描目录 + 拖拽导入 | - |

### 待办 / 已知问题

- [ ] 项目框架搭建（HTML + CSS + JS 基础结构）
- [ ] Cursor 设计系统 CSS 变量定义
- [ ] 周计划 Markdown 解析器
- [ ] 周选择器 + 翻页动画
- [ ] 抽屉菜单 + 迷你时间轴
- [ ] 内联编辑系统
- [ ] 创建新周向导（复制/空白/模板）
- [ ] 导出 Markdown 功能
- [ ] CursorGothic 字体替代（Inter）
- [ ] 移动端响应式适配

---

*注：打勾项完成后标注日期，新发现的问题及时追加*
