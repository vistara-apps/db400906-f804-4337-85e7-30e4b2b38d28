import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
});

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription provided' },
        { status: 400 }
      );
    }

    const prompt = `
Parse the following voice input and extract task or event information. Return a JSON object with the following structure:

{
  "type": "task" | "event",
  "title": "string",
  "description": "string (optional)",
  "dueDate": "ISO date string (optional)",
  "startTime": "ISO date string (optional)",
  "endTime": "ISO date string (optional)",
  "location": "string (optional)",
  "priority": "low" | "medium" | "high" (optional, default medium)"
}

Voice input: "${transcription}"

Rules:
- If it's a task (like "remind me to...", "I need to...", "don't forget to..."), set type to "task"
- If it's an event (like "schedule a meeting...", "appointment at...", "call at..."), set type to "event"
- Extract dates and times naturally. If no specific time is mentioned, don't include time fields
- For priority, infer from urgency words like "urgent", "important", "ASAP" (high), "when I have time", "eventually" (low)
- For events without end time, assume 1 hour duration
- Use current date/time as reference for relative dates like "tomorrow", "next week"
- Return only valid JSON, no additional text
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_API_KEY ? 'google/gemini-2.0-flash-001' : 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that parses voice input into structured task and event data. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(content);
    
    // Validate required fields
    if (!parsed.type || !parsed.title) {
      throw new Error('Invalid response format from AI');
    }

    return NextResponse.json({
      parsed,
      success: true
    });

  } catch (error) {
    console.error('Parsing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to parse voice input',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
