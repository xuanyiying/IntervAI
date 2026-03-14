/**
 * Skill Package Interface
 * Defines the interface for installable skill packages
 * Supports installing skills from network/remote sources
 */

import { Skill } from './skill.interface';

/**
 * Skill package manifest
 * Defines the metadata for a skill package
 */
export interface SkillPackageManifest {
  /** Package name */
  name: string;
  /** Package version (semver) */
  version: string;
  /** Package description */
  description: string;
  /** Author information */
  author?: string;
  /** License */
  license?: string;
  /** Package repository URL */
  repository?: string;
  /** Keywords for search */
  keywords?: string[];
  /** Skills included in this package */
  skills: SkillManifest[];
  /** Dependencies required by this package */
  dependencies?: Record<string, string>;
  /** Minimum compatible engine version */
  engineVersion?: string;
}

/**
 * Individual skill manifest within a package
 */
export interface SkillManifest {
  /** Skill name */
  name: string;
  /** Skill description */
  description: string;
  /** Skill version */
  version: string;
  /** Entry point for the skill (file path or URL) */
  entry: string;
  /** Tags for categorization */
  tags?: string[];
  /** Input schema (JSON Schema) */
  inputSchema?: Record<string, any>;
  /** Output schema (JSON Schema) */
  outputSchema?: Record<string, any>;
  /** Default configuration */
  defaultConfig?: Record<string, any>;
}

/**
 * Skill package source
 * Defines where to fetch the package from
 */
export interface SkillPackageSource {
  /** Source type */
  type: 'npm' | 'git' | 'url' | 'local';
  /** Package identifier (name for npm, URL for git/url, path for local) */
  identifier: string;
  /** Version/tag/branch */
  version?: string;
  /** Authentication token if needed */
  authToken?: string;
}

/**
 * Installed skill package
 */
export interface InstalledSkillPackage {
  /** Package manifest */
  manifest: SkillPackageManifest;
  /** Installation path */
  installPath: string;
  /** Installation timestamp */
  installedAt: Date;
  /** Source information */
  source: SkillPackageSource;
  /** Loaded skill instances */
  skills: Skill[];
  /** Is active */
  isActive: boolean;
}

/**
 * Skill installation options
 */
export interface SkillInstallOptions {
  /** Force reinstall if already exists */
  force?: boolean;
  /** Specific version to install */
  version?: string;
  /** Enable the package immediately after installation */
  enable?: boolean;
}

/**
 * Skill package search result
 */
export interface SkillPackageSearchResult {
  /** Package name */
  name: string;
  /** Latest version */
  version: string;
  /** Description */
  description: string;
  /** Author */
  author?: string;
  /** Download count */
  downloads?: number;
  /** Rating/score */
  rating?: number;
  /** Source registry */
  registry: string;
}

/**
 * Skill registry configuration
 */
export interface SkillRegistryConfig {
  /** Default registries to search */
  registries: string[];
  /** Local packages directory */
  packagesDir: string;
  /** Allow remote installation */
  allowRemote: boolean;
  /** Trusted package authors */
  trustedAuthors?: string[];
}
