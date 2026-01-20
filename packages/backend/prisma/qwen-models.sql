-- 确保 uuid 扩展已开启（如果需要）
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 批量插入模型配置到 model_configs 表
select * from model_configs;

-- api-key  从数据库查询 providers 表
INSERT INTO "model_configs" (
    "id",
    "name",
    "provider",
    "apiKey",
    "endpoint",
    "defaultTemperature",
    "defaultMaxTokens",
    "costPerInputToken",
    "costPerOutputToken",
    "rateLimitPerMinute",
    "rateLimitPerDay",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES
-- 1. qwen3-max-preview
(gen_random_uuid(), 'qwen3-max-preview', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.7, 4000, 0.000001, 0.000003, 100, 50000, true, NOW(), NOW()),

-- 2. qwen-turbo
(gen_random_uuid(), 'qwen-turbo', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.7, 32768, 0.00001, 0.00002, 100, 50000, true, NOW(), NOW()),

-- 2.1 text-embedding-v3
(gen_random_uuid(), 'text-embedding-v3', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0, 8192, 0.00001, 0, 100, 50000, true, NOW(), NOW()),

-- 3. qwen3-coder-flash
(gen_random_uuid(), 'qwen3-coder-flash', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.1, 4000, 0.000001, 0.000003, 100, 50000, true, NOW(), NOW()),

-- 4. deepseek-v3.2
(gen_random_uuid(), 'deepseek-v3.2', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.7, 4000, 0.00001, 0.00003, 60, 10000, true, NOW(), NOW()),

-- 5. kimi-k2-thinking
(gen_random_uuid(), 'kimi-k2-thinking', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.7, 8000, 0.000015, 0.000045, 30, 5000, true, NOW(), NOW()),

-- 6. Moonshot-Kimi-K2-Instruct
(gen_random_uuid(), 'Moonshot-Kimi-K2-Instruct', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.7, 8000, 0.00001, 0.00003, 30, 5000, true, NOW(), NOW()),

-- 7. llama-4-maverick-17b-128e-instruct
(gen_random_uuid(), 'llama-4-maverick-17b-128e-instruct', 'qwen', 'v1:0bc4123026372fec13213060b3de1231:815ef101318c13c135abf4d4b0d6e56d:14324e41b43032f4f23cdb226d19d8c78392442eb6b6335ec28ad0f5a558ece3419681', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 0.7, 4000, 0.000005, 0.000015, 60, 10000, true, NOW(), NOW())
