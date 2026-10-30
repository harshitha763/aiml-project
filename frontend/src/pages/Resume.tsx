import { Download, Github, Linkedin, Globe, Mail, Phone, Code2, Award, Briefcase, GraduationCap, FolderGit2, Star } from 'lucide-react'

function downloadResume() {
  const content = `HARSHITHA V
Sri Eshwar College of Engineering | B.E. Computer & Communication Engineering
Contact: vijayguhan10@gmail.com | 8438434868 | LinkedIn | GitHub | Portfolio

────────────────────────────────────────────────────────────────────
SUMMARY
────────────────────────────────────────────────────────────────────
Results-driven Computer & Communication Engineering student (CGPA: 6.78)
with hands-on experience building full-stack web applications. Proficient
in React, Python, and database technologies. Passionate about AI-driven
products and software development. Solved 1100+ coding problems across
platforms. Seeking software development / IT roles as a fresher.

────────────────────────────────────────────────────────────────────
EDUCATION
────────────────────────────────────────────────────────────────────
B.E. Computer & Communication Engineering           2023 – 2027
Sri Eshwar College of Engineering                         CGPA: 6.78 (Vth Sem)

Higher Secondary (XII)  – Holy Cross Matriculation Higher Secondary School   79.4%  2023
Secondary (X)           – Holy Cross Matriculation Higher Secondary School   79.4%  2021

────────────────────────────────────────────────────────────────────
TECHNICAL SKILLS
────────────────────────────────────────────────────────────────────
Languages        : C (Intermediate), C++ (Basic), Python (Basic)
Web Technologies : HTML, CSS, JavaScript (Basic), React
Databases        : MySQL, PostgreSQL
Concepts         : Data Structures & Algorithms, DBMS, Data Science (Basic)
Tools            : VS Code, Git & GitHub, MySQL Workbench, Excel, Canva, Tailwind CSS

────────────────────────────────────────────────────────────────────
PROJECTS
────────────────────────────────────────────────────────────────────
1. Student Management System
   Tech: C, MySQL
   • Built a console-based system to manage student records and database operations
   • Implemented CRUD operations with structured data storage
   • Designed entity relationships for academic record management

2. Plant Disease Detection System
   Tech: Python, Machine Learning, Image Processing
   • Developed an ML model to identify plant diseases from leaf images
   • Helps farmers detect diseases early to prevent crop loss
   • Trained classification model on a labelled agricultural dataset

3. Job Portal & Resume Analyzer – Crackit AI
   Tech: React, PostgreSQL, Tailwind CSS, AI/ML
   • Built an AI-based campus placement platform
   • Features: resume analysis, company prediction, and interview practice
   • Integrated AI models for personalized career recommendations
   • Designed responsive UI with React and Tailwind CSS

4. AI Meeting & Lecture Intelligence System – IntelliMeet AI
   Tech: React, TypeScript, FastAPI, Python, SQLite, Tailwind CSS
   • Full-stack AI platform that converts meeting and lecture recordings into structured knowledge
   • Features: speech-to-text transcription, AI summaries, action item extraction, flashcards, quizzes
   • Built 93 REST API routes and 20+ interactive pages
   • Implemented spaced repetition (SM-2), AI assistant, smart search, and analytics

────────────────────────────────────────────────────────────────────
INTERNSHIP EXPERIENCE
────────────────────────────────────────────────────────────────────
AI Projects Contributor (Self-directed)                           2024 – Present
• Developed full-stack applications integrating AI/ML capabilities
• Built and deployed web applications using React, Python, and cloud tools

────────────────────────────────────────────────────────────────────
CERTIFICATIONS
────────────────────────────────────────────────────────────────────
• Python for Data Science & AI – IBM (Coursera)
• Frontend Development with React – Coursera
• SQL and Database Fundamentals – Udemy
• Data Structures & Algorithms – Coursera
• Prompt Engineering for Developers – DeepLearning.AI

────────────────────────────────────────────────────────────────────
ACHIEVEMENTS
────────────────────────────────────────────────────────────────────
• Solved 1100+ coding problems across LeetCode, HackerRank, and CodeChef
• Built and deployed 4 full-stack projects with AI integration
• Developed AI Meeting Intelligence System with end-to-end functionality
• Active participant in college-level hackathons and coding events

────────────────────────────────────────────────────────────────────
CODING PROFILES
────────────────────────────────────────────────────────────────────
LeetCode  : 1100+ problems solved
HackerRank: 5-star C programming
GitHub    : Active contributor with multiple repositories
`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Harshitha_V_Resume.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export function Resume() {
  return (
    <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
      {/* Header with controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Resume</h1>
          <p className="text-sm text-slate-400">Harshitha V — B.E. Computer & Communication Engineering</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-sm"
          >
            🖨️ Print
          </button>
          <button onClick={downloadResume} className="btn-primary text-sm">
            <Download size={15} /> Download TXT
          </button>
        </div>
      </div>

      {/* Resume card */}
      <div
        id="resume-print"
        className="card p-8 lg:p-10 space-y-7 text-slate-200"
        style={{ background: 'rgba(255,255,255,0.02)', fontFamily: 'Inter, sans-serif' }}
      >
        {/* ── Name & Contact ── */}
        <div className="text-center border-b border-white/10 pb-6">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Harshitha V</h2>
          <p className="text-base text-violet-400 font-medium mb-3">
            B.E. Computer &amp; Communication Engineering · Sri Eshwar College of Engineering
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            <a href="tel:8438434868" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone size={14} /> 8438434868
            </a>
            <a href="mailto:vijayguhan10@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={14} /> vijayguhan10@gmail.com
            </a>
            <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Linkedin size={14} /> LinkedIn
            </a>
            <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Github size={14} /> GitHub
            </a>
            <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Globe size={14} /> Portfolio
            </a>
          </div>
        </div>

        {/* ── Summary ── */}
        <Section icon={<Star size={16} className="text-amber-400" />} title="Summary">
          <p className="text-sm text-slate-300 leading-relaxed">
            Results-driven Computer &amp; Communication Engineering student with hands-on experience building
            full-stack web applications and AI-integrated platforms. Proficient in React, Python, and SQL databases.
            Passionate about AI-driven products and innovative software solutions. Solved <strong className="text-white">1100+ coding problems</strong> across
            competitive programming platforms. Actively seeking software development or IT roles as a fresher for
            campus placements and service-based companies.
          </p>
        </Section>

        {/* ── Education ── */}
        <Section icon={<GraduationCap size={16} className="text-cyan-400" />} title="Education">
          <table className="w-full text-sm">
            <tbody className="space-y-1">
              <EduRow degree="B.E. Computer &amp; Communication Engineering" institution="Sri Eshwar College of Engineering" score="CGPA: 6.78 (Vth Sem)" year="2023 – 2027" />
              <EduRow degree="Higher Secondary (XII)" institution="Holy Cross Matriculation Higher Secondary School" score="79.4%" year="2023" />
              <EduRow degree="Secondary (X)" institution="Holy Cross Matriculation Higher Secondary School" score="79.4%" year="2021" />
            </tbody>
          </table>
        </Section>

        {/* ── Skills ── */}
        <Section icon={<Code2 size={16} className="text-indigo-400" />} title="Technical Skills">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <SkillRow label="Languages" value="C (Intermediate) · C++ (Basic) · Python (Basic)" />
            <SkillRow label="Web Technologies" value="HTML · CSS · JavaScript · React · Tailwind CSS" />
            <SkillRow label="Databases" value="MySQL · PostgreSQL" />
            <SkillRow label="Concepts" value="DSA · DBMS · Data Science (Basic) · REST APIs" />
            <SkillRow label="Tools" value="VS Code · Git & GitHub · MySQL Workbench · Excel · Canva" />
          </div>
        </Section>

        {/* ── Projects ── */}
        <Section icon={<FolderGit2 size={16} className="text-violet-400" />} title="Projects">
          <div className="space-y-5">
            <ProjectCard
              title="AI Meeting & Lecture Intelligence System – IntelliMeet AI"
              tech="React · TypeScript · FastAPI · Python · SQLite · Tailwind CSS"
              link="#"
              percent="100%"
              bullets={[
                'Full-stack AI platform converting meeting/lecture recordings into structured knowledge',
                'Features: speech-to-text transcription, AI summaries, action item extraction, flashcards, quizzes',
                'Built 93 REST API routes, 20+ interactive pages, SM-2 spaced repetition algorithm',
                'Implemented AI assistant with source-backed Q&A, smart search, and analytics dashboard',
              ]}
            />
            <ProjectCard
              title="Job Portal & Resume Analyzer – Crackit AI"
              tech="React · PostgreSQL · Tailwind CSS · AI/ML"
              link="#"
              percent="85%"
              bullets={[
                'AI-based campus placement platform with resume analysis and company prediction',
                'Interview practice module with personalised AI recommendations',
                'Responsive UI built with React and Tailwind CSS',
              ]}
            />
            <ProjectCard
              title="Plant Disease Detection System"
              tech="Python · Machine Learning · Image Processing"
              link="#"
              percent="90%"
              bullets={[
                'ML model to identify plant diseases from leaf images, aiding early farmer detection',
                'Trained classification model on labelled agricultural dataset',
                'Achieved high accuracy using image preprocessing and CNN architecture',
              ]}
            />
            <ProjectCard
              title="Student Management System"
              tech="C · MySQL"
              link="#"
              percent="100%"
              bullets={[
                'Console-based system to manage student records with CRUD operations',
                'Structured data storage using relational database design with MySQL',
              ]}
            />
          </div>
        </Section>

        {/* ── Certifications ── */}
        <Section icon={<Award size={16} className="text-emerald-400" />} title="Certifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              ['Python for Data Science & AI', 'IBM / Coursera'],
              ['Frontend Development with React', 'Coursera'],
              ['SQL and Database Fundamentals', 'Udemy'],
              ['Data Structures & Algorithms', 'Coursera'],
              ['Prompt Engineering for Developers', 'DeepLearning.AI'],
            ].map(([name, provider]) => (
              <div key={name} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-200">{name}</span>
                <span className="text-slate-500 ml-auto shrink-0">{provider}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Achievements ── */}
        <Section icon={<Award size={16} className="text-amber-400" />} title="Achievements">
          <ul className="space-y-1.5 text-sm">
            {[
              'Solved 1100+ coding problems across LeetCode, HackerRank, and CodeChef',
              'Built and deployed 4 full-stack AI-integrated projects end-to-end',
              'Developed IntelliMeet AI — a complete AI Meeting & Lecture Intelligence System',
              'Active participant in college-level hackathons and coding competitions',
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <Star size={13} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-slate-200">{a}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Coding Profiles ── */}
        <Section icon={<Code2 size={16} className="text-pink-400" />} title="Coding Profiles">
          <div className="flex flex-wrap gap-3 text-sm">
            <ProfileBadge label="LeetCode" value="1100+ solved" color="bg-orange-500/10 text-orange-300 border-orange-500/20" />
            <ProfileBadge label="HackerRank" value="5★ C" color="bg-emerald-500/10 text-emerald-300 border-emerald-500/20" />
            <ProfileBadge label="GitHub" value="Active contributor" color="bg-slate-500/10 text-slate-300 border-slate-500/20" />
          </div>
        </Section>
      </div>

      <p className="text-xs text-center text-slate-600">Resume for Harshitha V · Generated by IntelliMeet AI · 2026</p>
    </div>
  )
}

/* ─── Helper components ─── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{icon}</div>
        <h3 className="text-base font-bold uppercase tracking-widest text-white" style={{ letterSpacing: '0.1em' }}>{title}</h3>
        <div className="flex-1 h-px bg-white/10 ml-2" />
      </div>
      {children}
    </div>
  )
}

function EduRow({ degree, institution, score, year }: { degree: string; institution: string; score: string; year: string }) {
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="py-2 text-slate-200 font-medium" dangerouslySetInnerHTML={{ __html: degree }} />
      <td className="py-2 text-slate-400 px-4">{institution}</td>
      <td className="py-2 text-indigo-400 font-semibold text-right whitespace-nowrap">{score}</td>
      <td className="py-2 text-slate-500 pl-4 text-right whitespace-nowrap">{year}</td>
    </tr>
  )
}

function SkillRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 shrink-0 w-36">{label}:</span>
      <span className="text-slate-200">{value}</span>
    </div>
  )
}

function ProjectCard({ title, tech, link, percent, bullets }: { title: string; tech: string; link: string; percent: string; bullets: string[] }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.025] border border-white/5 hover:border-violet-500/20 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{title}</span>
          <a href={link} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
            <Github size={12} /> GitHub
          </a>
        </div>
        <span className="badge-success text-xs">{percent} Complete</span>
      </div>
      <p className="text-xs text-indigo-400 font-medium mb-2">{tech}</p>
      <ul className="space-y-1">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span> {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProfileBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${color}`}>
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </div>
  )
}
