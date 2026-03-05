
export interface User {
  id: string;
  name: string;
  email: string;
  role?: "student" | "instructor";
  created_at?: string;
  token?: string;
}

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  extracted_text: string;
  summary: string;
  mode: 'basic' | 'detailed' | 'overview';
  created_at: string;
}

export interface Quiz {
  id: string;
  topic_id: string;
  created_at: string;
  questions?: QuizQuestionDeep[];
}

// Added missing QuizQuestion interface used in basic quiz generation
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}
export interface QuizQuestionDeep {
  id?: string;
  quiz_id?: string;
  text: string;
  options: string[];
  correct_answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  concept_tag: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  attempt_number: number;
  score: number;
  answers_json: number[];
  time_taken_seconds: number;
  attempted_at: string;
  integrity_flags: string[];
  question_results: {
    question_id: string;
    question: string;
    options: string[];
    selected_answer: number;
    correct_answer: number;
    is_correct: boolean;
    difficulty: string;
    concept_tag: string;
  }[];
}


// Added missing ProgressData interface for tracking user performance history
export interface ProgressData {
  date: string;
  score: number;
  timeSpent: number;
}

export interface AnalyticsData {
  accuracyTrend: { date: string; score: number; topic: string }[];
  weakConcepts: { concept: string; score: number; totalQuestions: number }[];
  difficultyBreakdown: { difficulty: string; score: number }[];
  availableTopics: { id: string; name: string }[];
  overallScore: number;
  performanceTier: string;
  integrityReport: {
    totalViolations: number;
    suspiciousAttempts: number;
    tabSwitches: number;
    windowBlurs: number;
  };
  aiInsights?: {
    suggestions: string[];
    recommendedResources: { title: string; type: string; url: string }[];
  };
}


export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  summary?: string;
  completed: boolean;
  score?: number;
}

// Updated Certificate interface to include camelCase properties used in components and made optional fields for flexibility
export interface Certificate {
  id: string;
  user_id?: string;
  quiz_id?: string;
  certificate_uid?: string;
  score?: number;
  topic_title?: string;
  user_name?: string;
  issued_at?: string;
  courseTitle: string;
  userName: string;
  issueDate: string;
  pdf_url?: string;
  download_url?: string;
}
