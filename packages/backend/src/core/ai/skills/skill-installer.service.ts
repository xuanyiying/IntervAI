/**
 * Skill Installer Service
 * Installs skills from network sources and packages
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { SkillSource } from './skill.interface';
import { SkillRegistry } from './skill-registry';
import { SkillLoader } from './skill-loader';

/**
 * Skill package source
 */
export interface SkillPackageSource {
  type: 'npm' | 'github' | 'url' | 'local';
  name?: string;
  url?: string;
  version?: string;
}

/**
 * Installation result
 */
export interface InstallResult {
  success: boolean;
  skillName: string;
  version: string;
  source: SkillSource;
  error?: string;
}

/**
 * Skill Installer Service
 * Manages skill installation from various sources
 */
@Injectable()
export class SkillInstallerService {
  private readonly logger = new Logger(SkillInstallerService.name);
  private readonly skillsCacheDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly registry: SkillRegistry,
    private readonly loader: SkillLoader
  ) {
    this.skillsCacheDir = this.configService.get(
      'SKILLS_CACHE_DIR',
      '.intervai/skills-cache'
    );
  }

  /**
   * Install a skill from a package source
   */
  async install(source: SkillPackageSource): Promise<InstallResult[]> {
    this.logger.log(`Installing skill from ${source.type}: ${source.name || source.url}`);

    switch (source.type) {
      case 'npm':
        return this.installFromNpm(source.name!, source.version);
      case 'github':
        return this.installFromGithub(source.url!);
      case 'url':
        return this.installFromUrl(source.url!);
      case 'local':
        return this.installFromLocal(source.name!);
      default:
        return [
          {
            success: false,
            skillName: '',
            version: '',
            source: { type: 'file', loadedAt: new Date() },
            error: `Unknown source type: ${source.type}`,
          },
        ];
    }
  }

  /**
   * Install skill from NPM
   */
  async installFromNpm(packageName: string, version?: string): Promise<InstallResult[]> {
    this.logger.log(`Installing from NPM: ${packageName}@${version || 'latest'}`);

    try {
      // In production, this would use npm registry API
      // For now, we simulate the installation process

      const targetDir = path.join(this.skillsCacheDir, 'npm', packageName);

      // Create directory structure
      await fs.mkdir(targetDir, { recursive: true });

      // Download and extract package (simulated)
      // In production: use pacote or npm-registry-client

      this.logger.warn('NPM installation not fully implemented');

      return [
        {
          success: false,
          skillName: packageName,
          version: version || 'latest',
          source: { type: 'package', path: targetDir, loadedAt: new Date() },
          error: 'NPM installation not implemented',
        },
      ];
    } catch (error) {
      return [
        {
          success: false,
          skillName: packageName,
          version: version || 'latest',
          source: { type: 'package', loadedAt: new Date() },
          error: error instanceof Error ? error.message : String(error),
        },
      ];
    }
  }

  /**
   * Install skill from GitHub
   */
  async installFromGithub(repoUrl: string): Promise<InstallResult[]> {
    this.logger.log(`Installing from GitHub: ${repoUrl}`);

    try {
      // Parse GitHub URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error(`Invalid GitHub URL: ${repoUrl}`);
      }

      const [, owner, repo] = match;
      const packageName = `${owner}-${repo}`.toLowerCase();
      const targetDir = path.join(this.skillsCacheDir, 'github', packageName);

      // Create directory structure
      await fs.mkdir(targetDir, { recursive: true });

      // In production: use GitHub API to download release or clone repo
      this.logger.warn('GitHub installation not fully implemented');

      return [
        {
          success: false,
          skillName: packageName,
          version: 'latest',
          source: { type: 'remote', url: repoUrl, loadedAt: new Date() },
          error: 'GitHub installation not implemented',
        },
      ];
    } catch (error) {
      return [
        {
          success: false,
          skillName: '',
          version: '',
          source: { type: 'remote', url: repoUrl, loadedAt: new Date() },
          error: error instanceof Error ? error.message : String(error),
        },
      ];
    }
  }

  /**
   * Install skill from URL
   */
  async installFromUrl(url: string): Promise<InstallResult[]> {
    this.logger.log(`Installing from URL: ${url}`);

    try {
      // Fetch the skill file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const content = await response.text();
      const checksum = this.calculateChecksum(content);

      // Determine filename from URL
      const filename = path.basename(new URL(url).pathname);
      const skillName = filename.replace(/\.skill\.md$|\.md$/, '');

      // Save to cache
      const targetPath = path.join(this.skillsCacheDir, 'remote', filename);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, content, 'utf-8');

      // Load the skill
      const loadedSkills = await this.loader.loadSkillsFromDirectory(
        path.dirname(targetPath),
        'remote'
      );

      const loaded = loadedSkills.find((s) => s.name === skillName);

      return [
        {
          success: !!loaded,
          skillName,
          version: loaded?.definition.version || '1.0.0',
          source: {
            type: 'remote',
            url,
            path: targetPath,
            loadedAt: new Date(),
            checksum,
          },
          error: loaded ? undefined : 'Failed to load skill',
        },
      ];
    } catch (error) {
      return [
        {
          success: false,
          skillName: '',
          version: '',
          source: { type: 'remote', url, loadedAt: new Date() },
          error: error instanceof Error ? error.message : String(error),
        },
      ];
    }
  }

  /**
   * Install skill from local path
   */
  async installFromLocal(localPath: string): Promise<InstallResult[]> {
    this.logger.log(`Installing from local: ${localPath}`);

    try {
      const resolvedPath = path.resolve(localPath);
      const stats = await fs.stat(resolvedPath);

      if (stats.isDirectory()) {
        const loaded = await this.loader.loadSkillsFromDirectory(resolvedPath, 'file');
        return loaded.map((info) => ({
          success: true,
          skillName: info.name,
          version: info.definition.version,
          source: info.source,
        }));
      } else {
        const info = await this.loader.loadSkillFromFile(resolvedPath, 'file');
        if (info) {
          return [
            {
              success: true,
              skillName: info.name,
              version: info.definition.version,
              source: info.source,
            },
          ];
        }
      }

      return [
        {
          success: false,
          skillName: '',
          version: '',
          source: { type: 'file', path: localPath, loadedAt: new Date() },
          error: 'Failed to load skill',
        },
      ];
    } catch (error) {
      return [
        {
          success: false,
          skillName: '',
          version: '',
          source: { type: 'file', path: localPath, loadedAt: new Date() },
          error: error instanceof Error ? error.message : String(error),
        },
      ];
    }
  }

  /**
   * Uninstall a skill
   */
  async uninstall(skillName: string): Promise<boolean> {
    this.logger.log(`Uninstalling skill: ${skillName}`);

    const loadedInfo = this.loader.getLoadedSkill(skillName);
    if (!loadedInfo) {
      this.logger.warn(`Skill not found: ${skillName}`);
      return false;
    }

    // Remove from registry
    this.registry.unregister(skillName);

    // Remove from loader
    this.loader.unloadSkill(skillName);

    // Optionally remove cached files
    if (loadedInfo.source.path) {
      try {
        await fs.unlink(loadedInfo.source.path);
        this.logger.debug(`Removed skill file: ${loadedInfo.source.path}`);
      } catch {
        // Ignore file removal errors
      }
    }

    return true;
  }

  /**
   * Update a skill
   */
  async update(skillName: string): Promise<InstallResult> {
    this.logger.log(`Updating skill: ${skillName}`);

    const loadedInfo = this.loader.getLoadedSkill(skillName);
    if (!loadedInfo) {
      return {
        success: false,
        skillName,
        version: '',
        source: { type: 'file', loadedAt: new Date() },
        error: 'Skill not found',
      };
    }

    // If remote skill, re-download
    if (loadedInfo.source.type === 'remote' && loadedInfo.source.url) {
      const results = await this.installFromUrl(loadedInfo.source.url);
      return results[0];
    }

    // If local file, reload
    if (loadedInfo.source.path) {
      const success = await this.loader.reloadSkill(skillName);
      return {
        success,
        skillName,
        version: loadedInfo.definition.version,
        source: loadedInfo.source,
        error: success ? undefined : 'Failed to reload skill',
      };
    }

    return {
      success: false,
      skillName,
      version: loadedInfo.definition.version,
      source: loadedInfo.source,
      error: 'Cannot update skill from this source type',
    };
  }

  /**
   * List installed skills
   */
  listInstalled(): Array<{
    name: string;
    version: string;
    source: SkillSource;
  }> {
    return this.loader.getLoadedSkills().map((info) => ({
      name: info.name,
      version: info.definition.version,
      source: info.source,
    }));
  }

  /**
   * Calculate checksum for content
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
