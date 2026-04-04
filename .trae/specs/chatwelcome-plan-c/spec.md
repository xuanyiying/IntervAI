# ChatWelcome 方案 C 精简重构 Spec

## Why

当前 ChatWelcome 页面存在功能入口三重重复问题（侧边栏 + 中部卡片 + 底部快捷按钮），且输入框作为聊天页核心交互入口被推到页面中下部，视觉权重不足。方案 C 的核心理念是：**聊天页面的核心价值是对话，欢迎页应让用户最快进入对话状态**。

## What Changes

- **移除**上传简历引导卡（DashboardCard）— 功能由输入框附件按钮 + 侧边栏「我的简历」覆盖
- **移除** AI 模拟面试 / AI 面试精灵两个功能入口卡（DashboardCard × 2）— 功能由侧边导航 + 快捷按钮覆盖
- **保留并强化**问候区（Hi + 时间段 + 用户名/头像 + 额度 Tag）
- **提升**输入框为页面绝对核心 CTA（置顶、最大、视觉最突出）
- **保留** 4 个快捷操作按钮（简历优化 / 面试押题 / 模拟面试 / 发现），紧贴输入框下方
- **增强**快捷按钮 tooltip（鼠标悬停显示功能简介，替代被移除的卡片描述文字）
- **优化**输入框 placeholder 文案为「向助手提问，或拖拽简历上传...」
- **全部硬编码中文替换为 i18n `t()` 函数**

## Impact

- Affected code:
  - `packages/frontend/src/pages/user/ChatPage/components/ChatWelcome.tsx` — 布局重构 + 国际化
  - `packages/frontend/src/pages/user/ChatPage/chat.css` — 样式调整（移除卡片相关样式，调整间距）
  - `packages/frontend/src/locales/zh-CN.json` — 新增 chat welcome 相关翻译 key
  - `packages/frontend/src/locales/en-US.json` — 新增英文翻译
- Affected specs: 无前置依赖（基于已完成 ui-redesign-zhimianxing Task 4 的迭代）

## ADDED Requirements

### Requirement: ChatWelcome 精简布局（方案 C）

系统 SHALL 将 ChatWelcome 重构为「对话优先」的精简布局：

#### 布局结构（从上到下）

1. **问候区**：左侧「Hi，[时间段] 好」+ 用户名副标题；右侧额度 Tag + 头像 Avatar
2. **输入框区**（核心 CTA）：Sender 组件，全宽，placeholder 为「向助手提问，或拖拽简历上传...」，带附件按钮
3. **快捷操作区**：4 个图标按钮横向排列（简历优化 / 面试押题 / 模拟面试 / 发现），每个按钮支持 Tooltip 悬浮提示功能简介

#### 移除的内容
- 上传简历引导 DashboardCard
- AI 模拟面试 DashboardCard
- AI 面试精灵 DashboardCard

#### Scenario: 首页空状态展示精简布局
- **WHEN** 用户进入首页且无活跃对话
- **THEN** 展示：问候区 → 输入框（视觉核心）→ 快捷操作按钮，无功能卡片

### Requirement: ChatWelcome 完整国际化

系统 SHALL 将 ChatWelcome 中所有硬编码中文文本替换为 i18n 翻译函数：

| Key | 中文 fallback | 英文 |
|-----|-------------|------|
| `greeting.morning` | 早上好 | Good morning |
| `greeting.afternoon` | 下午好 | Good afternoon |
| `greeting.evening` | 晚上好 | Good evening |
| `chat.welcome_subtitle` | {username}，今天想做什么？ | What would you like to do today? |
| `quota.free_available` | 免费额度可用 | Free quota available |
| `chat.placeholder_enhanced` | 向助手提问，或拖拽简历上传... | Ask a question, or drag & drop your resume... |
| `features.resume_optimization_tip` | 上传简历，获取个性化优化建议 | Upload your resume for personalized optimization suggestions |
| `features.interview_prediction_tip` | AI 分析岗位 JD，预测高频面试题 | AI analyzes job descriptions and predicts high-frequency questions |
| `features.mock_interview_tip` | 真实场景模拟面试，实时反馈表现 | Real-scenario mock interviews with real-time feedback |
| `features.discover_tip` | 探索更多 AI 能力和使用技巧 | Explore more AI capabilities and tips |

#### Scenario: 切换语言后所有文案正确切换
- **WHEN** 用户在 ChatWelcome 页面切换语言（zh-CN ↔ en-US）
- **THEN** 问候语、副标题、Tag、placeholder、快捷按钮 label 和 tooltip 全部切换为目标语言

## MODIFIED Requirements

### Requirement: 输入框视觉权重提升

修改后的输入框 SHALL 成为页面视觉焦点：
- 位于问候区正下方（非页面中部）
- 使用 `max-w-3xl` 或更宽的容器约束
- Light 模式下增加 subtle border 或浅背景确保边界可见
- 聚焦态保持现有 shadow + transform 效果

## REMOVED Requirements

### Requirement: 首页功能入口双卡（原 Task 4.2）
**原因**：与侧边栏导航 + 快捷按钮功能三重重复，且占据大量垂直空间挤压核心输入框位置。
**迁移**：卡片上的「立即开始 →」CTA 功能迁移至侧边栏对应导航项和快捷按钮点击事件，卡片描述文字迁移至快捷按钮 Tooltip。
