# Checklist

## Task 1: 增强 Light 主题品质感

* [x] `index.css` 的 `[data-theme='light']` 中已增加微妙的浅蓝-紫渐变背景光晕（radial-gradient）

* [x] Light 模式 glass-bg 变量已更新为半透明白色 + backdrop-filter

* [x] Light 模式文字层级变量已优化（主/次/占位三级清晰）

* [x] Light 模式边框颜色已调整为极淡分割线

* [x] `config/theme.ts` lightTheme 中 Card/Button 等组件的半透明质感配置已增强

## Task 2: 侧边栏导航结构优化

* [x] Sidebar 已重构为双区域结构：顶部主导航区（5项功能入口）+ 下方对话区（新建对话+搜索+历史列表）

* [x] 主导航项包含：主页、AI模拟面试、AI面试精灵、简历管理、充值中心

* [x] 主导航激活态样式为 Indigo 左侧色条 + 浅色背景

* [x] 侧边栏宽度保持 280px / 折叠 80px

* [x] 对话区的「新建对话」按钮和聊天历史列表保留且正常工作

## Task 3: 新增通用 UI 组件

* [x] `DashboardCard` 组件已创建：glass-card 风格，支持 header/body/footer 插槽，支持 indigo/purple/warm 色调变体

* [x] `FeatureGuideCard` 组件已创建：icon + title + description 结构，用于面试页左侧特性展示

* [x] `UsageWidget` 组件已创建：左下角固定定位，glass-morphism 风格，可收起/展开，显示套餐等级和剩余次数

## Task 4: 首页欢迎页仪表盘重构

* [x] ChatWelcome 已重构为：问候语区 → 简历引导卡(DashboardCard) → 功能入口双卡(DashboardCard) → 快捷操作区

* [x] 问候语区包含：时间段问候 + 用户头像 + 使用量概览

* [x] 简历引导卡包含：标题、描述文字、「去上传简历」CTA 按钮

* [x] AI模拟面试卡（indigo 色调）包含：标题、描述、「立即开始」按钮，点击跳转 /role-play

* [x] AI面试精灵卡（purple 色调）包含：标题、描述、「立即开始」按钮，点击跳转 /interview

* [x] 整体布局最大宽度 \~1200px 居中，响应式适配正常

## Task 5: 定价页面增强

* [x] PricingPage 顶部 Tabs 组件已添加（充值 | 我的订单 | 使用记录），默认选中"充值"

* [x] 三列定价卡片使用 glass-card 风格（非纯白扁平）

* [x] 高级礼包卡片高亮展示（indigo 边框 glow + "最受欢迎"标签 + 大字号价格）

* [x] 积分/次数购买区域已添加（横向档位选择卡：100/200/1000）

* [x] pricing.css 样式已更新

## Task 6: 模拟面试页面左右分栏重构

* [x] RolePlayPage 已重构为左右分栏布局

* [x] 顶部 Tabs（开始模拟 | 模拟记录）正确显示

* [x] 左侧产品介绍封面区（glass-panel + 渐变背景 + play icon + 标题）正确渲染

* [x] 左侧 FeatureGuideCard 特性列表（4项：面试设置/录音测试/开始面试/查看报告）正确展示

* [x] 右侧表单卡（glass-card）字段完整：简历上传、岗位选择、语言选择、音源选择、开关选项

* [x] 底部「开始面试」gradient-button 正确显示

## Task 7: 面试精灵页面分栏重构

* [x] InterviewPage 已采用与 RolePlayPage 一致的左右分栏模式

* [x] 左侧产品介绍区和特性列表正确展示

* [x] 右侧表单卡包含面试精灵专属字段（个人简历、岗位、语言、答案风格等）

* [x] 布局组件可复用（InterviewLayout 或共享样式）

## Task 8: 全局集成与响应式适配

* [x] UsageWidget 已集成到 AppLayout 全局布局中（已登录时左下角可见）

* [x] UsageWidget 数据与用户账户同步（套餐等级、剩余次数）

* [x] 移动端 Drawer 中 Sidebar 使用新的主导航+对话区分组结构

* [x] 各页面在桌面端/平板/手机端的响应式表现正常

* [x] LoginPage 等其他页面与新增强主题协调

## 质量验证

* [x] `pnpm --filter @interview-ai/frontend typecheck` 类型检查通过 ✅ (0 errors)

* [x] `pnpm --filter @interview-ai/frontend lint` lint 检查通过 ✅ (0 errors)

* [ ] `pnpm dev:frontend` 前端开发服务器可正常启动（需用户手动验证）

* [x] Dark 模式视觉效果保持 IntervAI 特色（深色科技风 + 毛玻璃 + Indigo 主色调）

* [x] Light 模式视觉效果品质提升（柔和渐变背景 + 半透明卡片 + 清晰层级）

