# 重构计划：合并 Generate 与 Resume-Optimizer 模块至 Resume 模块

根据您的要求，我们将把 `generate` (生成) 和 `resume-optimizer` (优化) 两个模块的功能完全整合进 `resume` (简历) 模块中，以实现业务逻辑的高度内聚。

## 1. 目标架构设计

重构后的 `packages/backend/src/resume/` 目录结构将包含所有简历相关功能：

```text
packages/backend/src/resume/
├── dto/                    # 数据传输对象 (合并原有 DTO)
├── services/               # 业务逻辑层 (新增目录)
│   ├── resume.service.ts           # 核心 CRUD、解析 (原 ResumeService)
│   ├── resume-optimizer.service.ts # 优化、打分、建议 (原 ResumeOptimizerService)
│   └── pdf-generation.service.ts   # PDF 生成、模板渲染 (原 GenerateService)
├── controllers/            # 控制器层 (新增目录)
│   ├── resume.controller.ts           # 核心接口
│   ├── resume-optimizer.controller.ts # 优化相关接口
│   ├── pdf-generation.controller.ts   # PDF 下载/预览接口 (原 GenerateController)
│   └── templates.controller.ts        # 模板列表接口
├── resume.module.ts        # 统一模块定义，注册所有 Service 和 Controller
└── resume.service.spec.ts  # 测试文件
```

> **注**：为了防止单层目录过于拥挤，我们将引入 `services/` 和 `controllers/` 子目录结构。

## 2. 详细实施步骤

### 第一阶段：文件迁移与重命名 (File Migration)

1.  **创建目录结构**: 在 `src/resume` 下创建 `services` 和 `controllers` 目录。
2.  **移动 Resume 核心文件**:
    *   `src/resume/resume.service.ts` -> `src/resume/services/resume.service.ts`
    *   `src/resume/resume.controller.ts` -> `src/resume/controllers/resume.controller.ts`
3.  **移动 Optimizer 文件**:
    *   `src/resume-optimizer/resume-optimizer.service.ts` -> `src/resume/services/resume-optimizer.service.ts`
    *   `src/resume-optimizer/resume-optimizer.controller.ts` -> `src/resume/controllers/resume-optimizer.controller.ts`
4.  **移动 Generate 文件**:
    *   `src/generate/generate.service.ts` -> `src/resume/services/pdf-generation.service.ts` (重命名以明确职责)
    *   `src/generate/generate.controller.ts` -> `src/resume/controllers/pdf-generation.controller.ts`
    *   `src/generate/templates.controller.ts` -> `src/resume/controllers/templates.controller.ts`

### 第二阶段：代码重构与依赖修复 (Code Refactoring)

5.  **更新 ResumeModule**:
    *   在 `resume.module.ts` 中注册所有新的 Controllers 和 Services。
    *   移除对 `ResumeOptimizerModule` 和 `GenerateModule` 的导入（因为它们将被删除）。
    *   确保引入必要的 Providers (`PrismaService`, `StorageService`, `QuotaService`, `AIEngineService` 等)。
6.  **修复导入路径 (Fix Imports)**:
    *   更新所有移动后文件的 `import` 路径（例如 `../../types` 可能变成 `../../../types`）。
    *   更新应用中其他模块对 `ResumeService` 等的引用路径。
7.  **消除冗余**:
    *   检查 `ResumeOptimizerService` 中对数据库的直接操作，尽可能复用 `ResumeService` 的方法（如 `updateResume`）。

### 第三阶段：清理与验证 (Cleanup & Verification)

8.  **删除旧模块**: 删除 `src/generate` 和 `src/resume-optimizer` 目录。
9.  **更新 App Module**: 在 `app.module.ts` 中移除 `GenerateModule` 和 `ResumeOptimizerModule`，确保只导入增强后的 `ResumeModule`。
10. **验证测试**: 运行相关测试，确保重构未破坏现有功能。

## 3. 预期成果

*   **单一事实来源**: 所有简历相关逻辑（增删改查、优化、生成）都在 `ResumeModule` 中，降低了模块间耦合。
*   **清晰的职责划分**: 通过文件名明确区分了 `Core`, `Optimizer`, `PDF` 三种职责。
*   **API 兼容性**: Controller 的路由路径（`@Controller('resumes')`, `@Controller('generate')` 等）保持不变，确保前端无感知。

请确认是否开始执行此计划？
