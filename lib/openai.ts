import OpenAI from 'openai';
import { ParsedVoiceInput } from './types';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true,
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await openai.audio.transcriptions.create({
      file: audioBlob as any,
      model: 'whisper-1',
    });

    return response.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export async function parseVoiceInput(transcription: string): Promise<ParsedVoiceInput> {
  try {
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

Guidelines:
- If it mentions scheduling, meetings, appointments, or specific times, classify as "event"
- If it's about tasks, reminders, or to-dos, classify as "task"
- Extract dates and times relative to today
- Infer priority from urgency words (urgent=high, important=medium, later=low)
- Keep titles concise but descriptive
`;

    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that parses voice input into structured task and event data. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content) as ParsedVoiceInput;
    
    // Validate and set defaults
    if (!parsed.type) parsed.type = 'task';
    if (!parsed.title) parsed.title = transcription.slice(0, 50);
    if (!parsed.priority) parsed.priority = 'medium';

    return parsed;
  } catch (error) {
    console.error('Parsing error:', error);
    // Fallback parsing
    return {
      type: 'task',
      title: transcription.slice(0, 50),
      description: transcription,
      priority: 'medium'
    };
  }
}
