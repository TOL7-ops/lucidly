import { pipeline, PipelineType } from '@xenova/transformers';

let t2t: any | null = null;

async function getGenerator() {
  if (!t2t) {
    t2t = await pipeline('text2text-generation' as PipelineType, 'Xenova/distilbart-cnn-12-6');
  }
  return t2t;
}

function normalize(text: string): string {
  return (text || '').replace(/\r/g, '').trim();
}

export function splitSummaryInterpretation(generated: string): { summary: string | null; interpretation: string | null } {
  const text = normalize(generated);

  // Try to extract by explicit headings
  const summaryMatch = /summary:\s*([\s\S]*?)(?:\n{2,}|interpretation:|$)/i.exec(text);
  const interpretationMatch = /interpretation:\s*([\s\S]*?)$/i.exec(text);

  const summary = summaryMatch ? normalize(summaryMatch[1]) : null;
  const interpretation = interpretationMatch ? normalize(interpretationMatch[1]) : null;

  return { summary: summary || null, interpretation: interpretation || null };
}

/**
 * Runs a single small, fast text2text model with an instruction prompt.
 * Returns a single string that already includes both labeled sections:
 *
 * Summary:
 * ...
 *
 * Interpretation:
 * ...
 */
export async function summarizeAndInterpretDream(dreamText: string): Promise<string> {
  const generator = await getGenerator();

  const content = (dreamText || '').trim();
  const truncated = content.length > 3000 ? content.slice(0, 3000) : content;

  const prompt =
    `You are an expert dream analyst and summarizer.\n` +
    `First, write a concise summary (2-4 sentences).\n` +
    `Then, write an insightful interpretation (2-4 sentences) focusing on symbolism and meaning.\n\n` +
    `Return the result exactly in this format:\n` +
    `Summary:\n` +
    `<summary text>\n\n` +
    `Interpretation:\n` +
    `<interpretation text>\n\n` +
    `Dream:\n${truncated}`;

  const out = await generator(prompt, {
    max_new_tokens: 256,
    temperature: 0.7,
    // top_k/top_p can be added if needed
  });

  let generated = '';
  if (Array.isArray(out) && out.length > 0) {
    if (typeof out[0]?.generated_text === 'string') {
      generated = out[0].generated_text;
    } else if (typeof out[0] === 'string') {
      generated = out[0];
    }
  } else if (typeof (out as any)?.generated_text === 'string') {
    generated = (out as any).generated_text;
  } else if (typeof out === 'string') {
    generated = out;
  }

  generated = normalize(generated);
  if (!generated.toLowerCase().includes('summary:') || !generated.toLowerCase().includes('interpretation:')) {
    // If the model did not follow the format strictly, try to coerce
    const { summary, interpretation } = splitSummaryInterpretation(generated);
    const safeSummary = summary || (truncated.length > 200 ? truncated.slice(0, 197) + '...' : truncated) || 'No summary available.';
    const safeInterpretation = interpretation || 'This dream may reflect hidden emotions and subconscious reflections.';
    return `Summary:\n${safeSummary}\n\nInterpretation:\n${safeInterpretation}`;
  }

  return generated;
}