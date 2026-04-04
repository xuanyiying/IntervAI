# Tasks

- [x] Task 1: 增强 Light 主题品质感
  - [x] 1.1 在 `index.css` 的 `[data-theme='light']` 中增加微妙的浅蓝-紫渐变背景光晕（radial-gradient，低透明度 indigo/purple）
  - [x] 1.2 增强 Light 模式的卡片变量（glass-bg 使用 `rgba(255,255,255,0.8)` + backdrop-filter）
  - [x] 1.3 微调 Light 模式文字层级和边框颜色
  - [x] 1.4 在 `config/theme.ts` 的 lightTheme 中增强 Card、Button 等组件的半透明质感配置

- [x] Task 2: 侧边栏导航结构优化（保留 IntervAI 特色）
  - [x] 2.1 重构 Sidebar 导航项分组：顶部新增「主导航区」（主页/AI模拟面试/AI面试精灵/简历管理/充值中心），保留下方「对话区」（新建对话 + 搜索 + 历史列表）
  - [x] 2.2 主导航项使用 Indigo 激活态样式（左侧色条 + 浅色背景）
  - [x] 2.3 保持侧边栏宽度 280px / 折叠 80px 不变
  - [x] 2.4 更新 Sidebar 对应 CSS 样式

- [x] Task 3: 新增通用 UI 组件
  - [x] 3.1 创建 `DashboardCard` 组件：通用 glass-card 风格仪表盘卡片，支持 header/body/footer 插槽，支持不同色调变体（indigo/purple/warm）
  - [x] 3.2 创建 `FeatureGuideCard` 组件：用于面试页左侧的功能特性展示（icon + title + description）
  - [x] 3.3 创建 `UsageWidget` 组件：左下角浮动使用量组件，glass-morphism 风格，可收起/展开，显示套餐等级和剩余次数

- [x] Task 4: 首页欢迎页 (ChatWelcome) 重构为仪表盘布局
  - [x] 4.1 重构 ChatWelcome.tsx 布局结构：问候语区（Hi + 头像 + 使用量）→ 简历引导卡（DashboardCard）→ 功能入口双卡（DashboardCard）→ 快捷操作区（可选缩小）
  - [x] 4.2 功能入口双卡：AI模拟面试（indigo 色调）/ AI面试精灵（purple 色调），每卡含标题+描述+CTA按钮
  - [x] 4.3 编写/更新 ChatWelcome 相关 CSS 样式

- [x] Task 5: 定价页面 (PricingPage) 增强
  - [x] 5.1 在 PricingPage 顶部添加 Ant Design Tabs 组件（充值 | 我的订单 | 使用记录）
  - [x] 5.2 优化三列定价卡片为 glass-card 风格，中间高级礼包高亮（indigo 边框 glow + 推荐标签）
  - [x] 5.3 新增积分/次数购买区域（横向档位选择卡）
  - [x] 5.4 更新 pricing.css 样式

- [x] Task 6: 模拟面试页面 (RolePlayPage) 左右分栏重构
  - [x] 6.1 重构 RolePlayPage 为左右分栏：顶部 Tabs（开始模拟 | 模拟记录）+ 左侧引导区 + 右侧表单卡
  - [x] 6.2 左侧区域：产品介绍封面（glass-panel + 渐变背景 + play icon）+ FeatureGuideCard 特性列表（4项）
  - [x] 6.3 右侧区域：glass-card 表单（简历上传、岗位/语言/音源 Select、音频采集 Switch、面试精灵 Switch）+ 底部 gradient-button
  - [x] 6.4 更新 agents.css 样式

- [x] Task 7: 面试精灵页面 (InterviewPage) 分栏重构
  - [x] 7.1 将 InterviewPage 重构为与 RolePlayPage 一致的左右分栏模式
  - [x] 7.2 左侧：面试精灵产品介绍 + 特性列表（FeatureGuideCard）
  - [x] 7.3 右侧：面试精灵专属表单卡（个人简历、岗位选择、面试语言、答案风格、精选剧屏、面试官列表集等字段）
  - [x] 7.4 可抽取共享的 InterviewLayout 容器组件供两个页面复用

- [x] Task 8: 全局集成与响应式适配
  - [x] 8.1 将 UsageWidget 集成到 AppLayout 全局布局中（已登录时显示在左下角）
  - [x] 8.2 确保移动端 Drawer 中的 Sidebar 也使用新的主导航+对话区分组结构
  - [x] 8.3 验证各页面在不同屏幕尺寸下的响应式表现
  - [x] 8.4 检查 LoginPage 等其他页面与新主题的协调性，做必要微调

# Task Dependencies
- [Task 2] depends on [Task 1] — 侧边栏依赖增强后的 Light 主题变量
- [Task 3] depends on [Task 1] — 通用组件依赖增强后的主题变量
- [Task 4] depends on [Task 1, Task 3] — 首页仪表盘依赖主题和 DashboardCard 组件
- [Task 5] depends on [Task 1, Task 3] — 定价页依赖主题和 DashboardCard 组件
- [Task 6] depends on [Task 1, Task 3] — 模拟面试页依赖主题和 FeatureGuideCard 组件
- [Task 7] depends on [Task 1, Task 3, Task 6] — 面试精灵可复用 Task 6 的布局模式
- [Task 8] depends on [Task 1, Task 2, Task 3] — 最终集成步骤
