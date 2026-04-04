# UI 优化重构 Spec — 借鉴智面星设计，保留 IntervAI 特色

## Why
当前 IntervAI 前端拥有独特的深色科技风（Cyber-Tech）视觉体系和毛玻璃效果，这是项目的差异化优势。但在**页面布局结构**、**信息架构**和**交互流程**上可以借鉴竞品「智面星」的优秀实践——其卡片式仪表盘、清晰的功能入口、左右分栏的面试配置页等布局模式更符合 SaaS 工具类产品的用户心智。本次重构的核心原则是：**借鉴智面星的「形」（布局与结构），保留 IntervAI 的「神」（品牌调性与技术感）**。

## What Changes — 设计原则

### ✅ 保留的 IntervAI 特色
- **双主题支持**：保留 Dark（默认）+ Light 双主题，不强制切换为纯浅色
- **品牌色彩**：保留 Indigo/Purple 主色调系（#6366f1 / #4f46e5）作为核心品牌色
- **毛玻璃效果 (Glassmorphism)**：保留 `backdrop-filter: blur()` 和半透明卡片风格
- **科技感背景**：保留渐变光晕 + 噪点纹理等氛围元素
- **AI 聊天核心体验**：ChatPage 的对话流、WebSocket 实时交互保持不变
- **暗色模式的深度与质感**：深色模式是 IntervAI 的标志性体验

### 📐 从智面星借鉴的布局/结构
- **侧边栏导航精简**：将侧边栏从"聊天工具型"（新建对话+历史列表）转变为"产品功能导航型"，参考智面星的功能模块划分方式
- **首页仪表盘卡片化**：参考智面星的 Dashboard 卡片网格——问候区 → 核心引导 → 功能入口，让用户一目了然知道能做什么
- **定价页三列卡片 + Tab**：参考智面星的定价信息架构（Tab 分类 + 三档对比 + 积分购买）
- **面试页左右分栏**：参考智面星的面试配置页布局——左侧引导/教程 + 右侧操作表单，降低认知负荷
- **浮动状态组件**：参考智面星的左下角积分组件概念，但用 IntervAI 的毛玻璃风格重新诠释

### 全局层面变更
- **Light 模式优化**：提升 Light 模式的品质感（当前 Light 模式较平淡），参考智面星的清新感但不照搬配色
- **侧边栏结构调整**：
  - 保留宽度 280px（比智面星宽，更适合 IntervAI 的内容密度）
  - 导航项重组为：主页 / AI模拟面试 / AI面试精灵 / 简历管理 / 充值中心
  - **保留**聊天历史列表（IntervAI 的核心功能之一），但将其收纳到"主页"视图内或作为可折叠区域
  - **保留**"新建对话"按钮，样式优化
- **CSS 变量微调**：在现有体系上增强 Light 模式变量，新增部分布局相关 token

### 页面层面变更
- **首页/仪表盘 (ChatPage Welcome)**：
  - 当前：搜索框居中 + 4 宫格快捷操作 → 改为：顶部问候语 + 简历上传引导卡 + 功能入口双卡（AI模拟面试/AI面试精灵）+ 保留快捷操作区
  - 使用 IntervAI 的 glass-card 风格而非智面星的纯白卡片
  - 配色使用 Indigo 渐变而非智面星的蓝色
- **定价页面 (PricingPage)**：
  - 增加 Tab 切换头部（充值 | 我的订单 | 使用记录）
  - 三列卡片布局优化（当前已有基础，增强视觉层次）
  - 新增积分/次数购买区域
  - 保持 Indigo 主色调
- **模拟面试页面 (RolePlayPage)**：
  - 重构为左右分栏：左侧产品介绍/功能引导 + 右侧配置表单
  - 左侧使用 glass-panel 风格展示特性列表
  - 右侧表单使用 glass-card 风格
- **面试精灵页面 (InterviewPage)**：
  - 同样采用左右分栏模式
  - 与 RolePlayPage 共享布局组件/样式

### 组件层面变更
- 新增 `DashboardCard` 组件：通用仪表盘卡片（glass-card 风格，支持多种内容插槽）
- 新增 `FeatureGuideCard` 组件：功能引导卡片（用于面试页左侧的特性展示）
- 新增 `UsageWidget` 组件：左下角浮动使用量组件（glass-morphism 风格）
- 更新 Sidebar 导航项结构和激活态样式
- 优化 `ChatWelcome` 组件布局

## Impact
- Affected specs: 无前置 spec 依赖
- Affected code:
  - `packages/frontend/src/index.css` — 增强 Light 模式 CSS 变量，新增布局 token
  - `packages/frontend/src/config/theme.ts` — 增强 lightTheme 配置
  - `packages/frontend/src/layouts/AppLayout.tsx` — 集成 UsageWidget
  - `packages/frontend/src/layouts/components/Sidebar.tsx` — 导航项重组
  - `packages/frontend/src/pages/ChatPage/index.tsx` + `components/ChatWelcome.tsx` — 首页仪表盘重构
  - `packages/frontend/src/pages/PricingPage.tsx` + `pricing.css` — 定价页增强
  - `packages/frontend/src/pages/RolePlayPage.tsx` + `agents.css` — 分栏重构
  - `packages/frontend/src/pages/InterviewPage.tsx` — 分栏重构
  - 新增: `DashboardCard`, `FeatureGuideCard`, `UsageWidget` 组件

## ADDED Requirements

### Requirement: 增强 Light 主题品质感
系统 SHALL 在保留现有 Dark 主题不变的前提下，增强 Light 主题的视觉品质：
- Light 模式主背景增加微妙的浅蓝-紫渐变氛围（`radial-gradient` 光晕效果，低透明度）
- 卡片使用 `rgba(255,255,255,0.8)` + `backdrop-filter: blur(12px)` 半透明白（非纯白）
- 文字层级更清晰：主文字 #0f172a / 次要 #475569 / 占位 #94a3b8
- 边框使用 `rgba(0,0,0,0.06)` 极淡分割线
- 圆角保持 12-16px（与 Dark 模式一致）

#### Scenario: Light 模式呈现高品质视觉效果
- **WHEN** 用户切换至 Light 模式
- **THEN** 页面呈现柔和渐变背景 + 毛玻璃质感卡片 + 清晰文字层级，整体感觉现代且专业（非智面星的纯白扁平风）

### Requirement: 侧边栏导航结构优化（保留 IntervAI 特色）
系统 SHALL 优化侧边栏导航结构，参考智面星的功能模块化思路，同时保留 IntervAI 的 AI 对话核心能力：
- **主导航区域**（图标 + 文字）：
  - 主页 (HomeOutlined) → `/` 或 `/chat`
  - AI模拟面试 (UserOutlined) → `/role-play`
  - AI面试精灵 (RobotOutlined) → `/interview`
  - 简历管理 (FileTextOutlined) → `/resumes`
  - 充值中心 (WalletOutlined) → `/pricing`
- **保留区域**（收起时可隐藏）：
  - 「+ 新建对话」按钮（gradient-button 样式优化）
  - 聊天历史搜索框
  - 最近会话列表（滚动区域）
- **管理员区域**（保持不变）：Admin 相关菜单项
- 激活态：Indigo 左侧色条 + `rgba(99,102,241,0.1)` 背景（保留品牌色）
- 宽度保持 280px（折叠 80px）

#### Scenario: 侧边栏正确展示优化的导航结构
- **WHEN** 用户打开桌面端应用
- **THEN** 侧边栏顶部显示主导航项（功能模块），下方保留新建对话和聊天历史区域

### Requirement: 首页欢迎页重构为仪表盘卡片布局
系统 SHALL 将 ChatWelcome 重构为参考智面星信息架构的仪表盘布局，但使用 IntervAI 自身的 glass-card 视觉风格：
- **问候区**：「Hi, [时间段] 好」+ 用户头像 + 使用量概览（免费版/专业版标签 + 剩余次数）
- **简历引导卡**（glass-card）：大标题 + 描述 + 「去上传简历」CTA 按钮（gradient-button）
- **功能入口区域**（2 列 grid）：
  - AI模拟面试卡（Indigo 色调 glass-card）：标题 + 描述 + 「立即开始」按钮
  - AI面试精灵卡（Purple 色调 glass-card）：标题 + 描述 + 「立即开始」按钮
- **快捷操作区**（可选保留）：原有 4 宫格快捷入口缩小为次要操作区
- 整体最大宽度 1200px 居中，响应式适配

#### Scenario: 首页空状态展示完整仪表盘
- **WHEN** 用户进入首页且无活跃对话
- **THEN** 展示问候区 + 简历引导卡 + 功能入口卡的仪表盘布局，使用 glass-card 风格

### Requirement: 定价页面增强为 Tab + 三列卡片布局
系统 SHALL 增强 PricingPage 的信息架构：
- **顶部 Tab 栏**：充值（默认）| 我的订单 | 使用记录（Tab 使用 Ant Design Tabs 组件，Indigo 下划线高亮）
- **礼包购买区**（三列 Card）：
  - 基础礼包：标准 glass-card，价格 + 功能清单（Check 图标）
  - 高级礼包（推荐）：高亮 glass-card（indigo 边框 glow + "最受欢迎"标签），大字号价格 + CTA 按钮
  - 尊享礼包：暖色调 glass-card（subtle purple/warm tint），价格 + 功能清单
- **积分/次数购买区**：标题说明 + 横向档位选择（100次/200次/1000次），每档显示价格和"热门"标签
- 所有卡片使用 glass-card 风格，非纯白扁平

#### Scenario: 定价页面展示完整的套餐和积分选项
- **WHEN** 用户访问定价页
- **THEN** 顶部 Tab + 三列定价卡（中间高亮）+ 积分购买区的完整布局

### Requirement: 模拟面试页面重构为左右分栏
系统 SHALL 将 RolePlayPage 重构为参考智面星的左右分栏布局，但使用 IntervAI 的 glass-morphism 风格：
- **顶部 Tab**：开始模拟（默认）| 模拟记录（Ant Design Tabs）
- **左侧区域（~55%）**：
  - 产品介绍封面区（glass-panel，含渐变背景 + 播放按钮 icon + 标题「3分钟学会使用 IntervAI 模拟面试」）
  - 功能特性列表（4 项，每项：icon + 标题 + 描述文字）：
    - 面试设置 → 录音测试 → 开始面试 → 查看报告
  - 使用 FeatureGuideCard 子组件
- **右侧区域（~40%，glass-card）**：
  - 表单字段：个人简历（上传）、岗位选择(Select)、面试语言(Select)、输入音源(Select)、音频采集(Switch)、面试精灵(Switch)
  - 底部：「开始面试」按钮（gradient-button，全宽）

#### Scenario: 模拟面试配置页正确展示分栏布局
- **WHEN** 用户访问模拟面试页面
- **THEN** 左侧展示产品引导区（glass-panel），右侧展示配置表单（glass-card）

### Requirement: 面试精灵页面采用相同分栏模式
系统 SHALL 对 InterviewPage 应用与 RolePlayPage 一致的左右分栏模式和视觉风格，左侧展示面试精灵的产品介绍和功能特性，右侧为面试精灵专属配置表单。

#### Scenario: 面试精灵页面正确展示
- **WHEN** 用户访问面试精灵页面
- **THEN** 展示与模拟面试页面一致的分栏布局和 glass-morphism 风格

### Requirement: 全局使用量浮动组件
系统 SHALL 在 AppLayout 中集成一个固定于左下角的浮动使用量组件（UsageWidget）：
- 显示当前套餐等级（免费版/专业版）
- 显示剩余使用次数（模拟面试 N 次 / 面试精灵 N 次）
- 可收起/展开（点击切换）
- 使用 glass-morphism 风格（半透明背景 + blur + 微妙边框）
- 包含 IntervAI Logo 小图标
- 仅在已登录状态下显示

#### Scenario: 使用量组件在所有受保护页面可见
- **WHEN** 已登录用户浏览任何页面
- **THEN** 左下角显示可收起的使用量浮动组件，数据与账户同步

## MODIFIED Requirements
无（全新 UI 层面优化，不修改业务逻辑需求）

## REMOVED Requirements
无（纯 UI 结构和布局层面的优化，不删除任何功能）
