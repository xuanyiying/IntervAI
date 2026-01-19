import { PrismaClient } from '@prisma/client';
import { PREDEFINED_TEMPLATES } from '../../src/ai-providers/config/predefined-templates';

/**
 * Seed script to populate database with default prompt templates
 * Uses the single source of truth from PREDEFINED_TEMPLATES
 */
export async function seedPromptsTemplates(prisma: PrismaClient) {
  console.log('🌱 Seeding prompt templates...');

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const template of PREDEFINED_TEMPLATES) {
    try {
      // Use upsert to handle both creation and updates
      const result = await prisma.promptTemplate.upsert({
        where: {
          name_language: {
            name: template.name,
            language: template.language,
          },
        },
        update: {
          scenario: template.scenario,
          template: template.template,
          variables: template.variables,
          provider: template.provider,
          isEncrypted: template.isEncrypted,
          isActive: true,
        },
        create: {
          name: template.name,
          scenario: template.scenario,
          language: template.language,
          template: template.template,
          variables: template.variables,
          provider: template.provider,
          isEncrypted: template.isEncrypted,
          isActive: true,
        },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        console.log(`✅ Created: ${template.name} (${template.language})`);
        created++;
      } else {
        console.log(`🔄 Updated: ${template.name} (${template.language})`);
        updated++;
      }
    } catch (error) {
      console.error(
        `❌ Failed to process template ${template.name} (${template.language}):`,
        error
      );
      failed++;
    }
  }

  console.log(`\n📊 Prompt Templates Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`   📝 Total:   ${PREDEFINED_TEMPLATES.length}\n`);
}
