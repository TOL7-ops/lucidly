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

  const modelsToTry = ['microsoft/DialoGPT-medium', 'google/flan-t5-base', 'gpt2'];
  const dreamText = dreamContent.length > 300 ? dreamContent.substring(0, 300) : dreamContent;

  for (const model of modelsToTry) {
    try {
      console.log(`Trying dream interpretation with model: ${model}`);

      const prompt = model.includes('flan-t5')
        ? `Interpret this dream: ${dreamText}`
        : `Dream: ${dreamText}\nInterpretation: This dream suggests`;

      const response = await fetch(`${HF_API_BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Dream interpretation result:', result);

        if (result[0]?.generated_text) {
          const interpretation = result[0].generated_text.replace(prompt, '').trim();
          if (interpretation && interpretation.length > 10) {
            return interpretation.length > 200
              ? interpretation.substring(0, 200) + '...'
              : interpretation;
          }
        }
      } else {
        console.warn(`Interpretation model ${model} failed:`, response.status, response.statusText);
        if (response.status === 503) continue;
      }
    } catch (error) {
      console.warn(`Error with interpretation model ${model}:`, error);
      continue;
    }
  }

  console.log('All interpretation models failed, using detailed fallback');
  const fallbacks = [
    'This dream reflects your subconscious processing of recent experiences and emotions.',
    'The imagery in this dream suggests themes of transformation and personal growth.',
    'This dream may represent your mind working through challenges or aspirations.',
    'The symbolism indicates a journey of self-discovery and inner reflection.',
    'This dream could signify your unconscious desires for change or resolution.',
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ----------------- TRANSCRIPTION (Node.js version) -----------------
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error('Missing Hugging Face API key');

  const modelsToTry = [
    'openai/whisper-large-v3-turbo',
    'distil-whisper/distil-large-v3.5',
    'openai/whisper-large-v3',
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying transcription with model: ${model}`);

      const response = await fetch(`${HF_API_BASE}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': mimeType || 'audio/wav',
        },
        body: audioBuffer, // ✅ send Buffer directly
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
