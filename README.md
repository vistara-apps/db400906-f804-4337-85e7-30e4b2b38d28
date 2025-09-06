# SpeakEasy Tasks - Voice-Powered Task Management

A Base Mini App that transforms your voice into organized to-do lists and calendar events using AI-powered transcription and natural language processing.

## Features

- **Voice-to-Task Conversion**: Speak your tasks and watch them become organized to-do items
- **Voice-to-Calendar Events**: Schedule appointments and meetings by speaking naturally
- **AI-Powered Parsing**: Intelligent extraction of dates, times, priorities, and locations
- **Beautiful UI**: Gradient backgrounds with floating elements and glass morphism design
- **Base Integration**: Built as a Base Mini App with OnchainKit integration
- **Real-time Updates**: Instant task and event management with smooth animations

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Voice Processing**: OpenAI Whisper API for transcription
- **AI Parsing**: OpenAI GPT for natural language understanding
- **Blockchain**: Base network integration via OnchainKit
- **Storage**: LocalStorage (demo) - ready for Supabase integration

## Getting Started

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd speakeasy-tasks
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.local` and add your API keys:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open**: Navigate to `http://localhost:3000`

## Usage

### Creating Tasks
- Click the microphone button
- Speak your task: "Remind me to buy groceries tomorrow at 5 PM"
- The AI will parse and create a structured task with due date and priority

### Scheduling Events
- Click the microphone button  
- Speak your event: "Schedule a team meeting next Tuesday at 2 PM for 1 hour"
- The AI will create a calendar event with proper timing

### Managing Items
- Toggle task completion with the check button
- Delete tasks and events with the trash button
- Switch between Tasks and Events tabs
- View completion statistics

## Voice Input Examples

**Tasks**:
- "Buy milk on the way home"
- "Call the dentist tomorrow morning - urgent"
- "Finish the project report by Friday"

**Events**:
- "Meeting with Sarah next Monday at 3 PM"
- "Doctor appointment Thursday at 10 AM for 30 minutes"
- "Team lunch at the Italian restaurant downtown at noon"

## Architecture

### Components
- `MicButton`: Voice recording with visual feedback
- `TaskListItem`: Individual task display and management
- `CalendarEventCard`: Event display with timing and location
- `FloatingElements`: Animated background elements

### Data Flow
1. Voice recording → Audio blob
2. OpenAI Whisper → Text transcription
3. OpenAI GPT → Structured data parsing
4. LocalStorage → Data persistence
5. React state → UI updates

### AI Processing
The app uses a two-step AI process:
1. **Transcription**: Convert speech to text using Whisper
2. **Parsing**: Extract structured data (dates, priorities, locations) using GPT

## Customization

### Design System
The app uses a comprehensive design system with:
- **Colors**: Purple/pink gradients with glass morphism
- **Spacing**: Consistent spacing scale (sm: 4px, md: 8px, lg: 16px, xl: 24px)
- **Typography**: Clear hierarchy with gradient text effects
- **Animations**: Smooth transitions and floating elements

### Extending Functionality
- **Backend Integration**: Replace LocalStorage with Supabase
- **Smart Contracts**: Add tokenized task rewards
- **Notifications**: Implement contextual reminders
- **Collaboration**: Add shared task lists

## Deployment

The app is optimized for deployment on Vercel or similar platforms:

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
