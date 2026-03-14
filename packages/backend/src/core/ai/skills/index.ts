/**
 * Skills Module - Index
 * Exports all skill-related components
 */

// Core interfaces
export {
  Skill,
  SkillDefinition,
  SkillContext,
  SkillSource,
  SkillInputDefinition,
  SkillOutputDefinition,
  SkillPackageManifest,
  SkillResult,
  SkillStats,
} from './skill.interface';

// Core services
export { SkillRegistry } from './skill-registry';
export { SkillLoader } from './skill-loader';
export { SkillMarkdownParser } from './skill-markdown-parser';
export {
  SkillInstallerService,
  SkillPackageSource,
  InstallResult,
} from './skill-installer.service';
