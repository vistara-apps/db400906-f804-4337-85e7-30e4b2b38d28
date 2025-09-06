import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  baseURL: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'No text provided for parsing' },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 1000 characters.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an AI assistant that parses voice input into structured task and event data. 

IMPORTANT: You must respond with valid JSON only. No additional text or formatting.

Parse the user's input and return a JSON object with this exact structure:
{
  "type": "task" | "event",
  "title": "string",
  "description": "string (optional)",
  "dueDate": "ISO date string (optional)",
  "startTime": "ISO date string (optional)", 
  "endTime": "ISO date string (optional)",
  "location": "string (optional)",
  "priority": "low" | "medium" | "high"
}

Rules:
- If it's a task (like "remind me to...", "I need to...", "don't forget to..."), set type to "task"
- If it's an event (like "schedule a meeting...", "appointment at...", "call at..."), set type to "event"
- Extract dates and times naturally. Use current date/time as reference.
- For priority, infer from urgency words: "urgent", "important", "ASAP" = high; "when I have time", "eventually" = low; default = medium
- If no specific time mentioned, don't include time fields
- Keep titles concise but descriptive
- Use description for additional context if provided`;

    const userPrompt = `Parse this voice input: "${text}"`;

    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse and validate the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate required fields
    if (!parsedResult.type || !parsedResult.title) {
      throw new Error('Missing required fields in AI response');
    }

    // Validate type field
    if (!['task', 'event'].includes(parsedResult.type)) {
      throw new Error('Invalid type in AI response');
    }

    // Validate priority field
    if (parsedResult.priority && !['low', 'medium', 'high'].includes(parsedResult.priority)) {
      parsedResult.priority = 'medium';
    }

    // Ensure priority has a default value
    if (!parsedResult.priority) {
      parsedResult.priority = 'medium';
    }

    // Validate date strings
    if (parsedResult.dueDate) {
      try {
        new Date(parsedResult.dueDate);
      } catch {
        delete parsedResult.dueDate;
      }
    }

    if (parsedResult.startTime) {
      try {
        new Date(parsedResult.startTime);
      } catch {
        delete parsedResult.startTime;
      }
    }

    if (parsedResult.endTime) {
      try {
        new Date(parsedResult.endTime);
      } catch {
        delete parsedResult.endTime;
      }
    }

    return NextResponse.json({
      result: parsedResult,
      success: true,
    });

  } catch (error) {
    console.error('Parsing error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Parsing failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during parsing' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to parse text.' },
    { status: 405 }
  );
}
