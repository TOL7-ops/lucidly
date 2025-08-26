// pages/api/summary.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { apiResponse } from '../../src/lib/auth';

const HF_API_BASE = "https://api-inference.huggingface.co/models";

const modelsToTry = [
  "facebook/bart-large-cnn",
  "sshleifer/distilbart-cnn-12-6",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Summary API called with method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  console.log(`Request headers:`, req.headers);
  
  if (req.method !== "POST") {
    console.log(`Method ${req.method} not allowed, returning 405`);
    return apiResponse(res, 405, null, "Method not allowed");
  }

  const { dreamId, text } = req.body;
  console.log(`Request body:`, { dreamId, text: text ? text.substring(0, 100) + '...' : 'undefined' });

  if (!dreamId || !text) {
    console.log(`Missing required fields: dreamId=${!!dreamId}, text=${!!text}`);
    return apiResponse(res, 400, null, "Dream ID and text are required");
  }

  try {
    console.log(`Generating summary for dream ID: ${dreamId}`);
    console.log(`Text to summarize: ${text.substring(0, 100)}...`);
    
    // Step 1: Generate AI summary
    let generatedSummary = null;
    
    // Try each model for summarization
    for (const model of modelsToTry) {
      try {
        console.log(`Trying summarization with model: ${model}`);

        const response = await fetch(`${HF_API_BASE}/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
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

        if (!response.ok) {
          console.error(`Model ${model} failed with status: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const summary =
          Array.isArray(data) && data.length > 0 && data[0].summary_text
            ? data[0].summary_text
            : null;

        if (summary) {
          console.log(`Summary generated successfully with model ${model}`);
          console.log(`Summary: ${summary}`);
          generatedSummary = summary;
          break;
        }
      } catch (error) {
        console.error(`Model ${model} threw error:`, error);
        continue;
      }
    }

    if (!generatedSummary) {
      console.error('All summarization models failed');
      return apiResponse(res, 500, null, "All summarization models failed. Try again later.");
    }

    // Step 2: Save summary to database
    console.log('Saving summary to database...');
    
    try {
      // Import supabase dynamically to avoid SSR issues
      const { supabase } = await import('../../src/lib/supabase');
      
      const { data: updatedDream, error: updateError } = await supabase
        .from('dreams')
        .update({ summary: generatedSummary })
        .eq('id', dreamId)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return apiResponse(res, 500, null, 'Failed to save summary to database');
      }

      console.log('Summary saved to database successfully');
      console.log('Updated dream:', updatedDream);

      return apiResponse(res, 200, {
        success: true,
        summary: generatedSummary,
        dreamId
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return apiResponse(res, 500, null, 'Database error: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'));
    }

  } catch (error) {
    console.error('Error in summary endpoint:', error);
    return apiResponse(res, 500, null, 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
} 