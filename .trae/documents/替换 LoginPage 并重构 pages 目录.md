## 现状结论（基于代码现状）

* 语言切换“按钮不显示”的根因在 [AppLayout.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/layouts/AppLayout.tsx)：移动端头部的语言 Dropdown 是自闭合写法，没有任何触发子节点（children），因此 UI 上不会渲染出可点击入口；桌面端头部也完全没有语言入口。

* 语言持久化其实已经在 [i18n.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/i18n.ts) 通过 i18next-browser-languagedetector 配好了（order 包含 localStorage，caches 也包含 localStorage/cookie），但当前布局页缺少明确的“写入/读取”兜底逻辑，且语言选项文案 key（common.lang\_cn/common.lang\_en）在资源文件中缺失。

* 项目中存在大量未国际化的静态文本（中文/英文混用），并且日期/时间/数字格式化普遍直接使用 toLocaleString/toLocaleDateString，未绑定 i18n 当前语言（例如 [InviteCodeManagementPage.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/pages/InviteCodeManagementPage.tsx#L95-L169)、[ResumeDetailHeader.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/components/MyResumes/ResumeDetailHeader.tsx#L57-L120)）。

## 目标

1. 让语言切换入口在移动端与桌面端都可见、可用。
2. 语言选择稳定持久化到 localStorage：刷新/重进保持。
3. 全面补齐 i18n：静态文案全部走 t()；日期/数字/货币遵循当前语言格式；语言切换在全站一致生效。

## 实施计划（你确认后我会开始改代码）

### 1) 修复 AppLayout 语言切换入口显示

* 在移动端 Header：把当前自闭合的 \<Dropdown ... /> 改为“Dropdown + 触发 Button/Avatar/图标按钮”结构；增加 trigger={\['click']}。

* 在桌面端 Header：补齐同款语言切换入口（与主题切换按钮并排，样式复用现有 theme-toggle-btn 或新增 lang-toggle-btn）。

* 菜单结构优化：把当前“lang 分组 + children 子菜单”改成直接两项（中文/English），减少多一层 submenu 的交互成本。

### 2) 语言持久化：localStorage 写入 + 初始化读取兜底

* 继续保留 [i18n.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/i18n.ts) 现有 detector（它已支持 localStorage/cookie）。

* 在 [AppLayout.tsx](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/layouts/AppLayout.tsx) 内封装 setLanguage：

  * normalizeLanguage → i18n.changeLanguage → try/catch 写入 localStorage（使用 i18next 默认键 i18nextLng，避免多套键名）。

* 在 AppLayout 首次渲染 useEffect 中做兜底：

  * 读取 localStorage.i18nextLng（或 detector 写入值），normalize 后若与 i18n.resolvedLanguage 不一致则 changeLanguage；避免循环（加条件判断）。

* 补齐语言菜单所需资源 key：在 [zh-CN.json](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/locales/zh-CN.json) / [en-US.json](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/locales/en-US.json) 增加 common.lang\_cn/common.lang\_en。

### 3) 全站 i18n 覆盖审查与补齐

* 审查范围：pages、components、services（用户可见错误/提示）、config 中的展示文案。

* 识别方法（自动化 + 人工复核）：

  * 扫描所有 TS/TSX 中出现的中文字符与硬编码英文 UI 文案；对 antd 的 Modal/Popconfirm/message/notification 的 title/content/okText/cancelText 重点处理。

  * 汇总“未被 t() 包裹”的字符串清单（按文件分组输出），作为改动对照表。

* 修复策略：

  * 将硬编码文案替换为 t('xxx.yyy')；原中文/英文作为资源文件中的 value，不再依赖 fallback 参数。

  * 补齐缺失 key 到资源文件（保持命名分域：common/menu/auth/resume/chat/admin/prompts 等）。

  * 针对目前明显未国际化页面（示例：InviteCodeManagementPage 多处英文硬编码、ResumeDetailHeader 多处中文 tooltip/标签）优先完成。

### 4) 动态内容国际化（日期/数字/货币）

* 在现有 [i18n.ts](file:///Users/yiying/dev-app/ai-resume/packages/frontend/src/i18n.ts) 扩展导出格式化工具（避免新建文件）：

  * formatDate / formatDateTime / formatTime / formatNumber / formatCurrency：内部用 Intl.\* 并强制使用 normalizeLanguage(i18n.language)。

* 将仓库中 toLocaleString/toLocaleDateString/toLocaleTimeString 与数字 toLocaleString 的展示点替换为上述工具（基于已检索到的 30 处调用点逐一改）。

### 5) 验证

* 交互验证：

  * 语言按钮在移动端/桌面端均可见；点击后菜单可展开；切换语言立即生效。

  * 刷新页面后语言保持不变（localStorage 命中）。

* 覆盖验证：

  * 重新扫描代码：中文字符与硬编码英文 UI 文案显著减少/清零（排除必要的日志/调试字符串）。

  * 跑 lint/typecheck/tests（沿用项目现有脚本）。

## 交付物

* 修复后的 AppLayout 语言切换入口与持久化逻辑。

* zh-CN/en-US 资源文件补齐（含语言名等缺失 key）。

* 一份“未国际化文案 → 已替换”的按文件清单（在对话里给你）。

* 动态格式化统一后，全站语言切换一致生效。

