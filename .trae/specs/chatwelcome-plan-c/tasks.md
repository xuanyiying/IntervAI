# Tasks

- [x] Task 1: 重构 ChatWelcome.tsx 布局（方案 C）
  - [x] 1.1 移除上传简历引导 DashboardCard 及其 onClick 逻辑
  - [x] 1.2 移除 AI 模拟面试 / AI 面试精灵两个功能入口 DashboardCard
  - [x] 1.3 调整布局顺序：问候区 → 输入框区 → 快捷操作区（输入框置顶为核心 CTA）
  - [x] 1.4 给 4 个快捷按钮添加 Tooltip（使用 Ant Design Tooltip 组件包裹，显示功能简介）
  - [x] 1.5 更新输入框 placeholder 为增强文案「向助手提问，或拖拽简历上传...」

- [x] Task 2: ChatWelcome 完整国际化
  - [x] 2.1 将 `getGreeting()` 函数改为使用 `t('greeting.morning/afternoon/evening')`
  - [x] 2.2 将问候副标题 `{username}，今天想做什么？` 改为 `t('chat.welcome_subtitle', { username })`
  - [x] 2.3 将 Tag 文本「免费额度可用」改为 `t('quota.free_available')`
  - [x] 2.4 将输入框 placeholder 改为 `t('chat.placeholder_enhanced')`
  - [x] 2.5 将卡片相关硬编码文本（已移除卡片后无需处理，但确认无遗漏）
  - [x] 2.6 在 zh-CN.json 中新增所有 chat welcome 相关翻译 key
  - [x] 2.7 在 en-US.json 中新增对应的英文翻译

- [x] Task 3: 更新 chat.css 样式
  - [x] 3.1 移除或调整 `.dashboard-welcome` 样式以适配新布局（输入框置顶、去除卡片间距）
  - [x] 3.3 调整 `.modern-sender-wrapper` margin 使输入框紧贴问候区下方
  - [x] 3.4 调整 `.quick-launch-grid` 间距和位置（紧贴输入框下方）
  - [x] 3.5 增强 Light 模式下输入框的 border/background 可见性
  - [x] 3.6 清理不再需要的卡片相关 CSS 规则（如有）

- [x] Task 4: 验证构建通过
  - [x] 4.1 运行 `pnpm --filter @interview-ai/frontend build` 确认构建成功 ✅
  - [x] 4.2 运行 lint 确认修改文件 0 errors ✅

# Task Dependencies
- [Task 2] depends on [Task 1] — 国际化在布局重构后进行，避免重复修改
- [Task 3] depends on [Task 1] — CSS 调整基于最终确定的布局结构
- [Task 4] depends on [Task 1, Task 2, Task 3] — 最终验证
