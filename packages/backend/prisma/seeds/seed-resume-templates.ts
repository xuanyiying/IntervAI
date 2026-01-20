import { PrismaClient } from '@prisma/client';

export async function seedResumeTemplates(prisma: PrismaClient) {
  console.log('📄 Seeding resume templates...');

  const templates = [
    {
      name: '经典模板',
      category: 'classic',
      description: '传统简洁的简历格式，适合各类职位申请',
      previewUrl: '/templates/classic-preview.png',
      isPremium: false,
      isActive: true,
      configuration: {
        defaultFontSize: 11,
        defaultColorTheme: '#000000',
        supportedSections: [
          'personalInfo',
          'summary',
          'experience',
          'education',
          'skills',
          'projects',
          'certifications',
          'languages',
        ],
        customizableOptions: ['fontSize', 'colorTheme', 'margin'],
      },
    },
    {
      name: '现代模板',
      category: 'modern',
      description: '现代化设计，带有色彩点缀，适合创意类职位',
      previewUrl: '/templates/modern-preview.png',
      isPremium: false,
      isActive: true,
      configuration: {
        defaultFontSize: 10,
        defaultColorTheme: '#2563eb',
        supportedSections: [
          'personalInfo',
          'summary',
          'experience',
          'education',
          'skills',
          'projects',
          'certifications',
          'languages',
        ],
        customizableOptions: [
          'fontSize',
          'colorTheme',
          'margin',
          'includePhoto',
        ],
      },
    },
    {
      name: '专业模板',
      category: 'professional',
      description: '专业商务风格，适合高级管理和咨询类职位',
      previewUrl: '/templates/professional-preview.png',
      isPremium: false,
      isActive: true,
      configuration: {
        defaultFontSize: 11,
        defaultColorTheme: '#1e293b',
        supportedSections: [
          'personalInfo',
          'summary',
          'experience',
          'education',
          'skills',
          'projects',
          'certifications',
          'languages',
        ],
        customizableOptions: ['fontSize', 'colorTheme', 'margin'],
      },
    },
  ];

  let created = 0;
  let updated = 0;

  for (const template of templates) {
    const result = await prisma.template.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
    console.log(`✅ Processed template: ${template.name}`);
  }

  console.log(`\n📊 Resume Templates Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   📝 Total:   ${templates.length}\n`);
}
