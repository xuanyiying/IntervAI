import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { GeneratePitchDto, RefinePitchDto } from './pitch-perfect.dto';

describe('GeneratePitchDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: false },
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: GeneratePitchDto,
    data: '',
  };

  const frontendParsedData = {
    personalInfo: {
      name: '张三',
      email: 'zhang@example.com',
      phone: '13800138000',
      location: '上海',
      website: 'https://zhang.dev',
    },
    summary: '5 年后端开发经验',
    education: [
      {
        institution: '某某大学',
        degree: '本科',
        field: '计算机科学',
        startDate: '2015-09',
        endDate: '2019-06',
        gpa: '3.8',
        achievements: ['优秀毕业生'],
      },
    ],
    experience: [
      {
        company: '某公司',
        position: '后端工程师',
        startDate: '2019-07',
        location: '上海',
        description: ['负责核心服务'],
        achievements: ['性能提升 40%'],
      },
    ],
    skills: ['Node.js', { category: '前端', items: ['React'] }],
    projects: [
      {
        name: '某项目',
        description: '某描述',
        technologies: ['Node.js'],
        startDate: '2022-01',
        url: 'https://example.com',
        highlights: ['高并发'],
      },
    ],
    certifications: [{ name: 'CET-6', issuer: '教育部', date: '2015-06' }],
    languages: [{ name: '英语', proficiency: '流利' }],
    markdown: '# 简历',
    extractedText: '简历全文...',
  };

  it('accepts a realistic frontend parsedData payload with extra fields', async () => {
    const payload = {
      resumeData: frontendParsedData,
      jobDescription: '招聘资深后端工程师…',
      style: 'technical',
    };

    const result = await pipe.transform(payload, metadata);

    expect(result.resumeData).toEqual(frontendParsedData);
    expect(result.jobDescription).toBe(payload.jobDescription);
    expect(result.style).toBe('technical');
  });

  it('defaults style to technical', async () => {
    const result = await pipe.transform(
      { resumeData: { summary: 'x' }, jobDescription: 'jd' },
      metadata
    );
    expect(result.style).toBe('technical');
  });

  it('accepts missing jobDescription (generic mode)', async () => {
    const result = await pipe.transform(
      { resumeData: { summary: 'x' } },
      metadata
    );
    expect(result.resumeData).toEqual({ summary: 'x' });
    expect(result.jobDescription).toBeUndefined();
  });

  it('accepts empty jobDescription (generic mode)', async () => {
    const result = await pipe.transform(
      { resumeData: { summary: 'x' }, jobDescription: '' },
      metadata
    );
    expect(result.jobDescription).toBe('');
  });

  it('rejects non-object resumeData', async () => {
    await expect(
      pipe.transform({ resumeData: 'text', jobDescription: 'jd' }, metadata)
    ).rejects.toBeDefined();
  });

  it('rejects empty resumeData object', async () => {
    await expect(
      pipe.transform({ resumeData: {}, jobDescription: 'jd' }, metadata)
    ).rejects.toBeDefined();
  });

  it('rejects jobDescription exceeding max length', async () => {
    await expect(
      pipe.transform(
        { resumeData: { summary: 'x' }, jobDescription: 'a'.repeat(30001) },
        metadata
      )
    ).rejects.toBeDefined();
  });
});

describe('RefinePitchDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: false },
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: RefinePitchDto,
    data: '',
  };

  it('accepts valid refine payload', async () => {
    const result = await pipe.transform(
      { currentIntroduction: '自我介绍正文', feedback: '语气更强硬一些' },
      metadata
    );
    expect(result).toMatchObject({
      currentIntroduction: '自我介绍正文',
      feedback: '语气更强硬一些',
    });
  });

  it('rejects missing feedback', async () => {
    await expect(
      pipe.transform({ currentIntroduction: '自我介绍正文' }, metadata)
    ).rejects.toBeDefined();
  });
});
