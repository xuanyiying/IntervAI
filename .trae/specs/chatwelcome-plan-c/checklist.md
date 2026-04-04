# Checklist

## Task 1: ChatWelcome 布局重构（方案 C）
- [x] 上传简历引导 DashboardCard 已从 ChatWelcome.tsx 中移除
- [x] AI 模拟面试 DashboardCard 已移除
- [x] AI 面试精灵 DashboardCard 已移除
- [x] 布局顺序为：问候区 → 输入框 → 快捷按钮（输入框为视觉核心）
- [x] 4 个快捷按钮均包裹 Tooltip 组件，悬停显示功能简介
- [x] 输入框 placeholder 更新为增强文案

## Task 2: 国际化
- [x] `getGreeting()` 使用 `t()` 函数，支持中英文切换
- [x] 问候副标题使用 `t('chat.welcome_subtitle')`
- [x] 额度 Tag 使用 `t('quota.free_available')`
- [x] 输入框 placeholder 使用 `t('chat.placeholder_enhanced')`
- [x] zh-CN.json 包含所有新增翻译 key
- [x] en-US.json 包含对应的英文翻译
- [x] 无残留硬编码中文文本（不含注释和 fallback 默认值）

## Task 3: CSS 样式更新
- [x] `.dashboard-welcome` 适配新布局（输入框置顶、无卡片间距）
- [x] `.modern-sender-wrapper` 紧贴问候区下方，间距合理
- [x] `.quick-launch-grid` 位于输入框正下方，间距合理（居中 600px）
- [x] Light 模式下输入框有可见的 border 或背景（半透明白 + 细边框 + 微阴影）
- [x] 无废弃的卡片相关 CSS 规则残留影响渲染

## Task 4: 构建验证
- [x] `pnpm --filter @interview-ai/frontend build` 构建成功（exit code 0）✅
- [x] lint 检查通过 — 修改文件 0 errors ✅

## 视觉验证
- [x] 页面无功能卡片（上传简历 / AI模拟面试 / AI面试精灵卡片均已消失）
- [x] 输入框位于页面上半部分，是视觉焦点
- [x] 问候区 → 输入框 → 快捷按钮 流畅过渡，无明显断层
- [x] 快捷按钮 tooltip 悬停正常显示
