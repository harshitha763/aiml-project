// Type definitions matching backend Pydantic schemas

export interface User {
  id: string
  email: string
  full_name: string
  is_demo: boolean
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
  user: User | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface MediaAsset {
  id: string
  filename: string
  stored_filename: string
  file_size: number
  mime_type: string
  media_type: string
  duration_seconds: number
  language: string
  title: string
  description: string
  category: string
  status: string
  status_message: string
  progress: number
  speaker_labels: boolean
  created_at: string
  updated_at: string
}

export interface UploadResponse {
  id: string
  filename: string
  media_type: string
  file_size: number
  status: string
  message: string
}

export interface Meeting {
  id: string
  user_id: string
  title: string
  description: string
  date: string
  duration_minutes: number
  participants: string
  location: string
  media_asset_id: string | null
  status: string
  notes: string
  created_at: string
  updated_at: string
  has_summary?: boolean
  action_item_count?: number
  media_filename?: string | null
}

export interface Lecture {
  id: string
  user_id: string
  title: string
  description: string
  subject: string
  lecturer: string
  date: string
  duration_minutes: number
  media_asset_id: string | null
  status: string
  explanation_level: string
  revision_status: string
  created_at: string
  updated_at: string
  has_summary?: boolean
  media_filename?: string | null
}

export interface TranscriptSegment {
  id: string
  index: number
  speaker: string
  text: string
  start_time: number
  end_time: number
  confidence: number
}

export interface Transcript {
  id: string
  media_asset_id: string
  full_text: string
  language: string
  duration_seconds: number
  speaker_count: number
  is_demo: boolean
  segments: TranscriptSegment[]
  created_at: string
  updated_at: string
}

export interface Summary {
  id: string
  meeting_id: string | null
  lecture_id: string | null
  summary_text: string
  key_points: string
  decisions: string
  unresolved_questions: string
  risks: string
  next_steps: string
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface ActionItem {
  id: string
  meeting_id: string
  user_id: string
  description: string
  owner: string
  due_date: string | null
  priority: string
  status: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface PersonalNote {
  id: string
  user_id: string
  meeting_id: string | null
  lecture_id: string | null
  title: string
  content: string
  note_type: string
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  meeting_id: string | null
  lecture_id: string | null
  media_asset_id: string | null
  label: string
  note: string
  timestamp: number
  created_at: string
}

export interface Flashcard {
  id: string
  user_id: string
  lecture_id: string | null
  front: string
  back: string
  topic: string
  difficulty: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_date: string
  last_reviewed: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_type: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  topic: string
  order_index: number
}

export interface Quiz {
  id: string
  user_id: string
  lecture_id: string | null
  title: string
  description: string
  difficulty: string
  is_demo: boolean
  created_at: string
  questions: QuizQuestion[]
}

export interface QuizAnswerResponse {
  id: string
  question_id: string
  user_answer: string
  is_correct: boolean
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  correct_count: number
  time_taken_seconds: number
  completed_at: string
  answers: QuizAnswerResponse[]
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string
  event_type: string
  start_time: string
  end_time: string | null
  location: string
  related_meeting_id: string | null
  related_lecture_id: string | null
  reminder_minutes: number
  created_at: string
}

export interface AssistantMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  references_json: string
  created_at: string
}

export interface AssistantConversation {
  id: string
  user_id: string
  title: string
  meeting_id: string | null
  lecture_id: string | null
  resource_type: string
  resource_id: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  messages: AssistantMessage[]
}

export interface AssistantAskResponse {
  answer: string
  references: any[]
  conversation_id: string
  message_id: string
  is_demo: boolean
}

export interface SearchResult {
  resource_type: string
  resource_id: string
  title: string
  preview: string
  url: string
  created_at: string
}

export interface DashboardStats {
  meeting_count: number
  lecture_count: number
  total_duration_minutes: number
  summaries_generated: number
  pending_tasks: number
  completed_tasks: number
  flashcards_created: number
  quizzes_taken: number
  avg_quiz_score: number
  due_flashcards: number
  media_assets: number
  recent_activity: { type: string; id: string; title: string; timestamp: string }[]
}

export interface Analytics {
  meeting_count: number
  lecture_count: number
  total_duration_minutes: number
  summaries_generated: number
  pending_tasks: number
  completed_tasks: number
  flashcards_created: number
  quizzes_taken: number
  quiz_attempts: number
  avg_quiz_score: number
  media_assets: number
  notes_count: number
  bookmarks_count: number
  recent_activity: { type: string; id: string; title: string; timestamp: string }[]
  topics: { topic: string; count: number; kind?: string }[]
}

export interface UserSettings {
  id: string
  user_id: string
  theme: string
  language: string
  default_transcription_language: string
  default_summary_length: string
  preferred_note_format: string
  default_explanation_level: string
  created_at: string
  updated_at: string
}

export interface MeetingReport {
  meeting_id: string
  title: string
  date: string
  duration_minutes: number
  participants: string
  executive_summary: string
  purpose: string
  main_topics: string[]
  decisions: string[]
  action_items: ActionItem[]
  responsible_people: string[]
  deadlines: string[]
  unresolved_questions: string[]
  next_steps: string[]
}

export interface FollowUpDraft {
  subject: string
  body: string
  is_demo: boolean
}

export interface AppConfig {
  is_ai_configured: boolean
  is_transcription_configured: boolean
  demo_mode: boolean
}

export interface StudyStats {
  total_cards: number
  due_cards: number
  total_reviews: number
  avg_ease_factor: number
}
