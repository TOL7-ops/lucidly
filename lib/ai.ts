// Hugging Face-powered helpers per requirement

const HF_API_BASE = 'https://api-inference.huggingface.co/models';

function getHFKey(): string {
  const key = process.env.HF_API_KEY;
  if (!key) {
    throw new Error('Missing Hugging Face API key (HF_API_KEY)');
  }
  return key;
}

async function hfFetchJSON(model: string, payload: any): Promise<Response> {
  return fetch(`${HF_API_BASE}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getHFKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// Summarization fallback text (exact as specified)
const FALLBACK_SUMMARY_TEXT =
  'Summary unavailable. This dream may reflect hidden thoughts or unresolved emotions.';

// Interpretation fallback text (exact as specified)
const FALLBACK_INTERPRETATION_TEXT =
  'This dream may symbolize transitions or hidden aspects of the self.\n' +
  '- Unfamiliar paths could reflect uncertainty about the future.\n' +
  '- Water often represents emotions, suggesting deep feelings beneath the surface.\n' +
  '- A guiding animal may represent intuition leading you forward.\n' +
  '- The glowing gate may symbolize an opportunity or transformation waiting to be embraced.';

// Try the required summarization models in order and return summary_text when available
export async function summarizeDream(dreamText: string): Promise<string> {
  const text = (dreamText || '').trim();
  if (!text) return FALLBACK_SUMMARY_TEXT;

  const truncated = text.length > 1500 ? text.slice(0, 1500) : text;

  const models = [
    'facebook/bart-large-cnn',
    'sshleifer/distilbart-cnn-12-6',
    'google/pegasus-xsum',
  ];

  for (const model of models) {
    try {
      console.log(`[ai] summarization trying model: ${model}`);
      const response = await hfFetchJSON(model, {
        inputs: truncated,
        parameters: {
          max_length: 180,
          min_length: 30,
          temperature: 0.0,
          do_sample: false,
        },
        options: { wait_for_model: true },
      });

      if (!response.ok) {
        const status = response.status;
        const txt = await response.text().catch(() => '');
        console.warn(`[ai] summarization ${model} failed: ${status} ${txt}`);
        // 503 means model loading; try next model
        if (status === 503) continue;
        continue;
      }

      const result = await response.json();

      // Prefer summary_text when present
      let summary = '';
      if (Array.isArray(result) && result[0]?.summary_text) {
        summary = String(result[0].summary_text);
      } else if (Array.isArray(result) && result[0]?.generated_text) {
        summary = String(result[0].generated_text);
      } else if (typeof result?.summary_text === 'string') {
        summary = String(result.summary_text);
      } else if (typeof result?.generated_text === 'string') {
        summary = String(result.generated_text);
      }

      summary = (summary || '').trim();
      if (summary) {
        return summary;
      }
    } catch (err) {
      console.warn(`[ai] summarization error with ${model}:`, err);
      continue;
    }
  }

  console.log('[ai] all summarization models failed, returning fallback summary');
  return FALLBACK_SUMMARY_TEXT;
}

// Try the required interpretation models in order with the specified prompt
export async function interpretDream(dreamText: string): Promise<string> {
  const text = (dreamText || '').trim();
  if (!text) return FALLBACK_INTERPRETATION_TEXT;

  const truncated = text.length > 1500 ? text.slice(0, 1500) : text;
  const prompt = `Please interpret this dream in a meaningful, symbolic way: "${truncated}"`;

  const models = [
    'google/flan-t5-large',
    'google/flan-t5-base',
    'tiiuae/falcon-7b-instruct',
  ];

  for (const model of models) {
    try {
      console.log(`[ai] interpretation trying model: ${model}`);
      const response = await hfFetchJSON(model, {
        inputs: prompt,
        parameters: {
          max_new_tokens: 220,
          temperature: 0.6,
          top_p: 0.9,
          do_sample: true,
        },
        options: { wait_for_model: true },
      });

      if (!response.ok) {
        const status = response.status;
        const txt = await response.text().catch(() => '');
        console.warn(`[ai] interpretation ${model} failed: ${status} ${txt}`);
        if (status === 503) continue;
        continue;
      }

      const result = await response.json();

      let generated = '';
      if (Array.isArray(result) && result[0]?.generated_text) {
        generated = String(result[0].generated_text);
      } else if (typeof (result as any)?.generated_text === 'string') {
        generated = String((result as any).generated_text);
      } else if (Array.isArray(result) && result[0]?.summary_text) {
        // Some models might return summary_text. Use it if present.
        generated = String(result[0].summary_text);
      } else if (typeof result === 'string') {
        generated = result;
      }

      let interpretation = (generated || '').replace(prompt, '').trim();
      if (!interpretation) interpretation = (generated || '').trim();
      interpretation = interpretation.replace(/^interpretation:\s*/i, '').trim();

      if (interpretation) {
        return interpretation;
      }
    } catch (err) {
      console.warn(`[ai] interpretation error with ${model}:`, err);
      continue;
    }
  }

  console.log('[ai] all interpretation models failed, returning fallback interpretation');
  return FALLBACK_INTERPRETATION_TEXT;
}