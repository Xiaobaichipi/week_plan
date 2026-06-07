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
| D-011 | 构建方式 | Vite + Vanilla JS，模块化组件，零 UI 框架 | - |
| D-012 | 项目结构 | `src/` 下分 components/styles/utils，store.js 中央状态管理 | - |
| D-013 | 7 天时间表 | 响应式 CSS Grid，桌面 7 列 → 平板 4+3 → 手机 1 列 | - |
| D-014 | 日类型颜色 | 映射 Cursor timeline 粉彩色：code=蓝, content=紫, travel=桃, training=绿, off=灰 | - |
| D-015 | 今日标识 | 弱背景染色（canvas-soft），不动用 Cursor Orange | - |
| D-016 | 抽屉内容 | 迷你时间轴 + 操作按钮（新建周/导入/导出/选目录） | - |
| D-017 | 冷启动流程 | 引导页：中央"选择计划目录"按钮 + 说明文字 | - |
| D-018 | 决策展示位置 | 周详情瀑布流末尾，与风险区块在一起 | - |
| D-019 | YAML frontmatter | 混合模式：结构化数据入 frontmatter，正文保留自由说明 | - |
| D-020 | 任务字段 | id + group + title + done，不做优先级和日期绑定（v2） | - |
| D-021 | 决策字段 | id + category + title + value | - |
| D-022 | 周详情新增 | 给现有 `week_plan_2026-06-08.md` 添加 YAML frontmatter | - |
| D-023 | 创建新周 | 默认从上周复制 + 备选空白/模板，Modal 向导两屏完成 | - |
| D-024 | GSAP动画规范 | Power2.easeOut / Power3.easeInOut 为主，duration≤0.4s，不用弹跳/旋转 | - |

### 待办 / 已知问题

- [ ] 01. 项目框架搭建：Vite + Vanilla JS + 目录结构
- [ ] 02. Cursor 设计系统 CSS tokens 变量定义（tokens.css）
- [ ] 03. 全局样式：base.css + components.css
- [ ] 04. Markdown + YAML frontmatter 解析器（parser.js）
- [ ] 05. 数据 → Markdown 写回（writer.js）
- [ ] 06. 中央状态管理（store.js）
- [ ] 07. File System Access API 封装（file.js）
- [ ] 08. 日期工具函数（date.js）
- [ ] 09. 引导页：选择目录按钮 + onboarding
- [ ] 10. 周选择器组件：左右箭头翻页 + GSAP 翻页动画
- [ ] 11. 7 天时间表卡片：CSS Grid 响应式 + 日类型 Cursor 色映射 + 今日背景染色
- [ ] 12. 任务列表组件：内联编辑（点击变输入框，失焦保存）
- [ ] 13. 决策速查表组件
- [ ] 14. 风险列表组件
- [ ] 15. 抽屉菜单：迷你时间轴 + 操作按钮区
- [ ] 16. 创建新周 Modal：日期选择 + 来源选择（复制/空白/模板）
- [ ] 17. GSAP 入场动画（stagger 卡片淡入 + 任务逐行出现）
- [ ] 18. GSAP ScrollTrigger 滚动动画
- [ ] 19. GSAP 微交互（hover、勾选划线、翻页过渡）
- [ ] 20. 给 `week_plan_2026-06-08.md` 添加 YAML frontmatter
- [ ] 21. 移动端响应式适配
- [ ] 22. 测试 Edge + Chrome 兼容性

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
