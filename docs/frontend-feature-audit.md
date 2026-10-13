# IntervAI 前端功能盘点与精简建议

> 审计对象：`packages/frontend`
> 产品定位：**面试助手 —— 辅助面试时实时生成参考答案**
> 代码规模：`src` 下约 200 个文件，业务代码约 24,000 行

---

## 一、结论速览

按「是否服务于实时生成参考答案」这一核心目标，全部功能可分为四档：

| 档位 | 含义 | 页面数 | 代码量占比 |
|------|------|--------|-----------|
| P0 核心 | 直接支撑实时答案生成 | 1 | 约 9% |
| P1 支撑 | 为核心提供上下文（简历/JD） | 3 | 约 25% |
| P2 边缘 | 同属面试域但非实时链路 | 3 | 约 10% |
| P3 无关 | 与面试助手无关的通用 SaaS 能力 | 15 | 约 45% |
| 死代码 | 零引用文件 | — | 约 8% |

**核心结论：真正的核心功能只有 1 个页面（`InterviewPage`），其余约 55% 的代码属于边缘或无关功能。**

---

## 二、P0 · 核心功能（实时生成参考答案）

这是产品的唯一核心链路，必须保留并持续打磨。

| 文件 | 行数 | 作用 |
|------|------|------|
| `src/pages/user/InterviewPage.tsx` | 922 | 实时面试主页面，`assist` 辅助模式为核心 |
| `src/hooks/useInterviewSocket.ts` | 302 | WebSocket 长连接，接收流式答案 |
| `src/services/interview-service.ts` | 400 | 会话创建/查询/导出 |
| `src/components/VoiceInterviewCall.tsx` | 825 | 语音通话与音频采集 |
| `src/components/StreamingMarkdownBubble.tsx` | 44 | 流式 Markdown 渲染 |
| `src/stores/interviewStore.ts` | 22 | 面试会话状态 |

链路：`InterviewPage` → `useInterviewSocket`（WS 流式）→ `StreamingMarkdownBubble` 渲染；语音走 `VoiceInterviewCall`。

**重要发现：`InterviewPage` 内含两种模式** —— `assist`（用户贴出面试官问题，AI 生成参考答案，**这是核心**）与 `mock`（AI 反过来提问，属于模拟面试）。两种模式挤在同一个 922 行文件里，是首要拆分对象。

后端接口：`POST /interview/session`、`GET /interview/session/:id/current`、`GET /interview/sessions`、`GET /interview/export/:id`。

---

## 三、P1 · 支撑功能（为答案提供上下文）

生成高质量参考答案需要「简历 + JD」作为上下文，因此这部分应保留，但**可以大幅简化**。

| 模块 | 关键文件 | 行数 | 精简建议 |
|------|---------|------|---------|
| 简历上传解析 | `ChatPage/hooks/useResumeUpload.ts`、`components/ResumeUploadButton.tsx` | 523 | **保留**，这是上下文入口 |
| 我的简历 | `pages/user/MyResumesPage.tsx` + `components/MyResumes/*`（19 个文件） | 约 1,900 | **重度精简**，只需「选一份简历」，不需要分节展示/历史版本/预览弹窗 |
| 职位 JD | `components/JobInputDialog.tsx`、`JobInfoCard.tsx`、`services/job-service.ts` | 638 | **保留但简化**为一个输入框 |
| 简历构建器 | `components/ResumeBuilder/*`（8 个文件）、`ResumeBuilderPage.tsx` | 约 760 | **可移除**，在线编辑简历与面试实时辅助无关 |

---

## 四、P2 · 边缘功能（同属面试域，但非实时链路）

| 功能 | 文件 | 行数 | 判断 |
|------|------|------|------|
| 模拟面试（角色扮演） | `pages/user/RolePlayPage.tsx`、`components/RolePlayCard.tsx` | 685 | AI 反向提问，与「实时辅助」是不同产品形态 |
| 自我介绍生成 | `pages/user/PitchPerfectPage.tsx`、`components/PitchPerfectCard.tsx` | 500 | 独立小工具，非实时 |
| 面试押题 | 侧边栏「面试押题」入口 | — | **入口与「AI 面试精灵」指向同一个 `/interview` 路径，属于重复入口，应删掉一个** |
| 简历优化 | `ResumeOptimizationDialog`、`SuggestionCard`、`SuggestionsList`、`SuggestionDiffCard`、`ResumeComparisonDialog`、`InlineDiffViewer`、`optimizationStore` | 约 1,700 | 完整的简历优化产品线，与面试实时辅助无关 |
| 匹配度分析 | `MatchAnalysisCard`、`MatchAnalysisReport` | 611 | **且已是零引用死代码** |
| PDF 导出 | `PDFGenerationDialog`、`PDFGenerationCard`、`MarkdownPDFCard`、`PDFDownloadCard`、`generate-service` | 约 1,000 | 简历导出，非核心 |

---

## 五、P3 · 无关功能（通用 SaaS 能力，与面试助手无关）

这是代码量最大的一块，约占 45%。

### 5.1 支付与订阅（企业版 EE，5 个页面 + 2 组件）

| 文件 | 行数 |
|------|------|
| `ee/pages/marketing/PricingPage.tsx` | 428 |
| `pages/user/SubscriptionManagementPage.tsx` | 178 |
| `pages/user/AccountSubscriptionPage.tsx` | 235 |
| `pages/user/PaymentSuccessPage.tsx` / `PaymentCancelPage.tsx` | 123 |
| `pages/user/AccountUsagePage.tsx` | 395 |
| `components/SubscriptionStatus.tsx`、`UsageWidget`、`ee/components/GlobalQuotaListener.tsx` | 192 |
| `services/payment-service.ts`、`account-service.ts` | 131 |

合计约 1,680 行。已通过 `VITE_APP_EDITION` 开关隔离，OSS 版可整体裁掉。

### 5.2 管理后台（5 个页面，约 1,923 行）

| 文件 | 行数 | 说明 |
|------|------|------|
| `pages/admin/PromptManagementPage.tsx` | 531 | Prompt 版本管理 |
| `pages/admin/ModelManagementPage.tsx` | 530 | AI 模型配置 |
| `pages/admin/UserManagementPage.tsx` | 320 | 用户管理 |
| `pages/admin/SystemSettingsPage.tsx` | 273 | 系统设置 |
| `pages/admin/InviteCodeManagementPage.tsx` | 269 | 邀请码（EE） |

加上 `admin-service`、`model-admin-service`、`prompt-admin-service` 共 427 行 service。运营需要则保留，但应与主应用拆分部署。

### 5.3 认证与账户（8 个页面，约 1,455 行）

`LoginPage`(212)、`RegisterPage`(266)、`ResetPasswordPage`(183)、`ForgotPasswordPage`(100)、`VerifyEmailPage`(100)、`OAuthCallbackPage`(72)、`ProfilePage`(578)、`SettingsPage`(193)、`PasswordStrengthChecker`(90)。

基础设施，需保留。但 `ProfilePage` 578 行里含头像上传、活动历史、通知中心，明显过重，可砍到 150 行以内。

### 5.4 通用对话工作台（约 2,000 行）

`pages/user/ChatPage/*`（10 个文件，2,480 行）+ `useChatSocket`(244) + `conversationStore`(335) + `conversation-service`(106)。

这是一个**通用 AI 聊天工作台**，被设为首页（`/` 和 `/chat`）。与「面试实时辅助」是两套独立的对话系统（两个 socket hook、两套 store）。**这是最大的架构冗余点** —— 应考虑将实时面试作为首页，或把两套对话系统合并。

### 5.5 法务与合规

`TermsOfServicePage`(106)、`PrivacyPolicyPage`(125)、`CookieConsent`(73)。合规需要，保留。

---

## 六、死代码清单（零 import 引用，可直接删除）

已逐个验证，以下 11 个组件在整个 `src` 下**没有任何 import 引用**：

| 文件 | 行数 |
|------|------|
| `components/VoiceManager.tsx` | 275 |
| `components/MatchAnalysisReport.tsx` | 330 |
| `components/MatchAnalysisCard.tsx` | 281 |
| `components/RolePlayCard.tsx` | 359 |
| `components/InterviewAssistant.tsx` | 452 |
| `components/PersonaSelector.tsx` | 136 |
| `components/ResumeAnalysisDrawer.tsx` | 96 |
| `components/PDFDownloadCard.tsx` | 86 |
| `components/MyResumes/ResumeHistoryModal.tsx` | 87 |
| `components/MyResumes/ResumePreviewModal.tsx` | 73 |
| `components/DashboardCard/DashboardCard.tsx` | 47 |
| **合计** | **2,322** |

注意 `InterviewAssistant.tsx`(452) 和 `VoiceManager.tsx`(275) 听起来像核心功能，但实际已被 `InterviewPage` + `VoiceInterviewCall` 取代，属于重构遗留物。**删除这 11 个文件可立即减少 2,322 行代码，零风险。**

---

## 七、其他问题

1. **首页未鉴权**：`/` 和 `/chat` 没有包 `ProtectedRoute`，与其余所有页面不一致，疑似安全疏漏（`src/router/index.tsx` 第 92-99 行）。

2. **`/interview` 路由缺参数**：`InterviewPage` 内使用 `useParams<{ optimizationId }>()`，但路由定义为 `path: 'interview'` 未声明参数，该值恒为 `undefined`，页面靠内部逻辑兜底。

3. **侧边栏重复入口**：「AI 面试精灵」与「面试押题」两个菜单项都指向 `/interview`（`Sidebar.tsx` 第 219-241 行）。

4. **两套并行的实时通信**：`useChatSocket` 与 `useInterviewSocket` 各自维护 WS 连接与消息状态，逻辑高度重复。

5. **`InterviewPage` 922 行单文件**，混合了 assist/mock 双模式、内联 SVG 图标、会话管理、UI 渲染，急需拆分。

---

## 八、精简路线图

**第一步（零风险，立即可做）**：删除第六节的 11 个死代码文件，减少 2,322 行。

**第二步（明确边界）**：确认产品是否保留「简历优化」「PDF 导出」「简历构建器」这三条与核心无关的产品线。若不保留，可再减少约 3,500 行。

**第三步（架构收敛）**：将 `InterviewPage` 拆分为 `assist`（核心）与 `mock` 两个独立页面；合并两套 socket hook；把实时面试设为首页。

**第四步（按需裁剪）**：OSS 版通过 `VITE_APP_EDITION` 关闭支付订阅（约 1,680 行）；管理后台独立部署（约 2,350 行）；`ProfilePage` 瘦身。

全部执行后，前端业务代码可从约 24,000 行收敛到 8,000 行左右，聚焦于「实时生成参考答案」这一核心价值。
