import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
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

export async function parseVoiceInput(transcription: string) {
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

If it's a task (like "remind me to...", "I need to...", "don't forget to..."), set type to "task".
If it's an event (like "schedule a meeting...", "appointment at...", "call at..."), set type to "event".

Extract dates and times naturally. If no specific time is mentioned, don't include time fields.
For priority, infer from urgency words like "urgent", "important", "ASAP" (high), "when I have time", "eventually" (low).
`;

    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
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
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Parsing error:', error);
    throw new Error('Failed to parse voice input');
  }
}
