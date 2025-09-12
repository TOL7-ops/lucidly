const HF_API_BASE = 'https://api-inference.huggingface.co/models';

interface HuggingFaceResponse {
  generated_text?: string
  label?: string
  score?: number
  text?: string
}

// ----------------- SUMMARIZATION -----------------
export async function summarizeText(text: string): Promise<string> {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error('Missing Hugging Face API key');

  const modelsToTry = [
    'facebook/bart-large-cnn',
    'sshleifer/distilbart-cnn-12-6',
    'microsoft/DialoGPT-medium',
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying summarization with model: ${model}`);

      const response = await fetch(`${HF_API_BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text.length > 1000 ? text.substring(0, 1000) : text,
          parameters: {
            max_length: 150,
            min_length: 30,
            do_sample: false,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Summarization result:', result);

        if (result[0]?.summary_text) return result[0].summary_text;
        if (result[0]?.generated_text) return result[0].generated_text.substring(0, 150);
      } else {
        console.warn(`Summarization model ${model} failed:`, response.status, response.statusText);
        if (response.status === 503) continue;
      }
    } catch (error) {
      console.warn(`Error with summarization model ${model}:`, error);
      continue;
    }
  }

  console.log('All summarization models failed, using fallback');
  return text.length > 150 ? text.substring(0, 147) + '...' : text;
}

// ----------------- SENTIMENT -----------------
export async function analyzeSentiment(text: string): Promise<any> {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error('Missing Hugging Face API key');

  const modelsToTry = [
    'cardiffnlp/twitter-roberta-base-sentiment-latest',
    'nlptown/bert-base-multilingual-uncased-sentiment',
    'distilbert-base-uncased-finetuned-sst-2-english',
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying sentiment analysis with model: ${model}`);

      const response = await fetch(`${HF_API_BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text.length > 500 ? text.substring(0, 500) : text,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sentiment analysis result:', result);

        if (Array.isArray(result) && result[0]) return result[0];
        if (result.label && result.score) return result;
      } else {
        console.warn(`Sentiment model ${model} failed:`, response.status, response.statusText);
        if (response.status === 503) continue;
      }
    } catch (error) {
      console.warn(`Error with sentiment model ${model}:`, error);
      continue;
    }
  }

  console.log('All sentiment models failed, using fallback');
  return { label: 'NEUTRAL', score: 0.5 };
}

// ----------------- DREAM INTERPRETATION -----------------
export async function interpretDream(dreamContent: string): Promise<string> {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error('Missing Hugging Face API key');

  // Lightweight, reliable default model
  const model = 'google/flan-t5-base';
  const dreamText = dreamContent.length > 1000 ? dreamContent.substring(0, 1000) : dreamContent;

  // Structured prompt per requirement
  const prompt = `Interpret this dream in a clear and insightful way, focusing on possible symbolism and meaning: ${dreamText}`;

  try {
    console.log(`Trying dream interpretation with model: ${model}`);

    const response = await fetch(`${HF_API_BASE}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.6,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Interpretation request failed: ${response.status} ${response.statusText} - ${errText}`);
      throw new Error(`HF interpretation failed: ${response.status}`);
    }

    const result = await response.json();

    // Extract generated_text across possible HF shapes
    let generated = '';
    if (Array.isArray(result) && result[0]?.generated_text) {
      generated = String(result[0].generated_text);
    } else if (typeof (result as any)?.generated_text === 'string') {
      generated = (result as any).generated_text as string;
    } else if (typeof result === 'string') {
      generated = result;
    }

    // Clean up: remove prompt echo if present and normalize whitespace
    let interpretation = generated.replace(prompt, '').trim();
    if (!interpretation || interpretation.length < 5) {
      interpretation = generated.trim();
    }
    interpretation = interpretation.replace(/^Interpretation:\s*/i, '').trim();

    if (interpretation && interpretation.length > 0) {
      return interpretation;
    }

    throw new Error('Empty interpretation from model');
  } catch (error) {
    console.warn('Dream interpretation error (FLAN-T5):', error);
    // Required fallback
    return 'This dream suggests hidden emotions and subconscious reflections.';
  }
}

// ----------------- TRANSCRIPTION (Node.js version) -----------------
export async function transcribeAudio(audioBuffer: Buffer | Uint8Array | ArrayBuffer, mimeType: string): Promise<string> {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error('Missing Hugging Face API key');

  const modelsToTry = [
    'openai/whisper-large-v3-turbo',
    'distil-whisper/distil-large-v3.5',
    'openai/whisper-large-v3',
  ];

  // Ensure compatibility with TS DOM BodyInit typing (Node fetch supports Buffer/TypedArray)
  const requestBody: any = audioBuffer as any;

  for (const model of modelsToTry) {
    try {
      console.log(`Trying transcription with model: ${model}`);

      const response = await fetch(`${HF_API_BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': mimeType || 'audio/wav',
        },
        body: requestBody,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('HF transcription result:', result);

        // Robust extraction across multiple possible HF shapes
        let transcript = '';
        if (result && typeof result === 'object' && 'text' in result && typeof (result as any).text === 'string') {
          transcript = (result as any).text.trim();
        } else if (Array.isArray(result) && result.length > 0) {
          const first = result[0] as any;
          if (typeof first?.text === 'string') {
            transcript = first.text.trim();
          } else if (typeof first?.generated_text === 'string') {
            transcript = first.generated_text.trim();
          } else if (typeof first?.transcript === 'string') {
            transcript = first.transcript.trim();
          }
        } else if (typeof result === 'string') {
          transcript = result.trim();
        } else if ((result as any)?.generated_text && typeof (result as any).generated_text === 'string') {
          transcript = (result as any).generated_text.trim();
        }

        if (transcript && transcript.length > 0) {
          return transcript;
        }

        // Log the full JSON response when no text is found, then try next model
        try {
          console.warn('No transcript found in HF response:', JSON.stringify(result).substring(0, 2000));
        } catch {
          console.warn('No transcript found in HF response (non-serializable object).');
        }
        continue;
      } else {
        const errText = await response.text();
        console.warn(`Model ${model} failed: ${response.status}`, errText);
        if (response.status === 503) continue;
        throw new Error(`HF transcription failed: ${errText}`);
      }
    } catch (err) {
      console.error(`Error with model ${model}:`, err);
      continue;
    }
  }

  throw new Error('All Hugging Face transcription models failed');
}
