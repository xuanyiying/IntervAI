# 需求文档

## 介绍

管理端Dashboard是一个综合性的管理平台，为系统管理员提供AI使用统计、用量监控、用户管理、系统统计和数据导出等核心管理功能。该系统基于现有的NestJS后端和React前端架构，利用已有的用户认证、配额管理、AI providers和监控模块，提供实时的系统洞察和管理能力。

## 术语表

- **System**: 管理端Dashboard系统
- **Admin**: 具有管理员角色(Role.ADMIN)的用户
- **AI_Call**: AI模型调用记录，包含请求和响应信息
- **Usage_Record**: 用量记录，包含token使用和成本信息
- **Quota**: 用户配额限制，包括API调用次数、token使用量等
- **Performance_Metrics**: 性能指标，包含模型调用成功率、延迟等统计数据
- **Time_Range**: 时间范围过滤器，支持今天、本周、本月、自定义等
- **Export_Format**: 导出格式，支持CSV和Excel
- **Alert_Threshold**: 告警阈值，用于监控用量超限
- **Dashboard_Widget**: Dashboard组件，展示关键指标的可视化卡片

## 需求

### 需求 1: 权限控制

**用户故事:** 作为系统管理员，我希望只有管理员角色才能访问管理端功能，以确保系统安全和数据隐私。

#### 验收标准

1. WHEN 用户访问管理端任何API端点 THEN THE System SHALL 验证用户是否具有ADMIN角色
2. IF 用户不具有ADMIN角色 THEN THE System SHALL 返回403 Forbidden错误
3. WHEN 用户登录成功且具有ADMIN角色 THEN THE System SHALL 允许访问所有管理端功能
4. THE System SHALL 在AuditLog中记录所有管理员操作

### 需求 2: AI使用统计

**用户故事:** 作为系统管理员，我希望查看所有用户的AI调用统计，以便了解系统使用情况和优化资源分配。

#### 验收标准

1. WHEN Admin请求AI调用统计 THEN THE System SHALL 返回按模型分组的调用次数、成功率和失败率
2. WHEN Admin指定时间范围 THEN THE System SHALL 返回该时间范围内的统计数据
3. WHEN Admin请求按用户统计 THEN THE System SHALL 返回每个用户的AI调用次数和token使用量
4. THE System SHALL 计算并返回平均响应时间(基于AICallLog.latency字段)
5. THE System SHALL 统计并返回总输入token数和总输出token数(基于UsageRecord表)
6. WHEN Admin请求按provider统计 THEN THE System SHALL 返回每个provider的调用分布
7. THE System SHALL 提供按scenario(场景)分组的统计数据

### 需求 3: 用量监控

**用户故事:** 作为系统管理员，我希望实时监控系统资源使用情况，以便及时发现异常和防止资源耗尽。

#### 验收标准

1. THE System SHALL 提供实时的系统资源使用情况(基于现有monitoring模块)
2. WHEN Admin查看用户配额使用情况 THEN THE System SHALL 显示每个用户的配额使用百分比
3. THE System SHALL 计算并显示API调用频率趋势(按小时、按天)
4. WHEN Admin设置告警阈值 THEN THE System SHALL 保存阈值配置到SystemSettings表
5. WHEN 用户用量超过阈值 THEN THE System SHALL 触发告警通知
6. THE System SHALL 显示接近配额限制的用户列表(使用率>80%)
7. THE System SHALL 提供按时间段的用量趋势图数据

### 需求 4: 用户管理

**用户故事:** 作为系统管理员，我希望管理所有用户的信息和权限，以便维护系统秩序和用户体验。

#### 验收标准

1. WHEN Admin请求用户列表 THEN THE System SHALL 返回所有用户的基本信息(id, email, username, role, subscriptionTier, createdAt, lastLoginAt, isActive)
2. THE System SHALL 支持按email、username、role、subscriptionTier筛选用户
3. THE System SHALL 支持分页查询用户列表
4. WHEN Admin更新用户配额 THEN THE System SHALL 更新用户的subscriptionTier并记录到AuditLog
5. WHEN Admin更新用户角色 THEN THE System SHALL 更新User.role字段并记录到AuditLog
6. WHEN Admin禁用用户 THEN THE System SHALL 设置User.isActive为false
7. THE System SHALL 计算并显示用户活跃度(基于lastLoginAt和messageCount)
8. WHEN Admin查看用户详情 THEN THE System SHALL 返回用户的完整信息包括统计数据(消息数、简历数、优化次数)

### 需求 5: 系统统计Dashboard

**用户故事:** 作为系统管理员，我希望在Dashboard上查看关键指标总览，以便快速了解系统整体状况。

#### 验收标准

1. THE System SHALL 在Dashboard显示总用户数、活跃用户数(最近7天登录)、新增用户数(最近30天)
2. THE System SHALL 显示总AI调用次数、今日调用次数、调用成功率
3. THE System SHALL 显示总token使用量、今日token使用量、总成本
4. THE System SHALL 显示系统健康状态(基于PerformanceMetrics表的successRate)
5. WHEN 系统健康状态异常(successRate < 95%) THEN THE System SHALL 在Dashboard显示警告标识
6. THE System SHALL 显示最近的错误日志数量(基于AICallLog中success=false的记录)
7. THE System SHALL 提供快速访问链接到各个管理功能模块

### 需求 6: 错误日志和异常追踪

**用户故事:** 作为系统管理员，我希望查看和分析错误日志，以便快速定位和解决系统问题。

#### 验收标准

1. WHEN Admin查看错误日志 THEN THE System SHALL 返回AICallLog中success=false的记录
2. THE System SHALL 支持按errorCode、provider、model筛选错误日志
3. THE System SHALL 支持按时间范围筛选错误日志
4. WHEN Admin查看错误详情 THEN THE System SHALL 显示完整的errorMessage和stackTrace
5. THE System SHALL 统计并显示最常见的错误类型(按errorCode分组)
6. THE System SHALL 显示错误趋势图(按时间统计错误数量)
7. THE System SHALL 提供错误日志的分页查询

### 需求 7: 重试和降级日志

**用户故事:** 作为系统管理员，我希望查看AI调用的重试和降级情况，以便评估系统稳定性和优化策略。

#### 验收标准

1. WHEN Admin查看重试日志 THEN THE System SHALL 返回AIRetryLog表中的所有记录
2. THE System SHALL 统计并显示重试成功率(attempt < maxAttempts的比例)
3. WHEN Admin查看降级日志 THEN THE System SHALL 返回AIDegradationLog表中的所有记录
4. THE System SHALL 统计并显示各个model的降级频率
5. THE System SHALL 显示降级原因分布(按reason分组)
6. THE System SHALL 支持按时间范围筛选重试和降级日志

### 需求 8: 数据导出

**用户故事:** 作为系统管理员，我希望导出统计数据和报表，以便进行离线分析和汇报。

#### 验收标准

1. WHEN Admin请求导出AI使用统计 THEN THE System SHALL 生成包含所有统计数据的CSV文件
2. WHEN Admin请求导出用户列表 THEN THE System SHALL 生成包含用户信息的Excel文件
3. THE System SHALL 支持导出指定时间范围的数据
4. THE System SHALL 在导出文件中包含列标题和数据说明
5. WHEN 导出任务完成 THEN THE System SHALL 返回下载链接
6. THE System SHALL 在AuditLog中记录所有数据导出操作
7. THE System SHALL 支持导出错误日志数据

### 需求 9: 数据可视化

**用户故事:** 作为系统管理员，我希望通过图表查看数据趋势，以便更直观地理解系统状况。

#### 验收标准

1. THE System SHALL 提供API调用趋势的时间序列数据(按小时/天/周/月)
2. THE System SHALL 提供模型使用分布的饼图数据
3. THE System SHALL 提供用户活跃度的柱状图数据
4. THE System SHALL 提供token使用量的趋势线数据
5. THE System SHALL 提供成功率和失败率的对比图数据
6. THE System SHALL 提供成本统计的趋势图数据
7. FOR ALL 图表数据 THE System SHALL 返回标准化的JSON格式(包含labels和datasets)

### 需求 10: 实时数据更新

**用户故事:** 作为系统管理员，我希望Dashboard数据能够实时更新，以便及时发现和响应系统变化。

#### 验收标准

1. WHERE WebSocket连接可用 THE System SHALL 通过WebSocket推送实时统计数据更新
2. THE System SHALL 每30秒推送一次Dashboard关键指标更新
3. WHEN 发生严重错误(连续失败>10次) THEN THE System SHALL 立即推送告警通知
4. WHEN 用户用量超过阈值 THEN THE System SHALL 立即推送告警通知
5. WHERE WebSocket不可用 THE System SHALL 支持轮询方式获取最新数据
6. THE System SHALL 在前端显示最后更新时间戳

### 需求 11: 性能优化

**用户故事:** 作为系统管理员，我希望管理端查询响应快速，以便高效地完成管理工作。

#### 验收标准

1. WHEN Admin查询统计数据 THEN THE System SHALL 在2秒内返回结果
2. THE System SHALL 使用Redis缓存频繁查询的统计数据(缓存时间5分钟)
3. THE System SHALL 对大数据量查询使用数据库索引优化
4. WHEN 查询历史数据(>30天) THEN THE System SHALL 使用聚合表或预计算结果
5. THE System SHALL 限制单次查询返回的记录数(最多10000条)
6. WHEN 导出大量数据 THEN THE System SHALL 使用异步任务处理

### 需求 12: 审计日志

**用户故事:** 作为系统管理员，我希望所有管理操作都被记录，以便追溯和审计。

#### 验收标准

1. WHEN Admin执行任何管理操作 THEN THE System SHALL 在AuditLog表中创建记录
2. THE AuditLog记录 SHALL 包含action(操作类型)、resource(资源类型)、userId(操作者)、details(详细信息)、timestamp(时间戳)
3. WHEN Admin查看审计日志 THEN THE System SHALL 返回按时间倒序排列的日志列表
4. THE System SHALL 支持按action、resource、userId筛选审计日志
5. THE System SHALL 支持按时间范围筛选审计日志
6. THE System SHALL 保留审计日志至少90天
