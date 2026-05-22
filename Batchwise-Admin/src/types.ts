
export enum ViewMode {
  BATCHES = 'batches',
  SUBJECTS = 'subjects',
  CHAPTERS = 'chapters',
  LECTURES = 'lectures',
  LIBRARY = 'library',
  STUDIO = 'studio',
  SEARCH_LAB = 'search-lab',
  MOCK_TEST = 'mock-test',
  ADMIN = 'admin',
  MOCK_SIMULATOR = 'mock-simulator',
  MOCK_ADMIN = 'mock-admin',
  MOCK_TEST_V2 = 'mock-test-v2',
  MOCK_SIMULATOR_V2 = 'mock-simulator-v2',
  MOCK_ADMIN_V2 = 'mock-admin-v2',
  SETTINGS = 'settings',
  LIBRARY_ADMIN = 'library-admin',
  MARKETPLACE = 'marketplace',
  NOTIFICATIONS = 'notifications',
  YOUTUBE_IMPORT = 'youtube-import',
  BATCH_LANDING = 'batch-landing',
  ACCESS_REQUESTS = 'access-requests',
  BATCH_ADMIN = 'batch-admin',
  INSTRUCTOR_CONSOLE = 'instructor-console'
}

export enum QuestionSubject {
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  MATHEMATICS = 'Mathematics',
}

export enum MockQuestionType {
  MCQ = 'MCQ',
  NUMERICAL = 'NUMERICAL',
}

export interface MockQuestion {
  id: string;
  type: MockQuestionType;
  subject: QuestionSubject;
  text: string;
  options?: string[]; // for MCQ
  correctOptionIndex?: number; // for MCQ
  correctNumericAnswer?: string; // for Numerical
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
  duration: number; // in minutes
  level: string;
  isSample: boolean;
  published: boolean;
  createdAt: number;
  syllabus?: string;
  isExternalHtml?: boolean;
  externalHtmlUrl?: string;
}

export interface Lecture {
  id: string;
  title: string;
  youtubeUrl: string;
  embedUrl: string;
  completed: boolean;
  duration?: number; // duration in seconds
  studyTime?: number;
  description?: string;
  scheduledDate?: string; // ISO YYYY-MM-DD
  isFreePreview?: boolean;
}

export interface StudySession {
  id: string;
  lectureId: string;
  lectureTitle: string;
  subjectName: string;
  duration: number;
  timestamp: number; // Date.now()
}


export interface Chapter {
  id: string;
  name: string;
  lectures: Lecture[];
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface Slot {
  id: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
}

export interface BatchSettings {
  lecturesPerWeek: number; // 1-7
  lecturesPerDay: number;  // 1-5
  batchType: 'Morning' | 'Evening' | 'Weekend' | 'Custom';
  slotTimings: Slot[];
  enableScheduler: boolean;
  bufferTimeMinutes: number;
  notificationTime?: string; // "HH:mm"
}

export interface BatchTheme {
  coverImage?: string;
  gradient: string;
  accentColor: string;
}

export interface Batch {
  id: string;
  name: string;
  createdAt: number;
  subjects: Subject[];
  isDirty?: boolean;
  settings?: BatchSettings;
  sessions?: StudySession[];
  theme?: BatchTheme;
  inviteCode?: string;
  // Sharing & Marketplace fields
  isPublic?: boolean;
  isFeatured?: boolean;
  creatorName?: string;
  creatorId?: string;
  creatorAvatar?: string;
  category?: string;
  difficulty?: 'Advanced' | 'Intermediate' | 'Beginner' | 'Foundation' | 'Olympiad';
  importCount?: number;
  avgCompletion?: number;
  totalQuestions?: number;
  description?: string;
  sharedAt?: string;
  progressVisibility?: 'everyone' | 'members' | 'me';
  importPermission?: 'public' | 'restricted' | 'disabled';
  price?: number;
  contactLink?: string;
  requireApproval?: boolean;
  aboutHtml?: string;
}


export type ModalType = 'prompt' | 'confirm' | 'add-lecture' | 'share-link' | 'import-playlist' | 'import-csv' | 'coming-soon' | 'share-settings';

export interface ModalConfig {
  type: ModalType;
  title: string;
  message?: string;
  placeholder?: string;
  confirmLabel: string;
  initialValue?: string;
  onConfirm: (val: any) => void;
}
export interface LibraryResource {
  id: string;
  title: string;
  color: string;
  category?: string;
  tagColor?: string;
  status?: string;
  href?: string;
  reserved?: boolean;
  description?: string;
  order: number;
  coverImageUrl?: string;
}

export interface AccessRequest {
  id?: string;
  batchId: string;
  batchName: string;
  ownerId: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}


