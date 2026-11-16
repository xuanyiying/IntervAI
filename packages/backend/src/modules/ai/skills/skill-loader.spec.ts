import { SkillLoader } from './skill-loader';

describe('SkillLoader — parseJsonLoose repair', () => {
  const configService = { get: jest.fn((_k: string, d: string) => d) };
  let loader: SkillLoader;

  beforeAll(() => {
    loader = new SkillLoader(configService as never, {} as never, {} as never);
  });

  const parse = (content: string): unknown =>
    (
      loader as unknown as Record<string, (c: string) => unknown>
    ).parseJsonLoose(content);

  it('parses valid JSON directly', () => {
    expect(parse('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses fenced JSON', () => {
    expect(parse('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('parses JSON surrounded by prose', () => {
    expect(parse('Here you go:\n{"a":1}\nHope this helps!')).toEqual({
      a: 1,
    });
  });

  it('repairs a stray trailing closing brace', () => {
    const broken = '{"personalInfo":{"name":"李四"},"skills":["Java"]}}';
    expect(parse(broken)).toEqual({
      personalInfo: { name: '李四' },
      skills: ['Java'],
    });
  });

  it('repairs a trailing comma before the closing brace', () => {
    expect(parse('{"a":1,}')).toEqual({ a: 1 });
  });

  it('auto-closes a truncated JSON object', () => {
    const truncated =
      '{"personalInfo":{"name":"李四"},"summary":"dev","skills":["Java","Spring"';
    expect(parse(truncated)).toEqual({
      personalInfo: { name: '李四' },
      summary: 'dev',
      skills: ['Java', 'Spring'],
    });
  });

  it('auto-closes a truncated string value', () => {
    const truncated = '{"a":"hello wor';
    expect(parse(truncated)).toEqual({ a: 'hello wor' });
  });

  it('throws when no JSON can be salvaged', () => {
    expect(() => parse('no json here at all')).toThrow(
      'No valid JSON found in response'
    );
  });

  it('throws for mismatched brackets that cannot be repaired', () => {
    expect(() => parse('{["mismatch"]}')).toThrow();
  });
});
