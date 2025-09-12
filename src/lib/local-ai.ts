import { pipeline, PipelineType } from '@xenova/transformers';

let text2textGenerator: any | null = null;

async function getText2Text() {
  if (!text2textGenerator) {
    // Load once and cache
    text2textGenerator = await pipeline('text2text-generation' as PipelineType, 'Xenova/flan-t5-base');
  }
  return text2textGenerator;
}

function extractGeneratedText(output: any): string {
  try {
    if (Array.isArray(output) && output.length > 0) {
      if (typeof output[0]?.generated_text === 'string') return output[0].generated_text;
      if (typeof output[0] === 'string') return output[0];
    }
    if (typeof output?.generated_text === 'string') return output.generated_text;
    if (typeof output === 'string') return output;
  } catch {
    // no-op
  }
  return '';
}

function cleanText(text: string): string {
  return (text || '')
    .replace(/^\s*Interpretation:\s*/i, '')
    .replace(/^\s*Summary:\s*/i, '')
    .trim();
}

export async function summarizeDream(content: string): Promise<string> {
  const gen = await getText2Text();
  const prompt = `Summarize this dream: ${content}`;
  const output = await gen(prompt, {
    max_new_tokens: 200,
    temperature: 0.6,
  });
  const generated = cleanText(extractGeneratedText(output));
  // Fallback to a truncated version of content if generation fails
  if (!generated) {
    const trimmed = (content || '').trim();
    return trimmed.length > 200 ? trimmed.substring(0, 197) + '...' : trimmed || 'No summary available.';
  }
  return generated;
}

export async function interpretDream(content: string): Promise<string> {
  const gen = await getText2Text();
  const prompt = `Interpret this dream: ${content}`;
  const output = await gen(prompt, {
    max_new_tokens: 200,
    temperature: 0.6,
  });
  const generated = cleanText(extractGeneratedText(output));
  return generated || 'This dream suggests hidden emotions and subconscious reflections.';
}