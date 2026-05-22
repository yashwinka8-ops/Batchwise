export enum ViewMode {
  BATCHES = 'batches',
  SUBJECTS = 'subjects',
  CHAPTERS = 'chapters',
  LECTURES = 'lectures',
  LIBRARY = 'library',
  STUDIO = 'studio',
  SEARCH_LAB = 'search-lab',
  ADMIN = 'admin',
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
  isDemo?: boolean;
  notesPdfUrl?: string;
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
  offDays?: string[]; // Array of YYYY-MM-DD strings
}

export interface BatchTheme {
  coverImage?: string;
  gradient: string;
  accentColor: string;
}

export interface Batch {
  id: string;
  name: string;
  genre?: 'study' | 'creative' | 'skill';
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
  isFree?: boolean;
  stagedSubjects?: Subject[];
  lastDeployedAt?: number;
  enableLandingPage?: boolean;
  syllabusHighlights?: string[];
  bannerImages?: string[];
  sourceCreatorId?: string;
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
  contributorId?: string;
  contributorEmail?: string;
  contributorName?: string;
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

export interface Doubt {
  id: string;
  batchId: string;
  lectureId: string;
  lectureTitle: string;
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  text: string;
  timestamp?: number; // Video timestamp in seconds
  status: 'pending' | 'resolved';
  reply?: string;
  repliedBy?: string;
  repliedAt?: number;
  createdAt: number;
}

export interface BatchStaff {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'tutor';
  batchId: string;
}

export interface DoubtReply {
  id: string;
  doubtId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  isVerified?: boolean; 
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  createdAt: number;
  type?: 'text' | 'image' | 'file' | 'post';
  fileUrl?: string;
  likes?: string[]; // Array of UIDs
  reactionCount?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  academicGoals?: string[];
  subjects?: string[];
  studyStreak: number;
  totalHours: number;
  badges: string[];
  points: number;
  isVerified?: boolean;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
  };
}

export interface CommunityGroup {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  memberCount: number;
  isPrivate: boolean;
  batchId?: string; 
  createdAt: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  groupId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: number;
  votedBy: string[]; 
}

export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  participants: string[]; 
  activeNow: number;
  batchId?: string;
  createdAt: number;
}

export interface LectureNote {
  id: string;
  lectureId: string;
  chapterId: string;
  subjectId: string;
  batchId: string;
  userId: string;
  text: string;
  timestamp: number;
  createdAt: number;
}

export interface BatchResource {
  id: string;
  lectureId: string;
  chapterId: string;
  subjectId: string;
  batchId: string;
  userId: string;
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'file' | 'image';
  description: string;
  createdAt: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetCount: number;
  currentCount: number;
  type: 'weekly' | 'monthly' | 'custom';
  deadline?: number;
  createdAt: number;
  completed: boolean;
}

export interface Certificate {
  id: string;
  batchId: string;
  batchName: string;
  userId: string;
  userName: string;
  genre: string;
  issuedAt: number;
  completedAt: number;
}

export interface Terminology {
  main: string;
  subject: string;
  chapter: string;
  lecture: string;
  subjectPlural: string;
  chapterPlural: string;
  lecturePlural: string;
}

export function getTerminology(genre?: string): Terminology {
  switch (genre) {
    case 'skill':
      return {
        main: 'Course',
        subject: 'Module',
        chapter: 'Lesson',
        lecture: 'Step',
        subjectPlural: 'Modules',
        chapterPlural: 'Lessons',
        lecturePlural: 'Steps',
      };
    case 'creative':
      return {
        main: 'Project',
        subject: 'Phase',
        chapter: 'Task',
        lecture: 'Step',
        subjectPlural: 'Phases',
        chapterPlural: 'Tasks',
        lecturePlural: 'Steps',
      };
    case 'study':
    default:
      return {
        main: 'Batch',
        subject: 'Subject',
        chapter: 'Chapter',
        lecture: 'Lecture',
        subjectPlural: 'Subjects',
        chapterPlural: 'Chapters',
        lecturePlural: 'Lectures',
      };
  }
}


