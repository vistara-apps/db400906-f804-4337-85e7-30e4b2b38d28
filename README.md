# SpeakEasy Tasks

A Base Mini App that transforms your voice into organized to-do lists and calendar events using AI-powered transcription and natural language processing.

## Features

- **Voice-to-Task Conversion**: Speak your tasks and watch them become organized to-do items
- **Voice-to-Calendar Events**: Schedule appointments and meetings by speaking naturally
- **Smart AI Parsing**: Automatically extracts dates, times, priorities, and locations from speech
- **Beautiful UI**: Gradient glass-morphism design with smooth animations
- **Base Integration**: Built as a Base Mini App with OnchainKit integration
- **Real-time Updates**: Instant feedback and task/event creation

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Blockchain**: Base network integration via OnchainKit
- **AI**: OpenAI Whisper for transcription, GPT for natural language processing
- **Storage**: LocalStorage (demo) - easily extensible to Supabase
- **Voice**: Web Audio API for recording

## Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd speakeasy-tasks
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   - `NEXT_PUBLIC_OPENAI_API_KEY` or `NEXT_PUBLIC_OPENROUTER_API_KEY`
   - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## Usage

### Creating Tasks
- Click the microphone button
- Say something like: "Remind me to buy groceries tomorrow at 5 PM"
- The app will create a task with the correct due date and priority

### Creating Events
- Click the microphone button  
- Say something like: "Schedule a meeting with John next Tuesday at 2 PM"
- The app will create a calendar event with the specified time

### Managing Items
- View all tasks in the Tasks tab
- Check off completed tasks
- View upcoming events in the Calendar tab
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

## Architecture

### Components
- `VoiceInput`: Main voice recording and processing component
- `MicButton`: Animated microphone button with recording states
- `TaskListItem`: Individual task display with completion and deletion
- `CalendarEventCard`: Event display with time and location info
- `TaskList`: Task management and organization
- `CalendarView`: Calendar event organization by time periods

### Data Flow
1. User speaks into microphone
2. Audio is recorded using Web Audio API
3. Audio is transcribed using OpenAI Whisper
4. Transcription is parsed using GPT to extract structured data
5. Task or event is created and stored
6. UI updates to show the new item

### Storage
- **Demo**: LocalStorage for immediate functionality
- **Production Ready**: Easily extensible to Supabase or other backends
- **Future**: On-chain storage for decentralized task management

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

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Environment Variables for Production
- Set all API keys in your deployment platform
- Ensure CORS is configured for your domain
- Test microphone permissions on HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub issues
- Review the documentation
- Test with different browsers for microphone compatibility

---

Built with ❤️ on Base
