
export enum ViewMode {
  BATCHES = 'batches',
  SUBJECTS = 'subjects',
  CHAPTERS = 'chapters',
  LECTURES = 'lectures',
  LIBRARY = 'library',
  MOCK_TEST = 'mock-test',
  ADMIN = 'admin',
  MOCK_SIMULATOR = 'mock-simulator',
  MOCK_ADMIN = 'mock-admin',
  MOCK_TEST_V2 = 'mock-test-v2',
  MOCK_SIMULATOR_V2 = 'mock-simulator-v2',
  MOCK_ADMIN_V2 = 'mock-admin-v2'
}

export enum QuestionStatus {
  NOT_VISITED = 'NOT_VISITED',
  NOT_ANSWERED = 'NOT_ANSWERED',
  ANSWERED = 'ANSWERED',
  MARKED_FOR_REVIEW = 'MARKED_FOR_REVIEW',
  ANSWERED_MARKED_FOR_REVIEW = 'ANSWERED_MARKED_FOR_REVIEW',
}

export enum Subject {
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  MATHEMATICS = 'Mathematics',
}

export enum QuestionSubject {
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  MATHEMATICS = 'Mathematics',
}

export enum QuestionType {
  MCQ = 'MCQ',
  NUMERICAL = 'NUMERICAL',
}

export enum MockQuestionType {
  MCQ = 'MCQ',
  NUMERICAL = 'NUMERICAL',
}

export interface Question {
  id: string | number;
  subject: Subject;
  type: QuestionType;
  text?: string;
  options?: string[];
  correctOptionIndex?: number;
  correctNumericAnswer?: string;
  imageUrl?: string;
  solution?: string;
}

export interface MockQuestion {
  id: string;
  type: MockQuestionType;
  subject: QuestionSubject;
  text: string;
  options?: string[];
  correctOptionIndex?: number;
  correctNumericAnswer?: string;
  solution?: string;
  imageUrl?: string;
  order: number;
  difficulty?: 'Mains' | 'Advanced' | 'Foundation';
  isTopPYQ?: boolean;
}

export interface MockTest {
  id: string;
  title: string;
  category: 'pyq' | 'mocks';
  date: string;
  questionsCount: number;
  duration: number;
  level: string;
  isSample: boolean;
  published: boolean;
  createdAt: number;
  syllabus?: string;
  isExternalHtml?: boolean;
  externalHtmlUrl?: string;
}

export interface UserResponse {
  questionId: string | number;
  selectedOptionIndex?: number | null;
  numericAnswer?: string | null;
  status: QuestionStatus;
}

export interface ExamState {
  currentSubject: Subject;
  currentQuestionIndex: number;
  timeLeft: number;
  responses: Record<string | number, UserResponse>;
  isExamActive: boolean;
  isSubmitted: boolean;
  screen: 'LOGIN' | 'INSTRUCTIONS' | 'EXAM' | 'SUMMARY';
}