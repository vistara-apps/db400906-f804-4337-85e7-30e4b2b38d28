# SpeakEasy Tasks

A production-ready Base Mini App that transforms your voice into organized to-do lists and calendar events using AI-powered transcription and natural language processing.

## 🚀 Features

### Core Functionality
- **🎤 Voice-to-Task Conversion**: Speak your tasks and watch them become organized to-do items
- **📅 Voice-to-Calendar Events**: Schedule appointments and meetings by speaking naturally
- **🧠 Smart AI Parsing**: Automatically extracts dates, times, priorities, and locations from speech
- **🔔 Contextual Reminders**: Get reminded based on time, location, or task completion
- **✨ AI Task Prioritization**: Intelligent task ordering using the Eisenhower Matrix
- **🌐 Farcaster Frame Integration**: Share and interact via Farcaster frames

### Technical Features
- **🎨 Beautiful UI**: Gradient glass-morphism design with smooth animations
- **⚡ Real-time Updates**: Instant feedback and task/event creation
- **🔗 Base Integration**: Built as a Base Mini App with OnchainKit integration
- **☁️ Cloud Storage**: Supabase integration with automatic fallback to localStorage
- **📱 Progressive Web App**: Works offline and can be installed on mobile devices
- **🔐 Secure**: Row-level security and proper authentication handling

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Blockchain**: Base network integration via OnchainKit
- **AI**: OpenAI Whisper for transcription, GPT/Gemini for natural language processing
- **Database**: Supabase (PostgreSQL) with localStorage fallback
- **Voice**: Web Audio API for recording
- **Notifications**: Browser notifications with toast feedback
- **Styling**: Tailwind CSS with custom glass-morphism components

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key or OpenRouter API key
- OnchainKit API key
- Supabase project (optional, for production)

### 1. Clone and Install
```bash
git clone https://github.com/vistara-apps/db400906-f804-4337-85e7-30e4b2b38d28.git
cd db400906-f804-4337-85e7-30e4b2b38d28
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Required: AI API Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
# OR
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Required: OnchainKit Configuration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here

# Optional: Supabase Configuration (for production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Base URL for Farcaster frames
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 3. Database Setup (Optional - Supabase)
If you want to use Supabase for production storage:

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Add your Supabase credentials to `.env.local`

### 4. Run Development Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Creating Tasks
1. Click the microphone button on the Voice tab
2. Speak your task naturally: "Remind me to buy groceries tomorrow at 5 PM"
3. The AI will parse your speech and create a structured task
4. Tasks automatically get due dates, priorities, and descriptions
5. Contextual reminders are automatically created based on due dates and priority

### Scheduling Events
1. Use the voice input to schedule events
2. Say something like: "Schedule a meeting with John next Tuesday at 2 PM for one hour"
3. The system will create a calendar event with proper timing
4. Automatic reminders are set (15 minutes and 1 hour before events)

### AI Task Prioritization
1. Go to the Tasks tab
2. Click the "AI Prioritize" button (✨ icon)
3. The AI will analyze your tasks using the Eisenhower Matrix
4. Tasks will be reordered by importance and urgency
5. Priority levels will be updated automatically

### Managing Items
- View all tasks in the Tasks tab with AI-powered prioritization
- Check off completed tasks
- View upcoming events in the Calendar tab with smart reminders
- Delete items by hovering and clicking the trash icon

## Voice Commands Examples

### Tasks
- "Remind me to call mom tonight"
- "I need to finish the project report by Friday"
- "Don't forget to take out the trash tomorrow morning"
- "Buy milk and eggs when I have time" (low priority)
- "URGENT: Submit the proposal by 3 PM today" (high priority)

### Events
- "Schedule a dentist appointment next Monday at 10 AM"
- "Meeting with the team tomorrow at 2 PM in the conference room"
- "Lunch with Sarah on Friday at noon at the Italian restaurant"
- "Call with client at 4 PM today"

## 🏗 Architecture

### Core Components
- `VoiceInput`: Handles audio recording and AI processing
- `TaskList`: Displays and manages tasks with prioritization
- `CalendarView`: Shows upcoming events with reminders
- `MicButton`: Voice recording interface with visual feedback

### Services & Libraries
- `StorageService`: Unified data layer (Supabase + localStorage fallback)
- `AITaskPrioritizer`: Intelligent task prioritization using AI
- `ContextualReminderService`: Smart reminder system
- `api/transcribe`: Voice-to-text conversion endpoint
- `api/parse`: Natural language processing endpoint
- `api/frame`: Farcaster Frame integration

### Database Schema
The app uses a comprehensive PostgreSQL schema with:
- **Users**: Profile and authentication data
- **Tasks**: To-do items with priorities and due dates
- **Calendar Events**: Scheduled events with time and location
- **Reminders**: Contextual notifications
- **Voice Transcriptions**: Analytics and improvement data
- **AI Prioritizations**: Tracking AI suggestions and feedback

### Enhanced Data Flow
1. User speaks into microphone
2. Audio is recorded using Web Audio API
3. Audio is sent to `/api/transcribe` (OpenAI Whisper)
4. Transcription is sent to `/api/parse` (GPT/Gemini NLP)
5. Structured data is saved via StorageService
6. Contextual reminders are automatically created
7. UI updates with toast notifications and real-time feedback

## Customization

### Design System
The app uses a comprehensive design system with:
- **Colors**: Purple/pink gradients with glass morphism
- **Typography**: Clean, readable fonts with proper hierarchy
- **Animations**: Smooth transitions and floating elements
- **Responsive**: Mobile-first design

### Extending Functionality
- Add more AI providers in `lib/openai.ts`
- Implement backend storage in `lib/storage.ts`
- Add new voice command patterns in the parsing logic
- Integrate with external calendar services

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
```env
# Required
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key

# For Supabase (recommended for production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Farcaster frames
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Database Setup for Production
1. Create a Supabase project
2. Run the SQL from `supabase-schema.sql`
3. Configure Row Level Security policies
4. Add environment variables

## 📱 Farcaster Integration

The app includes a Farcaster Frame at `/api/frame` that allows users to:
- Create tasks directly from Farcaster
- View their calendar
- Share productivity updates

Frame features:
- Dynamic meta tags for proper rendering
- Button actions for task creation and calendar viewing
- Responsive design for mobile and desktop

## 🔧 API Documentation

### POST /api/transcribe
Converts audio to text using OpenAI Whisper.

**Request**: FormData with audio file
**Response**: `{ transcription: string }`

### POST /api/parse
Parses natural language into structured task/event data.

**Request**: `{ transcription: string }`
**Response**: `{ parsed: ParsedVoiceInput }`

### GET /api/frame
Returns Farcaster Frame HTML with proper meta tags.

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use proper error handling
- Add comments for complex logic
- Test voice input functionality
- Ensure mobile responsiveness

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz/) for Base integration
- Powered by [OpenAI](https://openai.com/) for AI capabilities
- Database by [Supabase](https://supabase.com/)
- UI components inspired by glass-morphism design trends

## Support

For issues and questions:
- Check the GitHub issues
- Review the documentation
- Test with different browsers for microphone compatibility

---

Built with ❤️ on Base
