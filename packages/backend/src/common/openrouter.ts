import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:
    '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',
});

async function test() {
  // First API call with reasoning - use DeepSeek R1 which supports reasoning
  const apiResponse = await client.chat.completions.create({
    model: 'openai/gpt-oss-20b:free',
    messages: [
      {
        role: 'user' as const,
        content: "How many r's are in the word 'strawberry'?",
      },
    ],
  });

  console.log('=== First Response ===');
  console.log('Content:', apiResponse.choices[0].message.content);

  // Second API call
  const response2 = await client.chat.completions.create({
    model: 'openai/gpt-oss-20b:free',
    messages: [
      {
        role: 'user' as const,
        content: "How many r's are in the word 'strawberry'?",
      },
      {
        role: 'assistant' as const,
        content: apiResponse.choices[0].message.content || '',
      },
      {
        role: 'user' as const,
        content: 'Are you sure? Think carefully.',
      },
    ],
  });

  console.log('\n=== Second Response ===');
  console.log('Content:', response2.choices[0].message.content);
}

test().catch(console.error);
