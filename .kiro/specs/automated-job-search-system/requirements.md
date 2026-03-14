# 需求文档：自动化求职系统

## 简介

自动化求职系统是一个基于 AI 智能代理的全流程求职自动化平台。系统通过主控 Agent 协调 7 个专业 Agent（简历优化、职位搜索、匹配分析、投递执行、面试协调、面试准备、跟进提醒），实现从简历优化到成功入职的全自动化求职流程。

系统采用 LangChain 框架构建 Agent，使用 NestJS 作为后端框架，PostgreSQL 作为主数据库，Redis 作为缓存层，ChromaDB 作为向量数据库，支持多种 LLM 提供商（OpenAI、Google Gemini、DeepSeek）。

## 术语表

- **System**: 自动化求职系统
- **Master_Agent**: 主控 Agent，负责协调所有专业 Agent 的工作
- **Resume_Agent**: 简历优化 Agent，负责简历解析、分析和优化
- **Job_Search_Agent**: 职位搜索 Agent，负责从多个数据源获取职位信息
- **Match_Agent**: 匹配分析 Agent，负责分析用户与职位的匹配度
- **Application_Agent**: 投递执行 Agent，负责自动投递简历
- **Interview_Agent**: 面试协调 Agent，负责面试时间安排和提醒
- **Prep_Agent**: 面试准备 Agent，负责生成面试准备计划
- **FollowUp_Agent**: 跟进提醒 Agent，负责投递和面试后的跟进
- **User**: 使用系统的求职者
- **LLM_Service**: 大语言模型服务，提供 AI 能力
- **Vector_DB**: 向量数据库，用于语义搜索
- **Job_Platform**: 招聘平台（如 LinkedIn、Indeed、Glassdoor）
- **Application**: 投递记录
- **Interview**: 面试记录
- **Match_Score**: 匹配分数，表示用户与职位的匹配程度

## 需求

### 需求 1：用户注册与认证

**用户故事**：作为求职者，我希望能够注册账号并安全登录系统，以便使用求职自动化服务。

#### 验收标准

1. WHEN 用户提供有效的邮箱和密码 THEN THE System SHALL 创建新用户账号
2. WHEN 用户提供的邮箱已被注册 THEN THE System SHALL 拒绝注册并返回错误提示
3. WHEN 用户使用正确的邮箱和密码登录 THEN THE System SHALL 生成 JWT 令牌并返回
4. WHEN 用户使用错误的密码登录 THEN THE System SHALL 拒绝登录并返回错误提示
5. THE System SHALL 使用 AES-256 加密存储用户密码
6. WHERE 用户启用多因素认证 THEN THE System SHALL 在登录时要求额外的验证码

### 需求 2：简历上传与解析

**用户故事**：作为求职者，我希望上传我的简历并让系统自动解析内容，以便系统了解我的背景和技能。

#### 验收标准

1. WHEN 用户上传 PDF、DOCX 或 TXT 格式的简历文件 THEN THE Resume_Agent SHALL 解析文件内容
2. WHEN 简历解析成功 THEN THE Resume_Agent SHALL 提取个人信息、教育背景、工作经验和技能列表
3. IF 简历文件格式不支持或内容无法解析 THEN THE Resume_Agent SHALL 返回错误信息并列出支持的格式
4. WHEN 简历解析完成 THEN THE System SHALL 将解析结果存储到数据库
5. THE Resume_Agent SHALL 在 3 秒内完成单个简历的解析
6. WHEN 简历文件上传成功 THEN THE System SHALL 将文件加密存储到对象存储服务

### 需求 3：简历质量分析与优化

**用户故事**：作为求职者，我希望系统分析我的简历质量并提供优化建议，以便提高简历的竞争力。

#### 验收标准

1. WHEN 简历解析完成 THEN THE Resume_Agent SHALL 使用 LLM_Service 分析简历质量
2. WHEN 简历分析完成 THEN THE Resume_Agent SHALL 生成总体评分（0.0 到 10.0）
3. WHEN 简历分析完成 THEN THE Resume_Agent SHALL 识别简历的优势和劣势
4. WHEN 简历分析完成 THEN THE Resume_Agent SHALL 生成具体的优化建议列表
5. WHEN 简历分析完成 THEN THE Resume_Agent SHALL 计算 ATS 兼容性分数（0.0 到 1.0）
6. WHEN 用户请求针对特定岗位优化简历 THEN THE Resume_Agent SHALL 生成定制版本的简历

### 需求 4：职位搜索与获取

**用户故事**：作为求职者，我希望系统根据我的技能和偏好自动搜索相关职位，以便发现合适的工作机会。

#### 验收标准

1. WHEN 用户设置职业目标和偏好 THEN THE Job_Search_Agent SHALL 生成搜索策略
2. WHEN 搜索策略生成完成 THEN THE Job_Search_Agent SHALL 从招聘平台 API 获取职位信息
3. WHEN 搜索策略生成完成 THEN THE Job_Search_Agent SHALL 使用 LLM_Service 从公开数据汇总职位
4. WHEN 搜索策略生成完成 THEN THE Job_Search_Agent SHALL 从企业官网提取招聘信息
5. WHEN 职位数据获取完成 THEN THE Job_Search_Agent SHALL 使用向量相似度和 LLM 语义分析过滤不相关职位
6. WHEN 相同职位从多个来源获取 THEN THE System SHALL 根据外部 URL 和平台去重
7. THE Job_Search_Agent SHALL 每小时获取至少 5000 个相关岗位
8. WHEN 发现新职位 THEN THE Job_Search_Agent SHALL 主动通知用户

### 需求 5：职位匹配分析

**用户故事**：作为求职者，我希望系统分析我与职位的匹配程度，以便了解哪些职位最适合我。

#### 验收标准

1. WHEN 用户查看职位详情 THEN THE Match_Agent SHALL 计算用户与职位的匹配分数
2. WHEN 匹配分数计算完成 THEN THE Match_Agent SHALL 提供技能匹配、经验匹配、教育匹配、地点匹配、薪资匹配和文化匹配的详细评分
3. WHEN 匹配分数计算完成 THEN THE Match_Agent SHALL 识别用户已匹配的技能和缺失的技能
4. WHEN 匹配分数计算完成 THEN THE Match_Agent SHALL 使用 LLM_Service 生成匹配解释
5. WHEN 匹配分数计算完成 THEN THE Match_Agent SHALL 预测申请成功率
6. THE Match_Agent SHALL 在 1 秒内完成单次匹配计算
7. WHEN 用户画像和职位要求未变化 THEN THE Match_Agent SHALL 返回相同的匹配分数

### 需求 6：智能职位推荐

**用户故事**：作为求职者，我希望系统根据匹配度智能推荐职位，以便快速找到最合适的工作机会。

#### 验收标准

1. WHEN 用户请求职位推荐 THEN THE Match_Agent SHALL 对所有职位进行匹配评分
2. WHEN 匹配评分完成 THEN THE Match_Agent SHALL 按匹配分数降序排列职位
3. WHEN 推荐列表生成 THEN THE System SHALL 返回排序后的职位列表
4. WHERE 用户设置了偏好过滤条件 THEN THE Match_Agent SHALL 仅推荐符合条件的职位

### 需求 7：自动投递简历

**用户故事**：作为求职者，我希望系统自动投递简历到选定的职位，以便节省手动投递的时间。

#### 验收标准

1. WHEN 用户选择职位并确认投递 THEN THE Application_Agent SHALL 生成个性化求职信
2. WHEN 求职信生成完成 THEN THE Application_Agent SHALL 通过招聘平台 API 提交申请
3. IF 平台 API 不可用或认证失败 THEN THE Application_Agent SHALL 标记投递状态为失败并通知用户
4. WHEN 投递失败 THEN THE Application_Agent SHALL 自动重试最多 3 次
5. WHEN 投递成功 THEN THE System SHALL 创建投递记录并设置状态为已提交
6. WHEN 用户已投递相同职位且状态不是已撤回或已拒绝 THEN THE System SHALL 拒绝重复投递

### 需求 8：投递状态跟踪

**用户故事**：作为求职者，我希望系统跟踪我的投递状态，以便了解申请进展。

#### 验收标准

1. WHEN 投递记录创建 THEN THE System SHALL 初始化状态为草稿或已提交
2. WHEN 投递状态变化 THEN THE System SHALL 记录状态变更历史
3. WHEN 投递状态变化 THEN THE System SHALL 验证状态转换是否合法
4. IF 状态转换不合法 THEN THE System SHALL 拒绝状态变更并返回错误
5. THE Application_Agent SHALL 定期检查投递状态并更新记录
6. WHEN 投递状态更新 THEN THE System SHALL 通知用户

### 需求 9：面试时间安排

**用户故事**：作为求职者，我希望系统帮助我安排面试时间，以便避免时间冲突。

#### 验收标准

1. WHEN 用户收到面试邀请 THEN THE Interview_Agent SHALL 解析邀请邮件内容
2. WHEN 面试邀请解析完成 THEN THE Interview_Agent SHALL 提取面试时间、地点和面试官信息
3. WHEN 用户创建新面试 THEN THE Interview_Agent SHALL 检查是否与已有面试时间冲突
4. IF 新面试与已有面试时间重叠 THEN THE Interview_Agent SHALL 拒绝创建并返回冲突的面试详情
5. WHEN 面试创建成功 THEN THE System SHALL 将面试信息同步到用户日历
6. WHEN 用户请求重新安排面试 THEN THE Interview_Agent SHALL 更新面试时间并通知相关方

### 需求 10：面试提醒

**用户故事**：作为求职者，我希望系统在面试前提醒我，以便我不会错过面试。

#### 验收标准

1. WHERE 用户启用面试提醒 THEN THE Interview_Agent SHALL 在面试前发送提醒通知
2. WHEN 面试提醒启用 THEN THE Interview_Agent SHALL 在设定的提前时间发送提醒
3. WHEN 发送面试提醒 THEN THE System SHALL 包含面试时间、地点和准备建议
4. WHEN 面试时间变更 THEN THE Interview_Agent SHALL 取消原有提醒并创建新提醒

### 需求 11：面试准备计划生成

**用户故事**：作为求职者，我希望系统生成面试准备计划，以便我有针对性地准备面试。

#### 验收标准

1. WHEN 面试确认后 THEN THE Prep_Agent SHALL 分析职位要求和公司信息
2. WHEN 分析完成 THEN THE Prep_Agent SHALL 使用 LLM_Service 生成准备计划
3. WHEN 准备计划生成 THEN THE Prep_Agent SHALL 包含技术技能、行为问题、公司研究、行业知识、案例分析和编程练习等主题
4. WHEN 准备计划生成 THEN THE Prep_Agent SHALL 为每个主题设置优先级和预计学习时间
5. WHEN 准备计划生成 THEN THE Prep_Agent SHALL 创建学习时间线，确保结束日期在面试日期之前
6. WHEN 准备计划生成 THEN THE Prep_Agent SHALL 推荐相关学习资源

### 需求 12：模拟面试

**用户故事**：作为求职者，我希望系统提供模拟面试功能，以便我练习面试技巧。

#### 验收标准

1. WHEN 用户请求模拟面试 THEN THE Prep_Agent SHALL 使用 LLM_Service 生成面试问题
2. WHEN 用户回答问题 THEN THE Prep_Agent SHALL 使用 LLM_Service 评估回答质量
3. WHEN 回答评估完成 THEN THE Prep_Agent SHALL 提供改进建议
4. WHEN 模拟面试结束 THEN THE Prep_Agent SHALL 生成整体表现报告

### 需求 13：面试准备进度跟踪

**用户故事**：作为求职者，我希望系统跟踪我的面试准备进度，以便了解准备情况。

#### 验收标准

1. WHEN 用户完成准备主题 THEN THE System SHALL 标记主题为已完成
2. WHEN 准备主题状态变化 THEN THE Prep_Agent SHALL 重新计算整体进度
3. WHEN 进度计算完成 THEN THE System SHALL 确保进度等于已完成主题数除以总主题数
4. WHEN 用户查看准备计划 THEN THE System SHALL 显示当前进度百分比

### 需求 14：投递后自动跟进

**用户故事**：作为求职者，我希望系统在适当时机自动跟进投递，以便提高获得回复的机会。

#### 验收标准

1. WHEN 投递后一定时间未收到回复 THEN THE FollowUp_Agent SHALL 判断是否需要跟进
2. WHEN 需要跟进 THEN THE FollowUp_Agent SHALL 使用 LLM_Service 生成跟进邮件
3. WHEN 跟进邮件生成完成 THEN THE FollowUp_Agent SHALL 发送邮件到招聘方
4. WHEN 跟进邮件发送 THEN THE System SHALL 记录跟进历史

### 需求 15：面试后感谢信

**用户故事**：作为求职者，我希望系统在面试后自动发送感谢信，以便保持良好的印象。

#### 验收标准

1. WHEN 面试完成 THEN THE FollowUp_Agent SHALL 使用 LLM_Service 生成感谢信
2. WHEN 感谢信生成完成 THEN THE FollowUp_Agent SHALL 在面试后 24 小时内发送
3. WHEN 感谢信发送 THEN THE System SHALL 记录发送历史

### 需求 16：Offer 管理与比较

**用户故事**：作为求职者，我希望系统帮助我管理和比较多个 Offer，以便做出最佳选择。

#### 验收标准

1. WHEN 用户收到 Offer THEN THE System SHALL 记录 Offer 详情
2. WHEN 用户有多个 Offer THEN THE FollowUp_Agent SHALL 使用 LLM_Service 生成比较分析
3. WHEN 比较分析生成 THEN THE FollowUp_Agent SHALL 从薪资、福利、公司文化、职业发展等维度对比
4. WHEN 用户需要谈判 Offer THEN THE FollowUp_Agent SHALL 提供谈判策略建议

### 需求 17：主控 Agent 协调

**用户故事**：作为系统，我需要主控 Agent 协调所有专业 Agent 的工作，以便实现全流程自动化。

#### 验收标准

1. WHEN 用户初始化求职任务 THEN THE Master_Agent SHALL 理解用户的职业目标和需求
2. WHEN 职业目标确定 THEN THE Master_Agent SHALL 生成整体求职策略
3. WHEN 求职策略生成 THEN THE Master_Agent SHALL 将策略分解为可执行的子任务
4. WHEN 子任务创建 THEN THE Master_Agent SHALL 分配任务给相应的专业 Agent
5. WHILE 任务执行中 THEN THE Master_Agent SHALL 监控各 Agent 的执行进度
6. WHEN 任务执行遇到问题 THEN THE Master_Agent SHALL 调整策略并重新分配任务
7. WHEN 关键决策点到达 THEN THE Master_Agent SHALL 与用户交互确认

### 需求 18：Agent 记忆与学习

**用户故事**：作为系统，我需要 Agent 能够记忆历史交互并从中学习，以便提供更个性化的服务。

#### 验收标准

1. WHEN Agent 与用户交互 THEN THE System SHALL 将交互历史存储到记忆存储
2. WHEN Agent 执行任务 THEN THE System SHALL 从记忆存储中检索相关历史信息
3. WHEN 用户提供反馈 THEN THE System SHALL 更新 Agent 的学习模型
4. WHEN Agent 做出决策 THEN THE System SHALL 参考历史成功案例

### 需求 19：数据缓存与性能优化

**用户故事**：作为系统，我需要缓存热门数据以提高响应速度，以便为用户提供流畅的体验。

#### 验收标准

1. WHEN 职位数据被频繁访问 THEN THE System SHALL 将数据缓存到 Redis
2. WHEN 缓存的职位数据超过 1 小时 THEN THE System SHALL 使缓存失效
3. WHEN 用户匹配结果计算完成 THEN THE System SHALL 缓存结果 6 小时
4. WHEN 简历解析完成 THEN THE System SHALL 永久缓存解析结果直到简历更新
5. THE System SHALL 确保 95% 的 API 请求在 500ms 内响应

### 需求 20：API 限流与安全

**用户故事**：作为系统，我需要实施 API 限流和安全措施，以便防止滥用和保护用户数据。

#### 验收标准

1. THE System SHALL 限制每个用户每分钟最多 100 个 API 请求
2. WHEN 用户超过请求限制 THEN THE System SHALL 返回 HTTP 429 错误
3. THE System SHALL 使用 HTTPS 加密所有网络通信
4. THE System SHALL 使用 JWT 验证所有 API 请求的身份
5. WHEN 检测到异常访问模式 THEN THE System SHALL 记录审计日志并发送告警
6. THE System SHALL 加密存储所有敏感用户数据

### 需求 21：错误处理与降级

**用户故事**：作为系统，我需要优雅地处理错误并提供降级服务，以便在部分服务不可用时仍能运行。

#### 验收标准

1. IF 招聘平台 API 不可用 THEN THE Job_Search_Agent SHALL 切换到备用数据源
2. IF LLM_Service 不可用 THEN THE System SHALL 降级到基于规则的简单匹配
3. WHEN 服务降级 THEN THE System SHALL 通知用户部分功能受限
4. WHEN 外部 API 调用失败 THEN THE System SHALL 自动重试最多 3 次
5. IF 重试仍然失败 THEN THE System SHALL 记录错误日志并通知运维团队
6. WHEN 发生错误 THEN THE System SHALL 返回清晰的错误信息和建议操作

### 需求 22：异步任务处理

**用户故事**：作为系统，我需要异步处理耗时任务，以便不阻塞用户请求。

#### 验收标准

1. WHEN 简历分析请求提交 THEN THE System SHALL 将任务加入消息队列
2. WHEN 批量投递请求提交 THEN THE System SHALL 创建后台任务
3. WHEN 职位获取任务创建 THEN THE System SHALL 使用分布式任务调度执行
4. WHEN 异步任务完成 THEN THE System SHALL 通知用户任务结果
5. WHEN 异步任务失败 THEN THE System SHALL 记录失败原因并支持手动重试

### 需求 23：数据导出与隐私

**用户故事**：作为求职者，我希望能够导出我的数据并删除账号，以便行使数据隐私权利。

#### 验收标准

1. WHEN 用户请求导出数据 THEN THE System SHALL 生成包含所有用户数据的文件
2. WHEN 数据导出完成 THEN THE System SHALL 提供下载链接
3. WHEN 用户请求删除账号 THEN THE System SHALL 删除所有个人数据
4. WHEN 账号删除完成 THEN THE System SHALL 确认删除并注销所有会话
5. THE System SHALL 遵守 GDPR 和相关隐私法规

### 需求 24：多语言支持

**用户故事**：作为求职者，我希望系统支持多种语言，以便使用我熟悉的语言。

#### 验收标准

1. WHERE 用户设置了首选语言 THEN THE System SHALL 使用该语言显示界面
2. WHEN LLM_Service 生成内容 THEN THE System SHALL 使用用户的首选语言
3. THE System SHALL 至少支持中文和英文

### 需求 25：实时通知

**用户故事**：作为求职者，我希望实时收到重要事件的通知，以便及时响应。

#### 验收标准

1. WHEN 新职位匹配用户偏好 THEN THE System SHALL 通过 WebSocket 推送实时通知
2. WHEN 投递状态变化 THEN THE System SHALL 发送通知到用户
3. WHEN 面试时间临近 THEN THE System SHALL 发送提醒通知
4. WHERE 用户启用邮件通知 THEN THE System SHALL 同时发送邮件通知
5. WHERE 用户启用移动推送 THEN THE System SHALL 发送推送通知到移动设备

### 需求 26：系统监控与日志

**用户故事**：作为系统管理员，我希望监控系统运行状态和查看日志，以便及时发现和解决问题。

#### 验收标准

1. THE System SHALL 使用 Prometheus 收集性能指标
2. THE System SHALL 记录所有 API 请求和响应的日志
3. WHEN 发生错误 THEN THE System SHALL 记录详细的错误堆栈
4. THE System SHALL 使用 Sentry 追踪和报告错误
5. THE System SHALL 提供健康检查端点供监控系统调用
6. WHEN 关键服务不可用 THEN THE System SHALL 发送告警通知

### 需求 27：向量搜索与语义匹配

**用户故事**：作为系统，我需要使用向量搜索实现语义匹配，以便更准确地匹配用户和职位。

#### 验收标准

1. WHEN 职位数据获取完成 THEN THE System SHALL 使用 LLM_Service 生成职位描述的向量嵌入
2. WHEN 用户简历解析完成 THEN THE System SHALL 生成用户技能和经验的向量嵌入
3. WHEN 计算匹配分数 THEN THE Match_Agent SHALL 使用向量相似度作为匹配维度之一
4. THE System SHALL 将向量嵌入存储到 ChromaDB
5. WHEN 用户搜索职位 THEN THE System SHALL 使用向量相似度检索相关职位

### 需求 28：LLM 提供商管理

**用户故事**：作为系统，我需要支持多个 LLM 提供商并能够切换，以便提高可用性和降低成本。

#### 验收标准

1. THE System SHALL 支持 OpenAI、Google Gemini 和 DeepSeek 作为 LLM 提供商
2. WHERE 系统配置了首选 LLM 提供商 THEN THE System SHALL 优先使用该提供商
3. IF 首选 LLM 提供商不可用 THEN THE System SHALL 自动切换到备用提供商
4. THE System SHALL 加密存储所有 LLM API 密钥
5. THE System SHALL 监控 LLM API 调用成本和使用量
6. WHEN LLM API 调用超过预算阈值 THEN THE System SHALL 发送告警通知

### 需求 29：数据库事务与一致性

**用户故事**：作为系统，我需要确保数据库操作的事务性和一致性，以便保证数据完整性。

#### 验收标准

1. WHEN 创建投递记录 THEN THE System SHALL 在单个事务中更新投递表和状态历史表
2. IF 事务中任何操作失败 THEN THE System SHALL 回滚所有操作
3. WHEN 并发更新同一记录 THEN THE System SHALL 使用乐观锁或悲观锁防止冲突
4. THE System SHALL 确保外键约束的完整性
5. WHEN 删除用户 THEN THE System SHALL 级联删除或软删除相关数据

### 需求 30：容器化部署

**用户故事**：作为运维人员，我希望系统支持容器化部署，以便简化部署和扩展。

#### 验收标准

1. THE System SHALL 提供 Docker 镜像用于部署
2. THE System SHALL 提供 Docker Compose 配置用于本地开发
3. THE System SHALL 支持通过环境变量配置所有关键参数
4. THE System SHALL 支持在 Kubernetes 集群中部署
5. THE System SHALL 提供健康检查端点供容器编排系统使用
