# IntelliMeet AI

**AI Meeting and Lecture Intelligence System**

> Listen Less. Understand More. Remember Everything.

IntelliMeet AI is a full-stack AI productivity and learning platform that transforms recorded meetings and classroom lectures into searchable, organized, actionable knowledge.

## Features

### Meeting Intelligence
- AI-powered meeting summaries with key points, decisions, and action items
- Structured meeting reports (executive summary, topics, decisions, next steps)
- Action item tracking with owners, deadlines, and priorities
- Follow-up email draft generation
- Transcript with timestamps and speaker labels

### Lecture Intelligence
- AI study notes in multiple formats (short, detailed, bullet, Q&A)
- Explanation levels: beginner, intermediate, advanced
- Auto-generated flashcards with spaced repetition (SM-2 algorithm)
- Quiz generation with multiple choice, true/false, and short answer questions
- Quiz scoring with explanations and attempt history

### AI Assistant
- Ask questions about any meeting or lecture
- Source-backed answers with transcript references and timestamps
- Conversation history management

### Additional Features
- Smart search across all content (meetings, lectures, transcripts, notes, action items, flashcards)
- Analytics dashboard with real data (meeting counts, task completion, quiz scores, topic frequency)
- Calendar with meetings, study sessions, and deadlines
- Audio/video upload with drag-and-drop
- Export transcripts, notes, and meeting reports as TXT or PDF
- User authentication with JWT tokens
- Dark/light theme support
- Responsive design (desktop, tablet, mobile)
- Demo mode with sample data

## Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React icons
- Recharts for analytics
- React Router v6

**Backend:**
- Python + FastAPI
- SQLAlchemy ORM
- SQLite (configurable for PostgreSQL)
- JWT authentication with bcrypt password hashing
- Pydantic v2 schemas

**AI Integrations:**
- OpenAI-compatible APIs (OpenAI, Groq, local models via LM Studio/Ollama)
- Anthropic Claude
- OpenAI Whisper for transcription
- Demo/fallback mode with clearly labeled sample data

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** or yarn

## Quick Start

### 1. Clone and navigate
```bash
cd intellimeet-ai
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy environment file
copy .env.example .env  (Windows)
cp .env.example .env    (macOS/Linux)

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
API docs at `http://localhost:8000/docs`.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

### 4. Open the app
Navigate to `http://localhost:5173` in your browser.

**Demo Mode** is enabled by default. Click "Try Demo Mode" on the landing page to explore all features with sample data. No registration required.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key...` | JWT signing key (change in production) |
| `DEMO_MODE` | `true` | Allow access without authentication |
| `DATABASE_URL` | `sqlite:///./intellimeet.db` | Database connection string |
| `UPLOAD_DIR` | `./storage/uploads` | File upload directory |
| `MAX_UPLOAD_SIZE_MB` | `500` | Max upload file size |
| `OPENAI_API_KEY` | (empty) | OpenAI API key for LLM + Whisper |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat model name |
| `OPENAI_WHISPER_MODEL` | `whisper-1` | Transcription model |
| `OPENAI_BASE_URL` | (empty) | Custom endpoint for local models |
| `GROQ_API_KEY` | (empty) | Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
| `ANTHROPIC_API_KEY` | (empty) | Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Anthropic model name |
| `TRANSCRIPTION_PROVIDER` | (empty) | Transcription provider |

Leave AI API keys blank to use **demo mode** with clearly labeled sample content.

## AI Provider Setup

### OpenAI
1. Get an API key from https://platform.openai.com/api-keys
2. Set `OPENAI_API_KEY` in `.env`
3. Transcription uses Whisper, summaries/chat use GPT models

### Local Models (LM Studio / Ollama)
1. Run LM Studio with a model loaded
2. Set `OPENAI_API_KEY=dummy` and `OPENAI_BASE_URL=http://localhost:1234/v1`
3. Set `OPENAI_MODEL` to your loaded model name

### Groq
1. Get an API key from https://console.groq.com/keys
2. Set `GROQ_API_KEY` in `.env`

### Anthropic
1. Get an API key from https://console.anthropic.com/
2. Set `ANTHROPIC_API_KEY` in `.env`

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Key endpoints:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/demo-login` - Demo login
- `GET /api/dashboard/stats` - Dashboard stats
- `POST /api/media/upload` - Upload file
- `GET/POST /api/meetings` - Meeting CRUD
- `GET/POST /api/lectures` - Lecture CRUD
- `POST /api/meetings/{id}/summary` - Generate summary
- `POST /api/assistant/ask` - Ask AI assistant
- `GET /api/search` - Smart search
- `GET /api/analytics` - Analytics
- `GET /api/export/*` - Export files

## Database

The app uses SQLite by default. To use PostgreSQL:
1. Install `psycopg2-binary`: `pip install psycopg2-binary`
2. Set `DATABASE_URL=postgresql://user:password@localhost:5432/intellimeet`

Tables are created automatically on startup via SQLAlchemy.

## Testing

### Backend
```bash
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
npm run test
```

## Project Structure

```
intellimeet-ai/
├── frontend/
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── pages/         # Route pages
│   │   ├── layouts/       # Layout wrappers
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utilities
│   │   ├── App.tsx        # Main app with routing
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route modules
│   │   ├── core/          # Config, database, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # AI, search, export, analytics
│   │   ├── demo/          # Demo data seeding
│   │   └── main.py        # FastAPI entrypoint
│   ├── storage/uploads/   # Uploaded files
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

## Demo Mode

Demo mode provides sample data to explore the platform without AI configuration:
- Sample meeting with transcript, summary, action items
- Sample lecture with flashcards, quiz, notes
- All demo data is clearly labeled with "[Demo]" prefix
- Use Settings → "Reset Demo Data" to clear demo records
- Demo data is isolated from real user data

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Ownership checks on all user-specific resources
- API keys stored server-side, never exposed to frontend
- CORS configured from environment
- File upload validation (type, size)
- Safe file storage (UUID filenames, no path traversal)

## Known Limitations

- Real-time transcription requires an AI provider (OpenAI Whisper)
- Semantic/vector search is not implemented (uses SQL LIKE search)
- Email notifications are not implemented (in-app reminders only)
- Collaboration features are designed but not fully implemented
- DOCX export requires additional setup
- Email-based password reset requires email service configuration
- Speaker diarization depends on the transcription provider

## Future Enhancements

- Vector search with embeddings
- Real-time collaboration with WebSockets
- Email and push notifications
- Mobile app
- Multi-language transcription
- Video processing with FFmpeg integration
- Calendar sync (Google Calendar, Outlook)
- Workspace sharing with RBAC

## License

This project is for educational/academic use.
