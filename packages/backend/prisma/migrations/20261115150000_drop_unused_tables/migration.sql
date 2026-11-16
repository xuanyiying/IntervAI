-- 清理 schema 中无任何代码引用的表（对应移除 Session/Account/Verification/AuditLog/AICallLog/AIRetryLog/AIDegradationLog/InvitationCode/SystemSettings/UserProfile 模型）
DROP TABLE IF EXISTS "user_profiles";
DROP TABLE IF EXISTS "system_settings";
DROP TABLE IF EXISTS "invitation_codes";
DROP TABLE IF EXISTS "ai_degradation_logs";
DROP TABLE IF EXISTS "ai_retry_logs";
DROP TABLE IF EXISTS "ai_call_logs";
DROP TABLE IF EXISTS "audit_logs";
DROP TABLE IF EXISTS "verification";
DROP TABLE IF EXISTS "accounts";
DROP TABLE IF EXISTS "sessions";
