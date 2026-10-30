// Auto-detect backend URL: use environment variable in production, proxy in dev
const BASE_URL = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api`
  : '/api'

function getToken(): string | null {
  return localStorage.getItem('intellimeet_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('intellimeet_token', token)
  else localStorage.removeItem('intellimeet_token')
}

export function isLoggedIn(): boolean { return !!getToken() }

export function logout() {
  setToken(null)
  localStorage.removeItem('intellimeet_user')
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) }
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try { const err = await res.json(); detail = err.detail || err.message || detail } catch {}
    throw new Error(detail)
  }
  const ct = res.headers.get('content-type') || ''
  if (res.status === 204 || ct.includes('text/plain') || ct.includes('application/pdf') || ct.includes('octet-stream')) {
    return res as unknown as T
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, full_name: string) =>
    apiFetch<any>('/auth/register', { method:'POST', body:JSON.stringify({email,password,full_name}) }),
  login: (email: string, password: string) =>
    apiFetch<any>('/auth/login', { method:'POST', body:JSON.stringify({email,password}) }),
  demoLogin: () => apiFetch<any>('/auth/demo-login', { method:'POST' }),
  me: () => apiFetch<any>('/auth/me'),
  updateMe: (full_name: string) => apiFetch<any>('/auth/me', { method:'PUT', body:JSON.stringify({full_name}) }),
  deleteMe: () => apiFetch<any>('/auth/me', { method:'DELETE' }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => apiFetch<any>('/dashboard/stats'),
}

// ── Config ────────────────────────────────────────────────────────────────
export const configApi = {
  getConfig: () => apiFetch<any>('/config'),
  getHealth: () => apiFetch<any>('/health'),
}

// ── Media ─────────────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return apiFetch<any>('/media/upload', { method:'POST', body:fd })
  },
  list: (page=1, perPage=20, mediaType?: string) =>
    apiFetch<any>(`/media/?page=${page}&per_page=${perPage}${mediaType?`&media_type=${mediaType}`:''}`),
  get: (id: string) => apiFetch<any>(`/media/${id}`),
  update: (id: string, data: any) => apiFetch<any>(`/media/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/media/${id}`, { method:'DELETE' }),
  transcribe: (id: string) => apiFetch<any>(`/media/${id}/transcribe`, { method:'POST' }),
}

// ── Meetings ──────────────────────────────────────────────────────────────
export const meetingsApi = {
  list: (page=1, perPage=20) => apiFetch<any>(`/meetings/?page=${page}&per_page=${perPage}`),
  get: (id: string) => apiFetch<any>(`/meetings/${id}`),
  create: (data: any) => apiFetch<any>('/meetings/', { method:'POST', body:JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/meetings/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/meetings/${id}`, { method:'DELETE' }),
  generateSummary: (id: string, length='medium') =>
    apiFetch<any>(`/meetings/${id}/summary`, { method:'POST', body:JSON.stringify({length}) }),
  getSummary: (id: string) => apiFetch<any>(`/meetings/${id}/summary`),
  getReport: (id: string) => apiFetch<any>(`/meetings/${id}/report`),
  generateFollowUp: (id: string) => apiFetch<any>(`/meetings/${id}/follow-up-draft`, { method:'POST' }),
  listActionItems: (id: string) => apiFetch<any>(`/meetings/${id}/action-items`),
  createActionItem: (id: string, data: any) =>
    apiFetch<any>(`/meetings/${id}/action-items`, { method:'POST', body:JSON.stringify(data) }),
  updateActionItem: (meetingId: string, taskId: string, data: any) =>
    apiFetch<any>(`/meetings/${meetingId}/action-items/${taskId}`, { method:'PUT', body:JSON.stringify(data) }),
  deleteActionItem: (meetingId: string, taskId: string) =>
    apiFetch<any>(`/meetings/${meetingId}/action-items/${taskId}`, { method:'DELETE' }),
  listNotes: (id: string) => apiFetch<any>(`/meetings/${id}/notes`),
  createNote: (id: string, data: any) =>
    apiFetch<any>(`/meetings/${id}/notes`, { method:'POST', body:JSON.stringify(data) }),
  listBookmarks: (id: string) => apiFetch<any>(`/meetings/${id}/bookmarks`),
  createBookmark: (id: string, data: any) =>
    apiFetch<any>(`/meetings/${id}/bookmarks`, { method:'POST', body:JSON.stringify(data) }),
}

// ── Lectures ──────────────────────────────────────────────────────────────
export const lecturesApi = {
  list: (page=1, perPage=20) => apiFetch<any>(`/lectures/?page=${page}&per_page=${perPage}`),
  get: (id: string) => apiFetch<any>(`/lectures/${id}`),
  create: (data: any) => apiFetch<any>('/lectures/', { method:'POST', body:JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/lectures/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/lectures/${id}`, { method:'DELETE' }),
  generateSummary: (id: string, length='medium') =>
    apiFetch<any>(`/lectures/${id}/summary`, { method:'POST', body:JSON.stringify({length}) }),
  getSummary: (id: string) => apiFetch<any>(`/lectures/${id}/summary`),
  generateNotes: (id: string, level='intermediate', noteFormat='detailed') =>
    apiFetch<any>(`/lectures/${id}/notes/generate`, { method:'POST', body:JSON.stringify({level,note_format:noteFormat}) }),
  listNotes: (id: string) => apiFetch<any>(`/lectures/${id}/notes`),
  createNote: (id: string, data: any) =>
    apiFetch<any>(`/lectures/${id}/notes`, { method:'POST', body:JSON.stringify(data) }),
  generateFlashcards: (id: string, count=5) =>
    apiFetch<any>(`/lectures/${id}/flashcards?count=${count}`, { method:'POST' }),
  listFlashcards: (id: string) => apiFetch<any>(`/lectures/${id}/flashcards`),
  generateQuiz: (id: string, data: any) =>
    apiFetch<any>(`/lectures/${id}/quiz`, { method:'POST', body:JSON.stringify(data) }),
  listQuizzes: (id: string) => apiFetch<any>(`/lectures/${id}/quizzes`),
}

// ── Transcripts ───────────────────────────────────────────────────────────
export const transcriptsApi = {
  get: (id: string) => apiFetch<any>(`/transcripts/${id}`),
  update: (id: string, data: any) => apiFetch<any>(`/transcripts/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  updateSegment: (transcriptId: string, segId: string, data: any) =>
    apiFetch<any>(`/transcripts/${transcriptId}/segments/${segId}`, { method:'PUT', body:JSON.stringify(data) }),
  download: (id: string) =>
    fetch(`${BASE_URL}/export/transcript/${id}?format=txt`, {
      headers:{ Authorization:`Bearer ${getToken()}` }
    }).then(r => r.blob()),
}

// ── Action Items ──────────────────────────────────────────────────────────
export const actionItemsApi = {
  list: (page=1, perPage=20) => apiFetch<any>(`/action-items/?page=${page}&per_page=${perPage}`),
  update: (id: string, data: any) => apiFetch<any>(`/action-items/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/action-items/${id}`, { method:'DELETE' }),
}

// ── Notes ─────────────────────────────────────────────────────────────────
export const notesApi = {
  list: (page=1, perPage=20) => apiFetch<any>(`/notes/?page=${page}&per_page=${perPage}`),
  get: (id: string) => apiFetch<any>(`/notes/${id}`),
  create: (data: any) => apiFetch<any>('/notes/', { method:'POST', body:JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/notes/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/notes/${id}`, { method:'DELETE' }),
}

// ── Flashcards ────────────────────────────────────────────────────────────
export const flashcardsApi = {
  list: (page=1, perPage=50, lectureId?: string, topic?: string) =>
    apiFetch<any>(`/flashcards/?page=${page}&per_page=${perPage}${lectureId?`&lecture_id=${lectureId}`:''}${topic?`&topic=${topic}`:''}`),
  create: (data: any) => apiFetch<any>('/flashcards/', { method:'POST', body:JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/flashcards/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/flashcards/${id}`, { method:'DELETE' }),
  review: (id: string, rating: string) =>
    apiFetch<any>(`/flashcards/${id}/review`, { method:'POST', body:JSON.stringify({rating}) }),
  due: () => apiFetch<any>('/flashcards/due/cards'),
  studyStats: () => apiFetch<any>('/flashcards/study-stats'),
}

// ── Quizzes ───────────────────────────────────────────────────────────────
export const quizzesApi = {
  list: (page=1, perPage=20, lectureId?: string) =>
    apiFetch<any>(`/quizzes/?page=${page}&per_page=${perPage}${lectureId?`&lecture_id=${lectureId}`:''}`),
  get: (id: string) => apiFetch<any>(`/quizzes/${id}`),
  attempt: (id: string, answers: any[], time_taken=0) =>
    apiFetch<any>(`/quizzes/${id}/attempt`, { method:'POST', body:JSON.stringify({answers,time_taken_seconds:time_taken}) }),
  attempts: (id: string) => apiFetch<any>(`/quizzes/${id}/attempts`),
}

// ── Assistant ─────────────────────────────────────────────────────────────
export const assistantApi = {
  ask: (resourceType: string, resourceId: string, question: string, conversationId?: string) =>
    apiFetch<any>('/assistant/ask', { method:'POST', body:JSON.stringify({resource_type:resourceType,resource_id:resourceId,question,conversation_id:conversationId}) }),
  conversations: (page=1, perPage=20) =>
    apiFetch<any>(`/assistant/conversations?page=${page}&per_page=${perPage}`),
  getConversation: (id: string) => apiFetch<any>(`/assistant/conversations/${id}`),
  deleteConversation: (id: string) => apiFetch<any>(`/assistant/conversations/${id}`, { method:'DELETE' }),
}

// ── Search ────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (query: string, contentType?: string, dateFrom?: string, dateTo?: string) =>
    apiFetch<any>(`/search/?q=${encodeURIComponent(query)}${contentType?`&content_type=${contentType}`:''}${dateFrom?`&date_from=${dateFrom}`:''}${dateTo?`&date_to=${dateTo}`:''}`),
}

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: (dateFrom?: string, dateTo?: string) =>
    apiFetch<any>(`/analytics/${dateFrom?`?date_from=${dateFrom}`:''}${dateTo?`${dateFrom?'&':'?'}date_to=${dateTo}`:''}`),
}

// ── Calendar ──────────────────────────────────────────────────────────────
export const calendarApi = {
  list: async () => {
    const res = await apiFetch<any>('/calendar/events')
    return Array.isArray(res) ? res : res?.items || []
  },
  create: (data: any) => apiFetch<any>('/calendar/events', { method:'POST', body:JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/calendar/events/${id}`, { method:'PUT', body:JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/calendar/events/${id}`, { method:'DELETE' }),
}

// ── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => apiFetch<any>('/settings/'),
  update: (data: any) => apiFetch<any>('/settings/', { method:'PUT', body:JSON.stringify(data) }),
}

// ── Export ────────────────────────────────────────────────────────────────
export const exportApi = {
  transcript: (id: string) =>
    fetch(`${BASE_URL}/export/transcript/${id}?format=txt`, { headers:{Authorization:`Bearer ${getToken()}`} }).then(r => r.blob()),
  note: (id: string, format: 'txt'|'pdf') =>
    fetch(`${BASE_URL}/export/notes/${id}?format=${format}`, { headers:{Authorization:`Bearer ${getToken()}`} }).then(r => r.blob()),
  meetingReport: (id: string, format: 'txt'|'pdf') =>
    fetch(`${BASE_URL}/export/meeting-report/${id}?format=${format}`, { headers:{Authorization:`Bearer ${getToken()}`} }).then(r => r.blob()),
}

// ── Demo ──────────────────────────────────────────────────────────────────
export const demoApi = {
  seed:  () => apiFetch<any>('/demo/seed', { method:'POST' }),
  reset: () => apiFetch<any>('/demo/reset', { method:'DELETE' }),
}

// ── Helpers ───────────────────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
