import { randomBytes } from 'crypto';

export class TestDataHelper {
  private static counter = 0;

  static generateUniqueId(prefix = 'test'): string {
    this.counter++;
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    return `${prefix}-${timestamp}-${this.counter}-${random}`;
  }

  static generateEmail(prefix = 'test'): string {
    return `${this.generateUniqueId(prefix)}@interview-ai-test.com`;
  }

  static generatePassword(): string {
    return `Test${randomBytes(8).toString('hex')}!`;
  }

  static generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `+1${areaCode}${prefix}${lineNumber}`;
  }

  static generateUserData() {
    return {
      email: this.generateEmail(),
      password: this.generatePassword(),
      name: `Test User ${this.counter}`,
    };
  }

  static generateResumeData() {
    return {
      name: `Test User ${this.counter}`,
      email: this.generateEmail('resume'),
      phone: this.generatePhoneNumber(),
      summary: 'Experienced software engineer with 5+ years of experience',
      experience: [
        {
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          startDate: '2020-01',
          endDate: '2023-12',
          description: 'Led development of microservices architecture',
        },
      ],
      education: [
        {
          school: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          graduationDate: '2019-06',
        },
      ],
      skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL'],
    };
  }

  static generateJobData() {
    return {
      title: `Software Engineer ${this.counter}`,
      company: `Tech Company ${this.counter}`,
      location: 'San Francisco, CA',
      type: 'FULL_TIME',
      description: 'We are looking for a talented software engineer to join our team.',
      requirements: [
        '3+ years of experience with JavaScript/TypeScript',
        'Experience with React and Node.js',
        'Strong problem-solving skills',
      ],
      salary: {
        min: 100000,
        max: 150000,
        currency: 'USD',
      },
    };
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 2
  ): Promise<T> {
    let lastError: Error | undefined;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await this.delay(currentDelay);
          currentDelay *= backoff;
        }
      }
    }

    throw lastError;
  }

  static generateMockPDFBuffer(): Buffer {
    // Simple PDF structure for testing
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Resume) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
306
%%EOF`;
    return Buffer.from(pdfContent);
  }

  static generateMockDOCXBuffer(): Buffer {
    // Minimal DOCX structure for testing
    // In real implementation, would use a proper DOCX library
    return Buffer.from('Mock DOCX content for testing');
  }
}

export const testData = TestDataHelper;
