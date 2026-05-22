
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Lecture, Chapter, Subject, Slot, Batch, ModalConfig, StudySession, LibraryResource, getTerminology } from './types';
import { PlusIcon, TrashIcon, ChevronLeftIcon, SparklesIcon, EditIcon, BatchWiseLogo, OldBatchWiseLogo, RedditIcon, ShareIcon, GoogleIcon, BookOpenIcon, MaximizeIcon, SettingsIcon, CalendarIcon, ArrowUpIcon, ArrowDownIcon, FileTextIcon, MoonIcon, SunIcon, SearchIcon, YoutubeIcon, XIcon } from './components/Icons';
import BatchSettingsModal from './components/BatchSettingsModal';
import ManageLibraryModal from './components/ManageLibraryModal';
import SearchYoutubeModal from './components/SearchYoutubeModal';
import AnnouncementHistoryModal from './components/AnnouncementHistoryModal';
import AdminPage from './components/AdminPage';
import MarketplaceView from './components/MarketplaceView';
import ShareSettingsModal from './components/ShareSettingsModal';
import StudioView from './components/StudioView';
import LectureView from './components/LectureView';
import LoginView from './components/LoginView';
import BatchLandingView from './components/BatchLandingView';
import AccessRequestsView from './components/AccessRequestsView';
import NotificationsView from './components/NotificationsView';
import YoutubeImportView from './components/YoutubeImportView';
import SubjectDetailView from './components/SubjectDetailView';
import BatchAdminView from './components/BatchAdminView';
import InstructorConsoleView from './components/InstructorConsoleView';
import InformationModal from './components/InformationModal';
import ScheduleCalendarView, { autoScheduleBatch } from './components/ScheduleCalendarView';
import { queryGroq, reRenderMathJax, executeGlobalAICommand } from './services/groqService';
import SupportSamosa from './components/SupportSamosa';
import PublicLandingView from './components/PublicLandingView';
import { OneTapResume, StudyHeatmap } from './components/MomentumNexus';
import GoalDashboard from './components/GoalDashboard';
import CertificateView from './components/CertificateView';

import { suggestLectures } from './services/geminiService';
import { fetchPlaylistVideos, fetchVideoDescription } from './services/youtubeService';
import { auth } from './services/firebase';
import { subscribeToBatches, migrateFromLocalStorage, syncBatchesToFirestore, saveBatch, deleteBatch, SyncStatus, subscribeToLibraryResources, initializeLibrary, subscribeToAnnouncement, getAnnouncementHistory, updateAnnouncement, performAtomicSync, checkIsAdmin, getAdmins, getBatches, shareBatchWithCode, getBatchByInviteCode, saveLibraryResource, deleteLibraryResource, subscribeToMarketplaceBatches, updateBatchSharing, generateInviteCode, subscribeToNotifications, subscribeToMyApprovedRequests, sendBatchNotification, subscribeToBatchNotifications, updateAccessRequestStatus, subscribeToBatchMembers, subscribeToBatchStats, revokeBatchAccess, syncMemberStats, bulkSaveLibraryResources } from './services/firestoreService';
import { getFCMToken, onMessageListener, getNotificationPermission } from './services/notificationService';
import { calculateStreak, shouldRemindInactivity } from './services/streakService';
import { logActivity } from './services/firestoreService';
import { useLocation, useNavigate } from 'react-router-dom';




const getTodayDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const getDirectDriveUrl = (url?: string) => {
  if (!url) return undefined;
  const trimmedUrl = url.trim();
  const driveMatch = trimmedUrl.match(/\/(?:file\/d\/|open\?id=)([^/?]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmedUrl;
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<Batch[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BATCHES);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [createBatchGenre, setCreateBatchGenre] = useState<'study' | 'creative' | 'skill'>('skill');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<{ [key: string]: boolean }>({});
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [maximizedLectureId, setMaximizedLectureId] = useState<string | null>(null);
  const [editingSettingsBatchId, setEditingSettingsBatchId] = useState<string | null>(null);
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>([]);
  const [isManageLibraryOpen, setIsManageLibraryOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState<string>('Welcome to BatchWise! Your ultimate skill learning companion.');
  const [announcementTitle, setAnnouncementTitle] = useState<string>('Welcome'); // Added state for title
  const [announcementTimestamp, setAnnouncementTimestamp] = useState<string | undefined>();
  const [isAnnouncementHistoryOpen, setIsAnnouncementHistoryOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [inAppNotification, setInAppNotification] = useState<{ title: string; body: string } | null>(null);
  const [lectureSortOrder, setLectureSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSearchYoutubeOpen, setIsSearchYoutubeOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [marketplaceBatches, setMarketplaceBatches] = useState<Batch[]>([]);
  const [selectedMarketplaceBatch, setSelectedMarketplaceBatch] = useState<Batch | null>(null);
  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  const [showTodayTarget, setShowTodayTarget] = useState<boolean>(() => {
    return localStorage.getItem('showTodayTarget') !== 'false';
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [batchNotifications, setBatchNotifications] = useState<any[]>([]);
  const [isAINexusOpen, setIsAINexusOpen] = useState(false);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [aiCommand, setAiCommand] = useState('');
  const [nexusReasoning, setNexusReasoning] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const [isDynamicAdmin, setIsDynamicAdmin] = useState<boolean>(false);
  const [isFooterHidden, setIsFooterHidden] = useState(false);
  const [isSupportSamosaOpen, setIsSupportSamosaOpen] = useState(false);
  const [certificateTargetBatchId, setCertificateTargetBatchId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'night'>(() => {
    return 'night';
  });

  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'night');
    document.documentElement.classList.add('night');
    localStorage.setItem('apple_theme', 'night');
  }, []);

  // Handle unread notifications logic
  useEffect(() => {
    const combined = [...notifications, ...batchNotifications];
    if (combined.length === 0) {
        setHasUnreadNotifications(false);
        return;
    }
    
    const lastRead = Number(localStorage.getItem('last_read_notif') || 0);
    const newest = Math.max(...combined.map(n => n.createdAt || 0));
    
    if (newest > lastRead) {
      setHasUnreadNotifications(true);
    } else {
      setHasUnreadNotifications(false);
    }
  }, [notifications, batchNotifications]);

  const toggleTheme = () => {};

  const requestNotifications = async () => {
    if (!user || isGuest) return;
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const token = await getFCMToken(user.uid);
        if (token) {
          alert("Push notifications enabled strictly for intel synchronisation!");
        }
      } else {
        alert("Push notifications were disabled. You can still use the app normally.");
      }
    } catch (e) {
      console.error("Failed to request notification permission:", e);
    }
  };

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = getTodayDate();

      const lastDailyNotif = localStorage.getItem('last_daily_notification');
      const lastInactivityNotif = localStorage.getItem('last_inactivity_notification');

      data.forEach(batch => {
        // 1. Scheduled Daily Reminder
        if (batch.settings?.notificationTime === currentHM && lastDailyNotif !== today) {
          if (window.Notification && Notification.permission === 'granted') {
            new Notification(`BatchWise Briefing: ${batch.name}`, {
              body: "Initialize your daily curriculum roadmap. Synchronization complete.",
              icon: '/favicon.png'
            });
            localStorage.setItem('last_daily_notification', today);
          }
        }

        // 2. 24h Inactivity Reminder
        if (shouldRemindInactivity(batch.sessions) && lastInactivityNotif !== today) {
            if (window.Notification && Notification.permission === 'granted') {
                new Notification(`Stay on Track: ${batch.name}`, {
                    body: "It's been 24 hours since your last session. Don't let your streak break!",
                    icon: '/favicon.png',
                    tag: 'inactivity-reminder'
                });
                localStorage.setItem('last_inactivity_notification', today);
                
                // Also add to in-app notification if they are currently using it
                setInAppNotification({
                    title: '🔔 Continuity Alert',
                    body: `It's been 24h since your last ${batch.name} session. Study now to keep your streak!`
                });
            }
        }
      });
    };

    const interval = setInterval(checkNotifications, 45000);
    return () => clearInterval(interval);
  }, [data]);

  const location = useLocation();
  const navigate = useNavigate();

  // Sync state with URL on load and path change
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/library-admin')) {
      if (viewMode !== ViewMode.ADMIN) setViewMode(ViewMode.ADMIN);
    } else if (path.startsWith('/batch/')) {
      const parts = path.split('/');
      // /batch/:batchId
      if (parts.length >= 3) {
        const bId = parts[2];
        if (activeBatchId !== bId) setActiveBatchId(bId);

        // /batch/:batchId/admin
        if (parts.length >= 4 && parts[3] === 'admin') {
          if (viewMode !== ViewMode.BATCH_ADMIN) setViewMode(ViewMode.BATCH_ADMIN);
        }
        // /batch/:batchId/subject/:subjectId
        else if (parts.length >= 5 && parts[3] === 'subject') {
          const sId = parts[4];
          if (activeSubjectId !== sId) setActiveSubjectId(sId);

          // /batch/:batchId/subject/:subjectId/chapter/:chapterId
          if (parts.length >= 7 && parts[5] === 'chapter') {
            const cId = parts[6];
            if (activeChapterId !== cId) setActiveChapterId(cId);
            if (viewMode !== ViewMode.LECTURES) setViewMode(ViewMode.LECTURES);

            // Handle Deep Link
            const params = new URLSearchParams(location.search);
            const lid = params.get('lectureId');
            if (lid && activeLectureId !== lid) {
              setActiveLectureId(lid);
              // Auto-scroll to lecture on load
              setTimeout(() => {
                const el = document.getElementById(`lecture-${lid}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 500);
            }
          } else {
            if (viewMode !== ViewMode.CHAPTERS) setViewMode(ViewMode.CHAPTERS);
          }
        } else {
          if (viewMode !== ViewMode.SUBJECTS) setViewMode(ViewMode.SUBJECTS);
        }
      }
    } else if (path.startsWith('/instructor')) {
      if (viewMode !== ViewMode.INSTRUCTOR_CONSOLE) setViewMode(ViewMode.INSTRUCTOR_CONSOLE);
    } else if (path.startsWith('/studio/')) {
      const parts = path.split('/');
      if (parts.length >= 3) {
        const lId = parts[2];
        if (activeLectureId !== lId) setActiveLectureId(lId);
        if (viewMode !== ViewMode.STUDIO) setViewMode(ViewMode.STUDIO);

        // Pick up context if available
        const params = new URLSearchParams(location.search);
        const bId = params.get('batchId');
        const sId = params.get('subjectId');
        const cId = params.get('chapterId');
        if (bId && activeBatchId !== bId) setActiveBatchId(bId);
        if (sId && activeSubjectId !== sId) setActiveSubjectId(sId);
        if (cId && activeChapterId !== cId) setActiveChapterId(cId);
      }
    } else if (path.startsWith('/lab/')) {
      const parts = path.split('/');
      if (parts.length >= 5) {
        const bId = parts[2];
        const sId = parts[3];
        const cId = parts[4];
        if (activeBatchId !== bId) setActiveBatchId(bId);
        if (activeSubjectId !== sId) setActiveSubjectId(sId);
        if (activeChapterId !== cId) setActiveChapterId(cId);
        if (viewMode !== ViewMode.SEARCH_LAB) setViewMode(ViewMode.SEARCH_LAB);
      }
    } else if (path.startsWith('/library-admin')) {
      if (viewMode !== ViewMode.LIBRARY_ADMIN) setViewMode(ViewMode.LIBRARY_ADMIN);
    } else if (path.startsWith('/settings')) {
      if (viewMode !== ViewMode.SETTINGS) setViewMode(ViewMode.SETTINGS);
    } else if (path === '/marketplace') {
      if (viewMode !== ViewMode.MARKETPLACE) setViewMode(ViewMode.MARKETPLACE);
    } else if (path === '/notifications') {
      if (viewMode !== ViewMode.NOTIFICATIONS) setViewMode(ViewMode.NOTIFICATIONS);
    } else if (path === '/youtube-import' || path === '/import') {
      if (viewMode !== ViewMode.YOUTUBE_IMPORT) setViewMode(ViewMode.YOUTUBE_IMPORT);
      const params = new URLSearchParams(location.search);
      const bId = params.get('batch');
      const sId = params.get('subject');
      const cId = params.get('chapter');
      if (bId && activeBatchId !== bId) setActiveBatchId(bId);
      if (sId && activeSubjectId !== sId) setActiveSubjectId(sId);
      if (cId && activeChapterId !== cId) setActiveChapterId(cId);
    } else if (path === '/access-requests') {
      if (viewMode !== ViewMode.ACCESS_REQUESTS) setViewMode(ViewMode.ACCESS_REQUESTS);
    } else if (path.startsWith('/import/')) {
      const code = path.split('/import/')[1];
      if (code && code.length === 6) {
        // This is handled via the separate effect for shared batch import
      }
    } else if (path === '/' || path === '') {
      // If we were in library/admin and came back to /, reset to batches if not already in a sub-view
      // Fix: Force reset to BATCHES default view effectively
      if (viewMode !== ViewMode.BATCHES) {
        setViewMode(ViewMode.BATCHES);
        setActiveBatchId(null);
        setActiveSubjectId(null);
        setActiveChapterId(null);
        setActiveLectureId(null);
      }
    }
  }, [location.pathname]);

  // Sync URL with state changes
  useEffect(() => {
    if (viewMode === ViewMode.LIBRARY && location.pathname !== '/library') {
      navigate('/library');
    } else if (viewMode === ViewMode.MARKETPLACE && location.pathname !== '/marketplace') {
      navigate('/marketplace');
    } else if (viewMode === ViewMode.ADMIN && location.pathname !== '/admin') {
      navigate('/admin');
    } else if (viewMode === ViewMode.INSTRUCTOR_CONSOLE && location.pathname !== '/instructor') {
      navigate('/instructor');
    } else if (viewMode === ViewMode.BATCH_ADMIN && activeBatchId) {
      const target = `/batch/${activeBatchId}/admin`;
      if (location.pathname !== target) navigate(target);
    } else if (viewMode === ViewMode.LIBRARY_ADMIN && location.pathname !== '/library-admin') {
      navigate('/library-admin');
    } else if (viewMode === ViewMode.YOUTUBE_IMPORT) {
      const target = `/youtube-import?batch=${activeBatchId || ''}&subject=${activeSubjectId || ''}&chapter=${activeChapterId || ''}`;
      if (location.pathname + location.search !== target) navigate(target);
    } else if (viewMode === ViewMode.SUBJECTS && activeBatchId) {
      const target = `/batch/${activeBatchId}`;
      if (location.pathname !== target) navigate(target);
    } else if (viewMode === ViewMode.CHAPTERS && activeBatchId && activeSubjectId) {
      const target = `/batch/${activeBatchId}/subject/${activeSubjectId}`;
      if (location.pathname !== target) navigate(target);
    } else if (viewMode === ViewMode.LECTURES && activeBatchId && activeSubjectId && activeChapterId) {
      const target = `/batch/${activeBatchId}/subject/${activeSubjectId}/chapter/${activeChapterId}`;
      if (location.pathname !== target) navigate(target);
    } else if (viewMode !== ViewMode.LIBRARY && viewMode !== ViewMode.ADMIN && viewMode !== ViewMode.MARKETPLACE && viewMode !== ViewMode.SETTINGS && viewMode !== ViewMode.NOTIFICATIONS && viewMode !== ViewMode.YOUTUBE_IMPORT && viewMode !== ViewMode.ACCESS_REQUESTS && location.pathname !== '/') {
      // Allow specific paths to skip redirect
      const specialPaths = ['/library', '/admin', '/batch', '/marketplace', '/settings', '/notifications', '/youtube-import', '/access-requests'];
      const isSpecial = specialPaths.some(p => location.pathname.startsWith(p));
      if (isSpecial) {
        // Assume valid route, do nothing (let ViewMode sync handle it if needed, or it's a 404 handled by generic fallback)
      } else {
        navigate('/');
      }
    }
  }, [viewMode, activeBatchId, activeSubjectId, activeChapterId]);

  // ADMIN AUTHORIZATION - Update this UID with your own from Firebase Console -> Auth
  const ADMIN_UID = "Rf9trfhDdCWLE4H7IwbvkUUOq652";
  const isAdmin = user?.uid === ADMIN_UID || isDynamicAdmin || (user && !isGuest && user.email === 'yashwinka8@gmail.com'); // Strict check
  
  // Stricter check for batch ownership (distinguish between owner and buyer)
  const isInstructor = isAdmin || (user && !isGuest && data.some(b => 
    b.creatorId === user.uid || 
    (!b.creatorId && !b.id.includes('imported') && !b.id.includes('shared') && !b.id.includes('joined'))
  ));

  // Dynamic Admin Check
  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.email && !isGuest) {
        try {
          const isDynamic = await checkIsAdmin(user.email);
          setIsDynamicAdmin(isDynamic);
        } catch (error) {
          console.error("Failed dynamic admin check:", error);
          setIsDynamicAdmin(false);
        }
      } else {
        setIsDynamicAdmin(false);
      }
    };
    checkAdmin();
  }, [user, isGuest]);

  // Initialize and subscribe to global library
  useEffect(() => {
    const seeds: LibraryResource[] = [
      { id: 'lib_ai_tools', title: "Ultimate AI Tools Guide", color: "bg-violet-600", tagColor: "bg-yellow-400", status: "Open Resource", href: "https://github.com/", order: 1 },
      { id: 'lib_video_edit', title: "Video Editing Masterclass", color: "bg-red-600", tagColor: "bg-orange-400", status: "Watch Playlist", href: "https://www.youtube.com/", order: 2 },
      { id: 'lib_chatgpt', title: "ChatGPT Prompt Library", color: "bg-emerald-600", tagColor: "bg-green-400", status: "Open Collection", href: "https://github.com/", order: 3 },
      { id: 'lib_davinci', title: "DaVinci Resolve Shortcuts", color: "bg-sky-600", tagColor: "bg-blue-400", status: "Cheat Sheet", order: 4 },
      { id: 'lib_midjourney', title: "AI Art Prompt Vault", color: "bg-purple-700", tagColor: "bg-pink-400", reserved: true, order: 5 },
      { id: 'lib_figma', title: "UI/Design Templates", color: "bg-orange-600", tagColor: "bg-amber-400", reserved: true, order: 6 },
      { id: 'lib_learn', title: "Learning Roadmaps", color: "bg-blue-700", tagColor: "bg-indigo-400", reserved: true, order: 7 },
      { id: 'lib_strategy', title: "Skill Strategy", color: "bg-green-700", tagColor: "bg-lime-300", reserved: true, order: 9 }
    ];

    initializeLibrary(seeds);
    const unsubscribeLibrary = subscribeToLibraryResources((resources) => {
      setLibraryResources(resources);
    });

    const unsubscribeAnnouncement = subscribeToAnnouncement((text, updatedAt, title) => {
      setAnnouncementText(text);
      if (title) setAnnouncementTitle(title);
      setAnnouncementTimestamp(updatedAt);

      if (text && text !== 'Welcome to BatchWise! Your ultimate skill learning companion.' && updatedAt) {
        const lastSeen = localStorage.getItem('lastAnnouncementTime');
        // If we have a timestamp and it's different from the last one we saw
        if (updatedAt !== lastSeen) {
          localStorage.setItem('lastAnnouncementTime', updatedAt);

          // Only notify if we have firmly established a "last seen" (i.e., not a fresh install/first load)
          // OR if the user is already on the page and it changes in real-time.
          // Since this callback fires on snapshot, it fires on init.
          // To avoid notify on init, we rely on lastSeen being present.
          if (lastSeen) {
            setInAppNotification({ title: 'New Announcement', body: text });

            if (Notification.permission === 'granted') {
              try {
                new Notification('BatchWise Update', {
                  body: text,
                  icon: '/icon-192.png'
                });
              } catch (e) {
                console.error('System notification failed', e);
              }
            }
          }
        }
      }
    });

    const unsubscribeNotifications = subscribeToNotifications((list) => {
      // Filter list to only include global notifications OR targeted to current user
      const filteredList = list.filter(n => !n.recipientId || (user && n.recipientId === user.uid));

      setNotifications(prev => {
        if (filteredList.length > 0) {
          const newest = filteredList[0];
          const prevNewest = prev.length > 0 ? prev[0] : null;
          
          if (newest.id !== prevNewest?.id) {
            const createdTime = newest.createdAt ? new Date(newest.createdAt).getTime() : 0;
            const now = Date.now();
            
            if (now - createdTime < 30000) {
              setInAppNotification({ 
                title: newest.title || 'New Briefing', 
                body: newest.body || newest.text || 'You have a new mission update.' 
              });

              if (Notification.permission === 'granted') {
                new Notification(newest.title || 'BatchWise Briefing', {
                  body: newest.body || newest.text || 'New update received.',
                  icon: '/icon-192.png'
                });
              }
            }
          }
        }
        return filteredList;
      });
    });

    const unsubscribeMarketplace = subscribeToMarketplaceBatches((list) => {
      setMarketplaceBatches(list);
    });

    return () => {
      unsubscribeLibrary();
      unsubscribeAnnouncement();
      unsubscribeNotifications();
      unsubscribeMarketplace();
    };
  }, []);

  // Initialize push notifications for authenticated users
  useEffect(() => {
    if (user && !isGuest) {
      const setupNotifications = async () => {
        try {
          const permission = await getNotificationPermission();
          setNotificationPermission(permission);

          if (permission === 'granted') {
            await getFCMToken(user.uid);
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      };

      setupNotifications();

      const unsubscribeOnMessage = onMessageListener((payload) => {
        console.log('Received foreground message:', payload);
        if (payload.notification) {
          setInAppNotification({
            title: payload.notification.title || '📢 New Announcement',
            body: payload.notification.body || ''
          });
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setInAppNotification(null);
          }, 5000);
        }
      });

      return () => {
        unsubscribeOnMessage();
      };
    }
  }, [user, isGuest]);

  // Sync user progress to the batch owner dashboard periodically
  useEffect(() => {
    if (user && !isGuest && !authLoading && data.length > 0) {
      const syncTimeout = setTimeout(() => {
        data.filter(b => b.inviteCode).forEach(batch => {
          const totalLectures = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.length, 0), 0);
          const doneLectures = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.filter(l => l.completed).length, 0), 0);
          const totalStudyTime = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.reduce((lAcc, l) => lAcc + (l.studyTime || 0), 0), 0), 0);
          const overallPerc = totalLectures === 0 ? 0 : Math.round((doneLectures / totalLectures) * 100);
          
          syncMemberStats(batch.inviteCode!, user.uid, {
            userName: user.displayName || 'Student',
            userEmail: user.email || '',
            progress: overallPerc,
            completedCount: doneLectures,
            totalCount: totalLectures,
            totalStudyTime: totalStudyTime,
            ownerId: batch.creatorId || 'admin'
          });
        });
      }, 5000); // 5s delay after data changes to avoid spamming
      return () => clearTimeout(syncTimeout);
    }
  }, [data, user, isGuest, authLoading]);

  // Handle batch-specific notifications
  useEffect(() => {
    if (user && !isGuest && data.length > 0) {
      const inviteCodes = data.map(b => b.inviteCode).filter(Boolean) as string[];
      if (inviteCodes.length === 0) return;

      const unsubscribe = subscribeToBatchNotifications(inviteCodes, (list) => {
        setBatchNotifications(prev => {
          if (list.length > 0) {
            const newest = list[0];
            // Check if this specific notification is "new" to the session's memory
            const alreadyNotified = prev.some(p => p.id === newest.id);
            
            if (!alreadyNotified) {
              const createdTime = newest.createdAt || 0;
              const now = Date.now();
              
              if (now - createdTime < 60000) { // 1 minute window
                  const batch = data.find(b => b.inviteCode === newest.batchId);
                  setInAppNotification({
                      title: batch ? `📢 Broadcast: ${batch.name}` : '📢 New Broadcast',
                      body: newest.body || newest.title
                  });
              }
            }
          }
          return list;
        });
      });
      return () => unsubscribe();
    }
  }, [user, isGuest, data]);

  const handleBroadcastNotification = async (batchId: string, title: string, body: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await sendBatchNotification(batchId, title, body, user.uid);
      alert("Broadcast successful! Your students will receive this update.");
    } catch (e) {
      console.error(e);
      alert("Failed to send broadcast.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (batchId: string, settings: any, theme?: any, inviteCode?: string) => {
    const batch = data.find(b => b.id === batchId);
    if (!batch) return;

    const updatedBatch: Batch = {
      ...batch,
      settings,
      theme,
      inviteCode,
      isDirty: true,
      // Map marketplace fields from settings
      isPublic: settings.isPublic,
      category: settings.category,
      difficulty: settings.difficulty,
      description: settings.description,
      creatorName: user?.displayName || 'Legacy Creator',
      creatorAvatar: user?.photoURL || ''
    };

    setData(prev => prev.map(b => b.id === batchId ? updatedBatch : b));
    setEditingSettingsBatchId(null);

    if (user && !isGuest) {
      try {
        await updateBatchSharing(user.uid, updatedBatch);
      } catch (e) {
        console.error("Global cluster sync failed:", e);
      }
    }
  };

  const isInitialLoad = useRef(true);
  const lastSyncedDataRef = useRef<string>('');
  const prevDataRef = useRef<Batch[]>([]);
  const firestoreUnsubscribe = useRef<(() => void) | null>(null);

  // Authentication state listener
  useEffect(() => {
    // 1. Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('batchwise_guest_session');
        // Log user activity for DAU/MAU tracking
        logActivity(currentUser.uid).catch(() => {});
      }
      setAuthLoading(false);
    });

    // 2. Handle potential redirect result (especially important for mobile compat)
    const checkRedirect = async () => {
      try {
        const result = await auth.getRedirectResult();
        if (result && result.user) {
          console.log("Successfully logged in via redirect:", (result.user as any).email);
        }
      } catch (error: any) {
        console.error("Redirect Login Error:", error);
        if (error.code !== 'auth/no-current-user') {
          alert(`Login Redirect failed: ${error.message}`);
        }
      }
    };
    checkRedirect();

    const guestSession = localStorage.getItem('batchwise_guest_session');
    if (guestSession === 'true') {
      setIsGuest(true);
    }

    return () => unsubscribe();
  }, []);

  const getStorageKey = () => user ? `batchwise_jee_v4_${user.uid}` : 'batchwise_jee_v4_guest';

  // Firestore sync for authenticated users
  useEffect(() => {
    if (!authLoading && user && !isGuest) {
      setSyncStatus('syncing');

      // Get localStorage data for potential migration
      const localStorageKey = getStorageKey();
      const savedData = localStorage.getItem(localStorageKey);
      let localBatches: Batch[] = [];

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed)) localBatches = parsed;
        } catch (e) {
          console.error("Failed to parse local data", e);
        }
      }

      // 4. One-time sync from Firestore on entrance
      const fetchInitialData = async () => {
        try {
          const serverBatches = await getBatches(user.uid);
          setData(currentLocalBatches => {
            // Initial load or empty state
            if (currentLocalBatches.length === 0) {
              lastSyncedDataRef.current = JSON.stringify(serverBatches);
              return serverBatches;
            }

            // Merge Logic: Keep local dirty batches, accept server updates for clean batches
            const mergedBatches = [...serverBatches];
            currentLocalBatches.forEach(localBatch => {
              if (localBatch.isDirty) {
                const idx = mergedBatches.findIndex(b => b.id === localBatch.id);
                if (idx !== -1) {
                  mergedBatches[idx] = localBatch;
                } else {
                  mergedBatches.push(localBatch);
                }
              }
            });

            lastSyncedDataRef.current = JSON.stringify(serverBatches);
            mergedBatches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            return mergedBatches;
          });

          setSyncStatus('synced');
          setLastSyncTime(new Date().toISOString());
        } catch (error) {
          console.error('Firestore initial fetch error:', error);
          setSyncStatus('error');
        } finally {
          isInitialLoad.current = false;
        }
      };

      fetchInitialData();

      // Migration happens in parallel and won't block the initial fetch
      migrateFromLocalStorage(user.uid, localBatches)
        .catch((error) => console.error('Migration error:', error));

      // Safety: If after 3 seconds we haven't received anything, assume it's a new/empty user
      // Increased to 3s for better reliability on slow connections
      const safetyTimeout = setTimeout(() => {
        if (isInitialLoad.current) {
          console.log("No data received from Firestore, enabling sync for new user");
          isInitialLoad.current = false;
          setSyncStatus('synced');
        }
      }, 3000);

      return () => {
        clearTimeout(safetyTimeout);
        if (firestoreUnsubscribe.current) {
          firestoreUnsubscribe.current();
          firestoreUnsubscribe.current = null;
        }
      };
    }
  }, [user, isGuest, authLoading]);

  // Listen for newly approved access requests
  useEffect(() => {
    if (user && !isGuest && !authLoading) {
      const unsubscribe = subscribeToMyApprovedRequests(user.uid, async (requests) => {
        if (requests.length === 0) return;
        
        for (const req of requests) {
          try {
            console.log(`Processing approved request for batch: ${req.batchId}`);
            // Import the batch
            const batchDoc = await getBatchByInviteCode(req.batchId);
            if (batchDoc) {
              const newBatch = { 
                ...batchDoc, 
                // Ensure inviteCode is explicitly set so duplicate check works
                inviteCode: req.batchId,
                id: `b_imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
                isDirty: true,
                createdAt: Date.now() 
              };
              
              setData(prev => {
                // More robust check: check for matching inviteCode OR matching name+creator
                const alreadyHas = prev.some(b => 
                  (b.inviteCode && b.inviteCode === newBatch.inviteCode) || 
                  (b.name === newBatch.name && b.creatorId === newBatch.creatorId)
                );
                
                if (alreadyHas) {
                  console.log(`Batch ${newBatch.name} already in dashboard, skipping auto-import.`);
                  return prev;
                }
                
                return [...prev, newBatch];
              });

              // Save to Firestore for persistency across devices
              await saveBatch(user.uid, newBatch);

              // Mark request as fulfilled and save to local storage immediately
              await updateAccessRequestStatus(req.id, 'fulfilled' as any);
              
              setInAppNotification({
                title: '✅ Access Granted!',
                body: `${batchDoc.name} has been added to your dashboard.`
              });
            }
          } catch (e) {
            console.error("Error importing approved batch", e);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user, isGuest, authLoading]);


  // Handle shared batch import and guest mode localStorage
  useEffect(() => {
    if (!authLoading) {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        try {
          const encodedData = hash.replace('#share=', '');
          const decodedStr = decodeURIComponent(escape(atob(encodedData)));
          const sharedBatch = JSON.parse(decodedStr);
          if (sharedBatch && sharedBatch.name) {
            setModal({
              type: 'confirm',
              title: 'Import Shared Batch?',
              message: `Someone shared the batch "${sharedBatch.name}" with you. Would you like to add it to your portal?`,
              confirmLabel: 'Import Now',
              onConfirm: () => {
                const newBatch = { ...sharedBatch, id: `b_shared_${Date.now()}`, isDirty: true };
                setData(prev => [...prev, newBatch]);
                setModal(null);
                window.location.hash = '';
              }
            });
          }
        } catch (e) {
          console.error("Failed to decode shared batch", e);
          alert("The shared link is invalid or has expired.");
        }
      }

      const path = location.pathname;
      if (path.startsWith('/import/')) {
        const code = path.split('/import/')[1];
        if (code && code.length === 6) {
          handleImportBatchByCode(code);
        }
      }


      // Load from localStorage for guest users only
      if (isGuest && !user) {
        const savedData = localStorage.getItem(getStorageKey());
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) setData(parsed);
          } catch (e) {
            console.error("Failed to parse local data", e);
          }
        }
        isInitialLoad.current = false;
      }
    }
  }, [user, isGuest, authLoading]);

  // Save data persistence (Local Storage for all, Firestore for authenticated users)
  useEffect(() => {
    // 1. Skip if it's the initial load (still waiting for Firestore/LocalStorage)
    if (isInitialLoad.current) {
      prevDataRef.current = data;
      return;
    }

    const currentDataJson = JSON.stringify(data);
    const storageKey = getStorageKey();

    // 2. Always save to LocalStorage for offline speed and guest persistence
    localStorage.setItem(storageKey, currentDataJson);

    // 3. Skip Firestore sync if current local state is identical to what we last received/sent to server
    // CRITICAL: Strip 'isDirty' flag from local data before comparison to avoid unnecessary writes
    const cleanCurrentData = data.map(({ isDirty, ...rest }) => rest);
    const cleanCurrentJson = JSON.stringify(cleanCurrentData);

    // Update prevDataRef to track local state changes for manual sync detection
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (user && !isGuest && cleanCurrentJson !== lastSyncedDataRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Sync now to save to cloud?';
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    const checkDirty = () => {
      if (user && !isGuest && cleanCurrentJson !== lastSyncedDataRef.current) {
        if (syncStatus === 'synced') setSyncStatus('offline'); // Use 'offline' or a custom 'dirty' state to indicate pending sync
      } else if (syncStatus === 'offline' && cleanCurrentJson === lastSyncedDataRef.current) {
        setSyncStatus('synced');
      }
    };

    checkDirty();
    prevDataRef.current = data;

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [data, user, isGuest]);

  // AUTO-SYNC HOOK: Automatically trigger sync after 2 seconds of inactivity
  useEffect(() => {
    if (user && !isGuest && syncStatus === 'offline') {
      const autoSyncTimer = setTimeout(() => {
        console.log("[Sync] Auto-sync triggered...");
        handleManualSync();
      }, 2000); // 2 second debounce

      return () => clearTimeout(autoSyncTimer);
    }
  }, [syncStatus, user, isGuest]);

  const handleManualSync = async () => {
    if (!user || isGuest || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    try {
      const cleanData = data.map(({ isDirty, ...rest }) => rest);
      const cleanJson = JSON.stringify(cleanData);

      // Identify changes and deletions
      const changedBatches = data.filter(batch => batch.isDirty);

      const deletedBatchIds = JSON.parse(lastSyncedDataRef.current || '[]')
        .filter((prevBatch: any) => !data.some(batch => batch.id === prevBatch.id))
        .map((b: any) => b.id);

      if (changedBatches.length > 0 || deletedBatchIds.length > 0) {
        await performAtomicSync(user.uid, changedBatches, deletedBatchIds);

        // Clear dirty flags locally
        setData(current => current.map(b => {
          if (b.isDirty) {
            const { isDirty, ...rest } = b;
            return rest as Batch;
          }
          return b;
        }));

        lastSyncedDataRef.current = cleanJson;
        setLastSyncTime(new Date().toISOString());
        setSyncStatus('synced');
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error("Manual sync failed", err);
      setSyncStatus('error');
    }
  };

  // Real-time study session tracking
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if ((viewMode === ViewMode.LECTURES || viewMode === ViewMode.STUDIO) && activeLectureId && !modal) {
      if (!sessionStartTimeRef.current) sessionStartTimeRef.current = Date.now();

      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionSeconds > 0) {
        flushSessionTime();
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        // Do NOT nullify sessionStartTimeRef here, let the next effect cycle or flush handle it
      }
    };
  }, [viewMode, activeLectureId, modal]);

  // Periodic flush to persist study time (every 2 minutes for better safety)
  useEffect(() => {
    if (sessionSeconds >= 120) {
      flushSessionTime();
    }
  }, [sessionSeconds]);

  const activeBatchIdRef = useRef<string | null>(null);
  const activeSubjectIdRef = useRef<string | null>(null);
  const activeChapterIdRef = useRef<string | null>(null);
  const activeLectureIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeBatchIdRef.current = activeBatchId;
    activeSubjectIdRef.current = activeSubjectId;
    activeChapterIdRef.current = activeChapterId;
    activeLectureIdRef.current = activeLectureId;
  }, [activeBatchId, activeSubjectId, activeChapterId, activeLectureId]);

  const flushSessionTime = () => {
    const bId = activeBatchIdRef.current;
    const sId = activeSubjectIdRef.current;
    const cId = activeChapterIdRef.current;
    const lId = activeLectureIdRef.current;

    if (!lId || sessionSeconds === 0 || !bId) {
      sessionStartTimeRef.current = null;
      setSessionSeconds(0);
      return;
    }

    setData(prev => prev.map(batch =>
      batch.id === bId
        ? {
          ...batch,
          isDirty: true,
          sessions: [...(batch.sessions || []), {
            id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lectureId: lId,
            lectureTitle: batch.subjects.find(s => s.id === sId)?.chapters.find(c => c.id === cId)?.lectures.find(l => l.id === lId)?.title || 'Unknown Session',
            subjectName: batch.subjects.find(s => s.id === sId)?.name || 'Unknown',
            duration: sessionSeconds,
            timestamp: Date.now()
          }],
          subjects: batch.subjects.map(subject =>
            subject.id === sId ? {
              ...subject,
              chapters: subject.chapters.map(chapter =>
                chapter.id === cId ? {
                  ...chapter,
                  lectures: chapter.lectures.map(l =>
                    l.id === lId
                      ? { ...l, studyTime: (l.studyTime || 0) + sessionSeconds }
                      : l
                  )
                } : chapter
              )
            } : subject
          )
        }
        : batch
    ));

    sessionStartTimeRef.current = null;
    setSessionSeconds(0);
  };

  const handleGlobalAICommand = async () => {
    if (!aiCommand.trim()) return;
    setIsExecutingCommand(true);
    setNexusReasoning(null);
    setAiResponse(null);
    try {
      const result = await executeGlobalAICommand(aiCommand, data);
      setNexusReasoning(result.reasoning);
      if (result.response) setAiResponse(result.response);
      
      // Apply Mutations
      let updatedData = [...data];
      result.mutations.forEach((mut: any) => {
        switch (mut.type) {
          case 'ADD_SUBJECT':
            updatedData = updatedData.map(b => b.id === mut.batchId ? {
              ...b,
              isDirty: true,
              subjects: [...b.subjects, { id: 's-' + Date.now(), name: mut.name, chapters: [] }]
            } : b);
            break;
          case 'RENAME_BATCH':
            updatedData = updatedData.map(b => b.id === mut.batchId ? { ...b, name: mut.newName, isDirty: true } : b);
            break;
          case 'DELETE_BATCH':
            updatedData = updatedData.filter(b => b.id !== mut.batchId);
            break;
          case 'SET_GOAL':
            updatedData = updatedData.map(b => b.id === mut.batchId ? { ...b, settings: { ...b.settings, goal: mut.goal }, isDirty: true } : b);
            break;
        }
      });
      
      setData(updatedData);
      setAiCommand('');
      setTimeout(() => setNexusReasoning(null), 5000);
    } catch (e: any) {
      alert("Command Failed: " + e.message);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const activeBatch = data.find(b => b.id === activeBatchId);
  const activeSubject = activeBatch?.subjects.find(s => s.id === activeSubjectId);
  const activeChapter = activeSubject?.chapters.find(c => c.id === activeChapterId);
  const terms = getTerminology(activeBatch?.genre);

  const getSubjectEmoji = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('physics')) return '⚛️ ';
    if (lowerName.includes('chemistry')) return '🧪 ';
    if (lowerName.includes('math') || lowerName.includes('mathematic')) return '📐 ';
    if (lowerName.includes('biology')) return '🧬 ';
    return '📘 ';
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Use Redirect for mobile devices or smaller screens for better compatibility
      // Also helps with "popup blocked" issues on standard browsers
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        await auth.signInWithRedirect();
        // Redirect happens effectively here, page reloads
      } else {
        await auth.signInWithPopup();
      }
    } catch (error) {
      console.error("Login failed", error);
      const errorMessage = (error as any).message || "Google login encountered an issue.";

      // Fallback: If popup fails (e.g. cross-origin isolation or popup blocker), try redirect
      if (!errorMessage.includes("redirect")) {
        const confirmRedirect = confirm(`Popup Login Failed: ${errorMessage}\n\nRetry using Redirect method? (Recommended for mobile/network issues)`);
        if (confirmRedirect) {
          try {
            await auth.signInWithRedirect();
            return;
          } catch (redirectError) {
            console.error("Redirect login also failed", redirectError);
          }
        }
      }

      alert(`Login Failed: ${errorMessage}\n\nTroubleshooting steps:\n1. Ensure "batchwise.quasaar.in" is added to "Authorized domains" in Firebase Console -> Authentication -> Settings.\n2. Check if you are using the correct Base URL in your deployment.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    localStorage.setItem('batchwise_guest_session', 'true');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsGuest(false);
      localStorage.removeItem('batchwise_guest_session');
      setViewMode(ViewMode.BATCHES);
      setActiveBatchId(null);
      setActiveSubjectId(null);
      setActiveChapterId(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    try {
      const trimmedUrl = url.trim();
      let videoId: string | null = null;
      if (trimmedUrl.includes('youtu.be/')) {
        const parts = trimmedUrl.split('youtu.be/');
        if (parts[1]) videoId = parts[1].split(/[?#&]/)[0];
      } else if (trimmedUrl.includes('/shorts/')) {
        const parts = trimmedUrl.split('/shorts/');
        if (parts[1]) videoId = parts[1].split(/[?#&]/)[0];
      } else if (trimmedUrl.includes('/live/')) {
        const parts = trimmedUrl.split('/live/');
        if (parts[1]) videoId = parts[1].split(/[?#&]/)[0];
      } else if (trimmedUrl.includes('/embed/')) {
        const parts = trimmedUrl.split('/embed/');
        if (parts[1]) videoId = parts[1].split(/[?#&]/)[0];
      } else if (trimmedUrl.includes('v=')) {
        const parts = trimmedUrl.split('v=');
        if (parts[1]) videoId = parts[1].split(/[?#&]/)[0];
      }
      if (videoId && videoId.length === 11) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1&playsinline=1`;
      }
      const listMatch = trimmedUrl.match(/[?&]list=([^#\&\?]+)/);
      if (listMatch) {
        return `https://www.youtube-nocookie.com/embed/videoseries?list=${listMatch[1]}&rel=0&playsinline=1`;
      }
    } catch (e) { console.error("Embed URL generation failed", e); }
    return '';
  };

  const handleShareBatch = async (e: React.MouseEvent, batch: Batch) => {
    e.stopPropagation();
    const code = batch.inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase();

    setLoading(true);
    try {
      await shareBatchWithCode(code, batch);
      navigator.clipboard.writeText(code);
      alert(`Elite Synchronization Coupon [${code}] generated and copied!`);
    } catch (err) {
      console.error("Cloud sharing failed", err);
      alert("Failed to publish to cloud cluster. Verify network uplink.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportBatchByCode = async (code: string, silent: boolean = false) => {
    setLoading(true);
    try {
      const sharedBatch = await getBatchByInviteCode(code.toUpperCase());
      if (sharedBatch) {
        const importBatch = () => {
          const newBatch = {
            ...sharedBatch,
            id: `b_imported_${Date.now()}`,
            creatorId: user?.uid, 
            sourceCreatorId: sharedBatch.creatorId, 
            sharedAt: new Date().toISOString(),
            isDirty: true,
            createdAt: Date.now()
          };
          setData(prev => [...prev, newBatch]);
          
          // Increment global import count for marketplace stats
          if (sharedBatch.inviteCode) {
              incrementImportCount(sharedBatch.inviteCode).catch(() => {});
          }

          if (!silent) navigate('/');
        };

        if (silent) {
          importBatch();
        } else {
          setModal({
            type: 'confirm',
            title: 'Import Shared Batch?',
            message: `"${sharedBatch.name}" has been shared with you. Would you like to add it to your library?`,
            confirmLabel: 'Import',
            onConfirm: () => {
              importBatch();
              setModal(null);
            }
          });
        }
      } else if (!silent) {
        alert("Invalid invite code. The batch may no longer be available.");
        navigate('/');
      }
    } catch (err) {
      console.error("Import failed", err);
      if (!silent) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBatchWithSource = async (batch: Batch) => {
    if (!batch.inviteCode) return;
    setLoading(true);
    try {
      const source = await getBatchByInviteCode(batch.inviteCode);
      if (!source) {
        alert("Source node unreachable or decommissioned.");
        return;
      }

      // Preserve local progress
      const localProgressMap = new Map<string, boolean>();
      batch.subjects.forEach(s => s.chapters.forEach(c => c.lectures.forEach(l => {
        if (l.completed) localProgressMap.set(l.title, true);
      })));

      // Merge new curriculum with local progress
      const syncedSubjects = source.subjects.map(s => ({
        ...s,
        chapters: s.chapters.map(c => ({
          ...c,
          lectures: c.lectures.map(l => ({
            ...l,
            completed: localProgressMap.has(l.title)
          }))
        }))
      }));

      const updatedBatch = {
        ...batch,
        subjects: syncedSubjects,
        lastSyncedAt: Date.now(),
        isDirty: true
      };

      setData(prev => prev.map(b => b.id === batch.id ? updatedBatch : b));
      alert(`Nexus Synchronized: ${batch.name} is now up to date.`);
    } catch (err) {
      console.error("Sync failed:", err);
      alert("Synchronization protocol breach. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBatch = () => {
    setModal({
      type: 'prompt',
      title: 'Join Study Portal',
      placeholder: 'Enter 6-digit Coupon Code',
      confirmLabel: 'Synchronize',
      onConfirm: async (code) => {
        if (typeof code !== 'string' || !code.trim()) return;
        setLoading(true);
        setModal(null);
        try {
          const sharedBatch = await getBatchByInviteCode(code.toUpperCase().trim());
          if (sharedBatch) {
            // Give it a new local ID to avoid collisions
            const newBatch = {
              ...sharedBatch,
              id: `b_joined_${Date.now()}`,
              isDirty: true,
              createdAt: Date.now()
            };
            setData(prev => [...prev, newBatch]);
            alert(`Portal shared successfully: ${sharedBatch.name}`);
          } else {
            alert("Invalid coupon code or portal has been decommissioned.");
          }
        } catch (err) {
          console.error("Join cluster failed", err);
          alert("Synchronization error. Cluster unreachable.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCreateBatch = () => {
    setCreateBatchGenre('skill');
    setModal({
      type: 'create-batch',
      title: 'Create New Course',
      confirmLabel: 'Create',
      onConfirm: (payload) => {
        const { name, genre } = payload;
        if (typeof name !== 'string' || !name.trim()) return;
        const getTheme = (g: string) => {
          switch (g) {
            case 'creative': return { accentColor: '#FF2D55', gradient: 'linear-gradient(135deg, #FF2D55 0%, #FF9500 100%)', coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop' };
            case 'skill': return { accentColor: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop' };
            default: return { accentColor: '#007AFF', gradient: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop' };
          }
        };
        const theme = getTheme(genre);
        const newBatch: Batch = {
          id: `b_${Date.now()}`,
          name,
          genre,
          subjects: [],
          createdAt: Date.now(),
          isDirty: true,
          creatorId: user?.uid,
          creatorName: user?.displayName || 'Legacy Creator',
          inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          theme
        };
        setData(prev => [...prev, newBatch]);
        isInitialLoad.current = false; // Ensure this change triggers sync
        setModal(null);
      }
    });
  };

  const handleRenameBatch = (batchId: string, currentName: string) => {
    setModal({
      type: 'prompt',
      title: 'Rename Course',
      confirmLabel: 'Update',
      initialValue: currentName,
      onConfirm: (newName) => {
        if (typeof newName !== 'string' || !newName.trim()) return;
        setData(prev => prev.map(b => b.id === batchId ? { ...b, name: newName, isDirty: true } : b));
        setModal(null);
      }
    });
  };

  const handleAddSubject = () => {
    setModal({
      type: 'prompt',
      title: `Add ${terms.subject}`,
      placeholder: `e.g. ${activeBatch?.genre === 'creative' ? 'Graphic Design' : activeBatch?.genre === 'skill' ? 'AI Tools' : 'Physics'}`,
      confirmLabel: 'Add',
      onConfirm: (name) => {
        if (typeof name !== 'string' || !name.trim()) return;
        const emoji = getSubjectEmoji(name);
        const fullName = name.toLowerCase().startsWith(emoji.trim().toLowerCase()) ? name : `${emoji}${name}`;
        setData(prev => prev.map(b => b.id === activeBatchId ? {
          ...b,
          isDirty: true,
          subjects: [...b.subjects, { id: `s_${Date.now()}`, name: fullName, chapters: [] }]
        } : b));
        setModal(null);
      }
    });
  };

  const handleAddChapter = () => {
    setModal({
      type: 'prompt',
      title: `New ${terms.chapter}`,
      placeholder: `e.g. ${activeBatch?.genre === 'creative' ? 'Color Theory' : activeBatch?.genre === 'skill' ? 'Prompt Engineering' : 'Kinematics'}`,
      confirmLabel: 'Create',
      onConfirm: (name) => {
        if (typeof name !== 'string' || !name.trim()) return;
        setData(prev => prev.map(b => b.id === activeBatchId ? {
          ...b,
          isDirty: true,
          subjects: b.subjects.map(s => s.id === activeSubjectId ? {
            ...s,
            chapters: [...s.chapters, { id: `c_${Date.now()}`, name, lectures: [] }]
          } : s)
        } : b));
        setModal(null);
      }
    });
  };
  const handleRenameChapter = (chapterId: string, currentName: string) => {
    setModal({
      type: 'prompt',
      title: 'Rename Chapter',
      confirmLabel: 'Update',
      initialValue: currentName,
      onConfirm: (newName) => {
        if (typeof newName !== 'string' || !newName.trim()) return;
        setData(prev => prev.map(b => b.id === activeBatchId ? {
          ...b,
          isDirty: true,
          subjects: b.subjects.map(s => s.id === activeSubjectId ? {
            ...s,
            chapters: s.chapters.map(c => c.id === chapterId ? { ...c, name: newName } : c)
          } : s)
        } : b));
        setModal(null);
      }
    });
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      if (user && !isGuest) {
        setLoading(true);
        await deleteBatch(user.uid, batchId);
        setData(prev => prev.filter(b => b.id !== batchId));
        if (activeBatchId === batchId) {
            setActiveBatchId(null);
            setViewMode(ViewMode.BATCHES);
            navigate('/');
        }
      } else {
        setData(prev => prev.filter(b => b.id !== batchId));
      }
    } catch (error) {
      console.error("Failed to delete batch:", error);
      alert("Error decommissioning batch node.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      if (!isAdmin) return;
      await deleteLibraryResource(resourceId);
      // Local state is updated via subscription
    } catch (error) {
      console.error("Failed to delete resource:", error);
      alert("Error purging specialized intelligence asset.");
    }
  };

  const handleUpdateBatchContent = async (batchId: string, updates: Partial<Batch>) => {
    setLoading(true);
    try {
      const batch = data.find(b => b.id === batchId);
      if (!batch) return;
      
      const updatedBatch = { ...batch, ...updates, lastModified: Date.now() };
      if (!user) return;
      await updateBatchSharing(user.uid, updatedBatch);
      setData(prev => prev.map(b => b.id === batchId ? updatedBatch : b));
      alert("Nexus Synchronized Successfully!");
    } catch (e) {
      console.error(e);
      alert("Sync Failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBatchSharing = async (updatedBatch: Batch) => {
    if (!user || isGuest) {
      alert("Authentication required for global sharing.");
      return;
    }
    setLoading(true);
    try {
      // 1. Update local state
      setData(prev => prev.map(b => b.id === updatedBatch.id ? { ...updatedBatch, isDirty: false } : b));

      // 2. Update Firestore
      await updateBatchSharing(user.uid, updatedBatch);
      alert("Sharing protocols synchronized across the intelligence network.");
    } catch (error) {
      console.error("Sharing update failed:", error);
      alert("Network protocol error. Failed to sync sharing settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportMarketplaceBatch = (batch: Batch) => {
    setModal({
      type: 'confirm',
      title: 'Import Batch?',
      message: `Add "${batch.name}" to your library?`,
      confirmLabel: 'Import',
      onConfirm: () => {
        const newBatch = {
          ...batch,
          id: `b_marketplace_${Date.now()}`,
          isPublic: false,
          isFeatured: false,
          creatorId: user?.uid,
          isDirty: true,
          createdAt: Date.now()
        };
        setData(prev => [...prev, newBatch]);
        alert(`"${batch.name}" has been added to your library.`);
        setModal(null);
        setViewMode(ViewMode.BATCHES);
        navigate('/');
      }
    });
  };


  const handleRenameSubject = (subjectId: string, currentName: string) => {
    setModal({
      type: 'prompt',
      title: 'Rename Subject Unit',
      confirmLabel: 'Update',
      initialValue: currentName,
      onConfirm: (newName) => {
        if (typeof newName !== 'string' || !newName.trim()) return;
        setData(prev => prev.map(b => b.id === activeBatchId ? {
          ...b,
          isDirty: true,
          subjects: b.subjects.map(s => s.id === subjectId ? { ...s, name: newName } : s)
        } : b));
        setModal(null);
      }
    });
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!window.confirm("Destroy this module and all nested sessions?")) return;
    setData(prev => prev.map(b => b.id === activeBatchId ? {
      ...b,
      isDirty: true,
      subjects: b.subjects.map(s => s.id === activeSubjectId ? {
        ...s,
        chapters: s.chapters.filter(c => c.id !== chapterId)
      } : s)
    } : b));
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (!window.confirm("Destroy this entire subject domain?")) return;
    setData(prev => prev.map(b => b.id === activeBatchId ? {
      ...b,
      isDirty: true,
      subjects: b.subjects.filter(s => s.id !== subjectId)
    } : b));
  };



  const handleImportPlaylist = (chapterId: string) => {
    setModal({
      type: 'import-playlist',
      title: 'Import YouTube Playlist',
      confirmLabel: 'Import',
      onConfirm: async (data: { url: string }) => {
        if (!data.url) return;

        setLoading(true);
        setModal(null);

        try {
          const url = data.url;
          let playlistId = null;
          const listMatch = url.match(/[?&]list=([^#\&\?]+)/);
          if (listMatch) {
            playlistId = listMatch[1];
          }

          if (!playlistId) {
            alert("Invalid Playlist URL. Could not find 'list' parameter.");
            setLoading(false);
            return;
          }

          const videos = await fetchPlaylistVideos(playlistId);

          if (videos.length === 0) {
            alert("No valid videos found in this playlist.");
            setLoading(false);
            return;
          }

          const newLectures: Lecture[] = videos.map((v, idx) => ({
            id: `l_${Date.now()}_${idx}`,
            title: v.title,
            youtubeUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}?rel=0&modestbranding=1&enablejsapi=1`,
            completed: false
          }));

          setData(prev => prev.map(b => b.id === activeBatchId ? {
            ...b,
            isDirty: true,
            subjects: b.subjects.map(s => s.id === activeSubjectId ? {
              ...s,
              chapters: s.chapters.map(c => c.id === chapterId ? {
                ...c,
                lectures: [...c.lectures, ...newLectures]
              } : c)
            } : s)
          } : b));

          alert(`Successfully imported ${videos.length} videos!`);

        } catch (error) {
          console.error("Import failed", error);
          alert("Failed to import playlist. Please wait a moment and try again.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleAddLecture = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setModal({
      type: 'prompt',
      title: `Add New ${terms.lecture}`,
      placeholder: `${terms.lecture} Title`,
      confirmLabel: 'Add',
      onConfirm: (name) => {
        if (typeof name !== 'string' || !name.trim()) return;
        
        // Context recovery: find the batch and subject that contains this chapter
        let targetBatchId = activeBatchId;
        let targetSubjectId = activeSubjectId;
        
        if (!targetBatchId || !targetSubjectId) {
            for (const b of data) {
                for (const s of b.subjects) {
                    if (s.chapters.some(c => c.id === chapterId)) {
                        targetBatchId = b.id;
                        targetSubjectId = s.id;
                        break;
                    }
                }
                if (targetBatchId) break;
            }
        }

        if (!targetBatchId || !targetSubjectId) {
            alert("Context loss detected. Unable to identify target node cluster.");
            return;
        }

        setData(prev => prev.map(b => b.id === targetBatchId ? {
          ...b,
          isDirty: true,
          subjects: b.subjects.map(s => s.id === targetSubjectId ? {
            ...s,
            chapters: s.chapters.map(c => c.id === chapterId ? {
              ...c,
              lectures: [...c.lectures, { id: `l_${Date.now()}`, title: name, youtubeUrl: '', embedUrl: '', completed: false }]
            } : c)
          } : s)
        } : b));
        setModal(null);
      }
    });
  };

  const handleImportCSV = (chapterId: string) => {
    setModal({
      type: 'import-csv',
      title: 'Import Lectures from CSV',
      message: 'Upload a CSV file. Supports comma (,) or semicolon (;) delimiters. Format: title;url',
      confirmLabel: 'Import',
      onConfirm: async (file: File) => {
        if (!file) return;

        setLoading(true);
        setModal(null);

        try {
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim());

          // Auto-detect delimiter
          const firstLine = lines[0];
          const delimiter = firstLine.includes(';') && (firstLine.split(';').length >= 2) ? ';' : ',';

          // Skip header row if it exists
          const startIndex = lines[0].toLowerCase().includes('title') || lines[0].toLowerCase().includes('url') ? 1 : 0;

          const newLectures: Lecture[] = [];

          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle quoted fields)
            const fields: string[] = [];
            let currentField = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
              const char = line[j];

              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === delimiter && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
              } else {
                currentField += char;
              }
            }
            fields.push(currentField.trim());

            if (fields.length >= 2) {
              const title = fields[0].replace(/^"|"$/g, '').trim();
              const url = fields[1].replace(/^"|"$/g, '').trim();

              if (title && url) {
                newLectures.push({
                  id: `l_csv_${Date.now()}_${i}`,
                  title,
                  youtubeUrl: url,
                  embedUrl: getEmbedUrl(url),
                  completed: false
                });
              }
            }
          }

          if (newLectures.length === 0) {
            alert(`No valid lectures found in CSV. Please ensure your file uses "${delimiter}" as a separator.`);
            setLoading(false);
            return;
          }

          setData(prev => prev.map(b => b.id === activeBatchId ? {
            ...b,
            isDirty: true,
            subjects: b.subjects.map(s => s.id === activeSubjectId ? {
              ...s,
              chapters: s.chapters.map(c => c.id === chapterId ? {
                ...c,
                lectures: [...c.lectures, ...newLectures]
              } : c)
            } : s)
          } : b));

          alert(`Successfully imported ${newLectures.length} lectures from CSV!`);
        } catch (error) {
          console.error('CSV import failed:', error);
          alert('Failed to import CSV. Please check the file format and try again.');
        } finally {
          setLoading(false);
        }
      }
    });
  };
  const handleToggleNotes = async (lectureId: string, videoUrl: string) => {
    // If we already have the description, just toggle visibility
    const lecture = activeChapter?.lectures.find(l => l.id === lectureId);

    if (lecture && !lecture.description) {
      setLoading(true);
      try {
        const videoId = videoUrl.includes('v=') ? videoUrl.split('v=')[1].split(/[?#&]/)[0] :
          videoUrl.includes('youtu.be/') ? videoUrl.split('youtu.be/')[1].split(/[?#&]/)[0] : null;

        if (videoId) {
          const description = await fetchVideoDescription(videoId);
          // Save description to data
          setData(prev => prev.map(b => b.id === activeBatchId ? {
            ...b,
            isDirty: true,
            subjects: b.subjects.map(s => s.id === activeSubjectId ? {
              ...s,
              chapters: s.chapters.map(c => c.id === activeChapterId ? {
                ...c,
                lectures: c.lectures.map(l => l.id === lectureId ? { ...l, description } : l)
              } : c)
            } : s)
          } : b));
        }
      } catch (error) {
        console.error("Failed to fetch notes", error);
      } finally {
        setLoading(false);
      }
    }

    setShowNotes(prev => ({ ...prev, [lectureId]: !prev[lectureId] }));
  };


  const toggleLecture = (lectureId: string) => {
    setData(prev => prev.map(b => b.id === activeBatchId ? {
      ...b,
      isDirty: true,
      sessions: (() => {
        const currentBatch = prev.find(pb => pb.id === activeBatchId);
        const currentSubject = currentBatch?.subjects.find(s => s.id === activeSubjectId);
        const currentChapter = currentSubject?.chapters.find(c => c.id === activeChapterId);
        const lecture = currentChapter?.lectures.find(l => l.id === lectureId);
        
        if (!lecture) return b.sessions;
        
        if (!lecture.completed) {
          const newSession: StudySession = {
            id: `sess_${Date.now()}`,
            lectureId,
            lectureTitle: lecture.title,
            subjectName: currentSubject?.name || 'General',
            duration: lecture.duration || 2700, // 45 min default
            timestamp: Date.now()
          };
          return [...(b.sessions || []), newSession];
        } else {
          return (b.sessions || []).filter(s => s.lectureId !== lectureId);
        }
      })(),
      subjects: b.subjects.map(s => s.id === activeSubjectId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === activeChapterId ? {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id === lectureId) {
              const newCompleted = !l.completed;
              let revisions = l.revisions;
              if (newCompleted) {
                // Initialize Spaced Repetition (D1, D3, D7, D15, D30)
                const now = new Date();
                revisions = [1, 3, 7, 15, 30].map(days => {
                  const dueDate = new Date(now);
                  dueDate.setDate(now.getDate() + days);
                  return { day: days, dueDate: dueDate.toISOString().split('T')[0], completed: false };
                });
              } else {
                revisions = undefined;
              }
              return { 
                ...l, 
                completed: newCompleted, 
                completedAt: newCompleted ? Date.now() : undefined,
                revisions 
              };
            }
            return l;
          })
        } : c)
      } : s)
    } : b));
  };

  const handleDeleteLecture = (lectureId: string) => {
    setData(prev => prev.map(b => b.id === activeBatchId ? {
      ...b,
      isDirty: true,
      subjects: b.subjects.map(s => s.id === activeSubjectId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === activeChapterId ? {
          ...c,
          lectures: c.lectures.filter(l => l.id !== lectureId)
        } : c)
      } : s)
    } : b));
  };

  const handleScheduleLecture = (lectureId: string) => {
    const today = getTodayDate();
    setData(prev => prev.map(b => b.id === activeBatchId ? {
      ...b,
      isDirty: true,
      subjects: b.subjects.map(s => s.id === activeSubjectId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === activeChapterId ? {
          ...c,
          lectures: c.lectures.map(l => l.id === lectureId ? { ...l, scheduledDate: today } : l)
        } : c)
      } : s)
    } : b));
  };

  const handleMaximizeVideo = (lectureId: string) => {
    setActiveLectureId(lectureId);
    setViewMode(ViewMode.STUDIO);
    navigate(`/studio/${lectureId}?batchId=${activeBatchId || ''}&subjectId=${activeSubjectId || ''}&chapterId=${activeChapterId || ''}`);
  };

  const FullscreenOverlay = () => {
    if (!maximizedLectureId) return null;

    // Find the lecture data
    let foundLecture: Lecture | null = null;
    data.forEach(b => b.subjects.forEach(s => s.chapters.forEach(c => c.lectures.forEach(l => {
      if (l.id === maximizedLectureId) foundLecture = l;
    }))));

    if (!foundLecture) return null;

    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-300">
        <div className="absolute top-6 right-6 z-[1001] flex gap-3">
          <button
            onClick={() => setMaximizedLectureId(null)}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl border border-white/10 transition-all font-black text-xs uppercase tracking-widest"
          >
            Close Fullscreen
          </button>
        </div>
        <div className="flex-1 w-full h-full">
          <iframe
            src={(foundLecture as Lecture).embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  };

  const handleAISuggestChapters = async () => {
    if (!activeSubject) return;
    setLoading(true);
    const suggestions = await suggestLectures(activeSubject.name);
    setLoading(false);
    if (suggestions.length > 0) {
      setModal({
        type: 'confirm',
        title: 'Apply Elite Syllabus?',
        message: `Gemini has identified ${suggestions.length} high-priority chapters optimized for your rank.`,
        confirmLabel: 'Apply Roadmap',
        onConfirm: () => {
          const newChapters: Chapter[] = suggestions.map(name => ({
            id: `c_ai_${Math.random()}`,
            name,
            lectures: []
          }));
          setData(prev => prev.map(b => b.id === activeBatchId ? {
            ...b,
            isDirty: true,
            subjects: b.subjects.map(s => s.id === activeSubjectId ? {
              ...s,
              chapters: [...s.chapters, ...newChapters]
            } : s)
          } : b));
          setModal(null);
        }
      });
    }
  };

  // ... existing code ...


  const PrivacyPolicyModal = () => (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg">
      <div className="bg-[#161e2d] w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar relative">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#161e2d] z-10 pb-4">
          <h3 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Privacy Policy</h3>
          <button onClick={() => setIsPrivacyOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">Data Management</h4>
            <p>BatchWise is designed as a personal organization tool. Your data is stored locally for immediate access and synchronized with your personal Google account via Firebase for cross-device availability.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">YouTube & APIs</h4>
            <p>We leverage the YouTube Data API and official embedding features. We do not store or track your viewing history. All interaction with video content happens within the official YouTube player framework, respecting your privacy settings on that platform.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">No Third-Party Analytics</h4>
            <p>This platform does not use commercial tracking cookies or third-party analytics scripts. Your focus remains entirely on your studies.</p>
          </section>
        </div>
      </div>
    </div>
  );

  const DisclaimerModal = () => (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg">
      <div className="bg-[#161e2d] w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar relative">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#161e2d] z-10 pb-4">
          <h3 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Content & Copyright Disclaimer</h3>
          <button onClick={() => setIsDisclaimerOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">1. Educational Fair Use</h4>
            <p>This platform is a non-commercial, educational resource created strictly for students. We do not host video files on our own servers; instead, we provide organized access to publicly available educational content via YouTube Embedding.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">2. No Monetization</h4>
            <p>We believe in free education. This website is not monetized. We do not run ads, we do not charge for subscriptions, and we do not sell access to any of the lectures provided here.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">3. User-Generated Curation</h4>
            <p>This platform acts as a neutral tool for students to organize their own study materials. The selection and "importing" of YouTube lectures are performed by the students themselves for their individual learning needs. As the developer, I do not choose, upload, or host these lectures, nor do I exercise editorial control over the content selected by the users.</p>
          </section>
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">4. Respect for Content Owners</h4>
            <p>We are firmly against the unauthorized copying or re-hosting of educational content.</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li><strong>Direct Links:</strong> Our platform utilizes the official YouTube API and embedding features, which ensures that all traffic, engagement, and ad revenue flow directly to the original creator's YouTube channel.</li>
              <li><strong>No Manual Intervention:</strong> The developer does not manually curate or "scrape" these lectures. The platform serves only as a workspace for students to view content that is already publicly available on YouTube.</li>
            </ul>
          </section>
          <section>
            <h4 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">5. Intellectual Property Concerns</h4>
            <p>We hold the work of educators in the highest regard. Since the content is imported by users, if a copyright holder has concerns regarding their content appearing within this student interface, please contact us. We are committed to maintaining a platform that respects the rights of creators while empowering students to learn for free.</p>
          </section>
          <div className="pt-6 border-t border-white/5">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Technical or Content Inquiries:</p>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=yashwinka8@gmail.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:text-blue-300">yashwinka8@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );

  /* Analytics Logic */
  const GlobalAnalyticsModal = () => {
    const allSessions = data.flatMap(b => b.sessions || []);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const [aiAudit, setAiAudit] = useState<string | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    const totalTime = data.reduce((acc, b) => acc + (b.subjects.reduce((sAcc, s) => sAcc + s.chapters.reduce((cAcc, c) => cAcc + c.lectures.reduce((lAcc, l) => lAcc + (l.studyTime || 0), 0), 0), 0)), 0);
    const weeklyTime = allSessions.filter(s => s.timestamp >= weekAgo).reduce((acc, s) => acc + s.duration, 0);
    const monthlyTime = allSessions.filter(s => s.timestamp >= monthAgo).reduce((acc, s) => acc + s.duration, 0);

    const subjectStats: { [key: string]: number } = {};
    data.forEach(b => b.subjects.forEach(s => {
      const sTime = s.chapters.reduce((cAcc, c) => cAcc + c.lectures.reduce((lAcc, l) => lAcc + (l.studyTime || 0), 0), 0);
      subjectStats[s.name] = (subjectStats[s.name] || 0) + sTime;
    }));
    const sortedSubjects = Object.entries(subjectStats).sort(([, a], [, b]) => b - a);
    const dailyAvg = weeklyTime / 7;

    const handleStrategicAudit = async () => {
        setIsAuditing(true);
        try {
            const stats = {
                totalTime: formatTime(totalTime),
                weeklyVelocity: formatTime(weeklyTime),
                monthlyIntensity: formatTime(monthlyTime),
                subjectAllocation: sortedSubjects.map(([n, t]) => ({ name: n, time: formatTime(t) })),
                recentSessions: allSessions.slice(-5).map(s => ({ title: s.lectureTitle, subject: s.subjectName }))
            };

            const systemPrompt = `You are a high-level Skill Development Strategist. 
            Analyze the user's learning telemetry and provide a "Strategic Audit" for mastering their chosen skills.
            
            NEW TASK: Based on their current 'Weekly Velocity' and 'Total Progress', PREDICT their course completion date.
            
            Identify hidden gaps, intensity plateaus, and provide a "Critical Execution Command".
            Use rigorous terminology (e.g., 'Focus Entropy', 'Skill Retention Velocity', 'Mastery Gradient').
            Use LaTeX ($...$) for any formulas or notations.
            Keep it professional, high-fidelity, and under 200 words. Format with clean sections.`;

            const prompt = `Student Telemetry: ${JSON.stringify(stats)}`;
            
            const result = await queryGroq(prompt, systemPrompt);
            if (result.success) {
                setAiAudit(result.content);
                reRenderMathJax();
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            alert("Audit Failed: " + e.message);
        } finally {
            setIsAuditing(false);
        }
    };

    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-2xl animate-apple" onClick={() => setIsAnalyticsOpen(false)}>
        <div className="glass-card w-full max-w-5xl rounded-[3rem] border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[90vh] bg-slate-950/40" onClick={e => e.stopPropagation()}>
          {/* Motion Graphic Header Decorative */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500"></div>
          <div className="absolute -top-24 -right-24 size-64 bg-rose-500/10 blur-[100px] rounded-full animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 size-64 bg-indigo-500/10 blur-[100px] rounded-full animate-pulse blur-delay-2000"></div>

          <div className="p-8 md:p-12 pb-0 flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-rose-500 text-sm">monitoring</span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Neural Analytics v4.0</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Focus <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Nexus</span></h3>
            </div>
            <button onClick={() => setIsAnalyticsOpen(false)} className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group active:scale-90">
              <XIcon size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative z-10">
            {/* Quick Metrics Bento Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { l: "Lifetime Hours", v: formatTime(totalTime), c: "rose", i: "schedule" },
                { l: "7D Velocity", v: formatTime(weeklyTime), c: "emerald", i: "trending_up" },
                { l: "30D Intensity", v: formatTime(monthlyTime), c: "blue", i: "calendar_month" },
                { l: "Daily Quotient", v: formatTime(dailyAvg), c: "amber", i: "analytics" }
              ].map((m, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
                  <div className={`absolute -right-4 -top-4 size-20 rounded-full bg-${m.c}-500/10 blur-2xl group-hover:scale-150 transition-transform`}></div>
                  <span className={`material-symbols-outlined text-${m.c}-500 mb-4 text-2xl`}>{m.i}</span>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.l}</p>
                  <p className="text-2xl font-black text-white group-hover:translate-x-1 transition-transform">{m.v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Subject Proficiency */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                    Subject Allocation <div className="flex-1 h-px bg-white/5"></div>
                  </h4>
                  <div className="space-y-4">
                    {sortedSubjects.map(([name, time]) => {
                      const percentage = totalTime === 0 ? 0 : Math.round((time / totalTime) * 100);
                      return (
                        <div key={name} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
                          <div className="flex justify-between items-center mb-4 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-white group-hover:text-rose-500 transition-colors uppercase tracking-tighter">{name}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{formatTime(time)} Accumulation</span>
                            </div>
                            <span className="text-3xl font-black text-white/10 group-hover:text-rose-500/20 transition-all">{percentage}%</span>
                          </div>
                          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden relative z-10 border border-white/5">
                            <div className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(225,29,72,0.4)]" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {sortedSubjects.length === 0 && (
                      <div className="py-16 text-center rounded-[2rem] bg-white/[0.01] border border-dashed border-white/5">
                        <span className="material-symbols-outlined text-slate-700 text-4xl mb-4">data_alert</span>
                        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No spectral data detected in this node.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Sidebar Metrics */}
              <div className="space-y-8">
                <section>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Recent Frequency</h4>
                    <div className="space-y-3">
                        {allSessions.slice(-4).reverse().map((sess) => (
                            <div key={sess.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center justify-between group">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-white truncate pr-2">{sess.lectureTitle}</span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{sess.subjectName}</span>
                                </div>
                                <span className="text-[10px] font-black text-rose-500 group-hover:scale-110 transition-transform">+{formatTime(sess.duration)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-rose-500/10 to-indigo-500/10 border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white opacity-[0.01] group-hover:opacity-[0.03] transition-opacity"></div>
                    <span className="material-symbols-outlined text-rose-500 text-3xl mb-4 animate-bounce">rocket_launch</span>
                    <h5 className="text-sm font-black text-white uppercase tracking-widest mb-2">AI Strategic Audit</h5>
                    
                    {aiAudit ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-[11px] text-slate-300 leading-relaxed italic font-medium whitespace-pre-wrap">
                          {aiAudit}
                        </p>
                        <button 
                          onClick={() => setAiAudit(null)}
                          className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:brightness-125"
                        >
                          Clear Briefing
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-6">Analyze your neural patterns and study velocity for a comprehensive strategic briefing.</p>
                        <button 
                          onClick={handleStrategicAudit}
                          disabled={isAuditing}
                          className="w-full py-3 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isAuditing ? 'Auditing Neural Data...' : 'Initialize Strategic Audit'}
                        </button>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const calculateAnalytics = () => {
    let totalLectures = 0;
    let completedLectures = 0;
    let totalDuration = 0;
    let completedDuration = 0;

    data.forEach(batch => {
      batch.subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          chapter.lectures.forEach(lecture => {
            totalLectures++;
            if (lecture.completed) {
              completedLectures++;
            }
            completedDuration += (lecture.studyTime || 0);
            totalDuration += (lecture.duration || 0);
          });
        });
      });
    });

    // Add current unsaved session time
    completedDuration += sessionSeconds;

    return {
      totalLectures,
      completedLectures,
      remainingLectures: totalLectures - completedLectures,
      totalDuration,
      completedDuration,
      remainingDuration: totalDuration - completedDuration,
      percentage: totalLectures === 0 ? 0 : Math.round((completedLectures / totalLectures) * 100)
    };
  };



  const UpcomingUpdatesStrip = () => (
    <div className="hidden sm:flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full hover:bg-blue-500/20 transition-all cursor-help group overflow-hidden max-w-[180px] md:max-w-xs shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 group-hover:text-blue-300">Update</span>
      </div>
      <div className="h-3 w-px bg-blue-500/20 shrink-0" />
      <span className="text-[10px] font-bold text-[var(--apple-text-secondary)] group-hover:text-[var(--apple-text)] transition-all truncate">
        v4.2.0: AI-Powered Mock Analysis Coming Soon!
      </span>
      <SparklesIcon />
    </div>
  );

  // --- Standalone Optimized Components ---

  const AnnouncementTicker = React.memo(({ text, onOpen }: { text: string, onOpen: () => void }) => (
    <div
      onClick={onOpen}
      className="flex-1 overflow-hidden bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 relative group hover:border-blue-500/40 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Updates</span>
        </div>
        <div className="h-3 w-px bg-blue-500/20 shrink-0" />
        <div className="flex-1 overflow-hidden relative min-w-0">
          <div className="animate-marquee whitespace-nowrap will-change-transform">
            <span className="text-[10px] font-bold text-[var(--apple-text-secondary)] group-hover:text-[var(--apple-text)] transition-all">
              {text}
            </span>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
          will-change: transform;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `
      }} />
    </div>
  ));

  const SyncStatusIndicator = React.memo(({ status, lastSyncTime, user, isGuest, onSync }: { status: SyncStatus, lastSyncTime: string | null, user: any, isGuest: boolean, onSync?: () => void }) => {
    const isCloud = user && !isGuest;

    const getStatusConfig = () => {
      switch (status) {
        case 'syncing':
          return {
            icon: <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />,
            text: 'Syncing...',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
          };
        case 'synced':
          return {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
            text: 'Cloud Synced',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20'
          };
        case 'offline':
          return {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
            text: 'Sync Needed',
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/40 animate-pulse'
          };
        case 'error':
          return {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
            text: 'Sync Error',
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20'
          };
        default:
          return {
            icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />,
            text: 'Idle',
            color: 'text-slate-500',
            bgColor: 'bg-white/5',
            borderColor: 'border-white/5'
          };
      }
    };

    if (!isCloud) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10" title="Offline mode: Data saved locally only">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 opacity-60">Local</span>
        </div>
      );
    }

    const config = getStatusConfig();
    const formatLastSync = () => {
      if (!lastSyncTime) return 'Waiting...';
      const date = new Date(lastSyncTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div
        className={`flex items-center gap-2.5 ${config.bgColor} border ${config.borderColor} px-3 py-1.5 rounded-lg transition-all cursor-pointer group shadow-sm hover:scale-[1.02] active:scale-[0.98]`}
        onClick={() => {
          if (status === 'error') window.location.reload();
          else if (status === 'offline' && onSync) onSync();
        }}
        title={status === 'offline' ? 'Click to Synchronize with Cloud' : `Status: ${config.text}${lastSyncTime ? ` | Last Update: ${formatLastSync()}` : ''}`}
      >
        <div className={`${config.color} flex items-center`}>{config.icon}</div>
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${config.color} leading-none hidden sm:block`}>
            {config.text}
          </span>
          {lastSyncTime && (
            <span className="text-[7px] font-bold text-slate-500 mt-0.5 opacity-60">
              {formatLastSync()}
            </span>
          )}
        </div>
      </div>
    );
  });

  const AnalyticsSummary = React.memo(({ stats }: { stats: any }) => {
    if (stats.totalLectures === 0) return null;

    return (
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10">
        <div className="bg-slate-100/50 dark:bg-white/5 p-5 rounded-3xl border border-[var(--apple-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all text-[var(--primary)]"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Invested</p>
          <p className="text-2xl font-black text-[var(--apple-text)]">{formatTime(stats.completedDuration)}</p>
        </div>
        <div className="bg-slate-100/50 dark:bg-white/5 p-5 rounded-3xl border border-[var(--apple-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all text-emerald-500"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Modules Cleared</p>
          <p className="text-2xl font-black text-[var(--apple-text)]">{stats.completedLectures} <span className="text-sm text-slate-600">/ {stats.totalLectures}</span></p>
        </div>
        <div className="bg-slate-100/50 dark:bg-white/5 p-5 rounded-3xl border border-[var(--apple-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all text-[var(--primary)]/60"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Progress</p>
          <p className="text-2xl font-black text-[var(--apple-text)]">{stats.percentage}%</p>
        </div>
        <div className="bg-[#161e2d] p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all text-amber-500"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Coming Next</p>
          <p className="text-sm font-black text-slate-400">Mock Series v5</p>
        </div>
      </div>
    );
  });

  const BriefFooter = React.memo(({ user, isAdmin, onShowDisclaimer, onShowPrivacy, onHide }: { user: any, isAdmin: boolean, onShowDisclaimer: () => void, onShowPrivacy: () => void, onHide: () => void }) => (
    <footer className="mt-auto relative overflow-hidden bg-[var(--apple-bg)] border-t border-[var(--apple-border)] transition-colors duration-500">
      {/* Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent"></div>
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <button 
        onClick={onHide}
        className="absolute top-6 right-6 z-20 size-10 rounded-full bg-[var(--apple-vibrancy)] border border-[var(--apple-border)] flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-red-500/10 hover:border-red-500/30 group"
        title="Hide Footer"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">close</span>
      </button>

      <div className="max-w-[1400px] mx-auto pt-16 pb-8 px-6 lg:px-12 relative z-10 transition-colors duration-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">

          {/* Brand Info */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--apple-vibrancy)] border border-[var(--apple-border)] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-blue-500/20 transition-all duration-300">
                <BatchWiseLogo className="w-5 h-5 dark:invert transition-transform hover:scale-110 duration-300 fill-[var(--apple-text)]" />
              </div>
              <span className="font-extrabold text-2xl text-[var(--apple-text)] tracking-tight">Batch<span className="text-[var(--apple-text-secondary)]">Wise</span></span>
            </div>
            <p className="text-[var(--apple-text-secondary)] text-[15px] leading-relaxed mb-8 max-w-[280px]">
              Your personal learning command center. Master any skill with structured courses, progress tracking, and AI-powered insights.
            </p>
            <div className="flex gap-4">
              <a href="https://www.reddit.com/r/BatchWise_Official/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[var(--apple-vibrancy)] border border-[var(--apple-border)] flex items-center justify-center hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-500 text-[var(--apple-text-secondary)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_-5px_rgba(249,115,22,0.3)] group">
                <RedditIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
              </a>
              <a href="mailto:yashwinka8@gmail.com" className="w-10 h-10 rounded-full bg-[var(--apple-vibrancy)] border border-[var(--apple-border)] flex items-center justify-center hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 text-[var(--apple-text-secondary)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_-5px_rgba(59,130,246,0.3)] group">
                <GoogleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="text-[var(--apple-text)] font-bold text-sm uppercase tracking-widest mb-6 transition-colors">Resources</h4>
              <ul className="space-y-4">
                <li className="group"><a href="https://www.youtube.com/@GreatStackDev" target="_blank" rel="noopener noreferrer" className="text-[var(--apple-text-secondary)] group-hover:text-blue-500 text-[15px] transition-all duration-300 font-medium flex items-center gap-2"><div className="w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-2"></div>Web Dev Tutorials</a></li>
                <li className="group"><a href="https://www.youtube.com/@CaseyFarris" target="_blank" rel="noopener noreferrer" className="text-[var(--apple-text-secondary)] group-hover:text-blue-500 text-[15px] transition-all duration-300 font-medium flex items-center gap-2"><div className="w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-2"></div>Video Editing Guides</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[var(--apple-text)] font-bold text-sm uppercase tracking-widest mb-6 transition-colors">Legal</h4>
              <ul className="space-y-4">
                <li className="group"><button onClick={onShowPrivacy} className="text-[var(--apple-text-secondary)] group-hover:text-[var(--apple-text)] text-[15px] transition-all duration-300 font-medium flex items-center gap-2"><div className="w-0 h-[2px] bg-[var(--apple-text)] rounded-full transition-all duration-300 group-hover:w-2"></div>Privacy Policy</button></li>
                <li className="group"><button onClick={onShowDisclaimer} className="text-[var(--apple-text-secondary)] group-hover:text-[var(--apple-text)] text-[15px] transition-all duration-300 font-medium flex items-center gap-2"><div className="w-0 h-[2px] bg-[var(--apple-text)] rounded-full transition-all duration-300 group-hover:w-2"></div>Copyright Disclaimer</button></li>
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <h4 className="text-[var(--apple-text)] font-bold text-sm uppercase tracking-widest mb-6 transition-colors">Need Help?</h4>
              <ul className="space-y-4">
                <li className="group"><a href="https://mail.google.com/mail/?view=cm&fs=1&to=yashwinka8@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[var(--apple-text-secondary)] group-hover:text-blue-500 text-[15px] transition-all duration-300 font-medium flex items-center gap-2"><div className="w-0 h-[2px] bg-blue-500 rounded-full transition-all duration-300 group-hover:w-2"></div>Contact Support</a></li>
                <li className="group"><a href="https://www.reddit.com/r/BatchWise_Official/" target="_blank" rel="noopener noreferrer" className="text-[var(--apple-text-secondary)] group-hover:text-orange-500 text-[15px] transition-all duration-300 font-medium flex items-center gap-2"><div className="w-0 h-[2px] bg-orange-500 rounded-full transition-all duration-300 group-hover:w-2"></div>Community Forum</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-[var(--apple-border)] transition-colors duration-500">
          <p className="text-[var(--apple-text-secondary)] text-sm font-medium transition-colors">
            © {new Date().getFullYear()} BatchWise. All rights reserved.
          </p>
          <div className="flex items-center gap-3 bg-[var(--apple-vibrancy)] transition-colors cursor-default px-4 py-2 rounded-full border border-[var(--apple-border)] group">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all animate-pulse"></div>
            <span className="text-[10px] text-[var(--apple-text-secondary)] font-mono tracking-widest uppercase transition-colors">
              {user ? user.email : 'Guest'} • {isAdmin ? 'ADMIN' : 'STUDENT'} • {user?.uid?.slice(0, 6)}
            </span>
          </div>
        </div>
      </div>
    </footer>
  ));

  const formatTime = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const MockTestView = () => {
    const [activeSection, setActiveSection] = useState<'pyq' | 'mocks'>('mocks');
    const [dynamicTests, setDynamicTests] = useState<MockTest[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sections = [
      { id: 'mocks', label: 'Strategic Mocks', icon: <SparklesIcon className="w-4 h-4" /> },
      { id: 'pyq', label: 'PYQ Archives', icon: <BookOpenIcon /> }
    ];

    useEffect(() => {
      const loadTests = async () => {
        setIsLoading(true);
        try {
          const data = await mockTestService.getAllTests(!isAdmin);
          setDynamicTests(data);
        } catch (e) {
          console.error('Failed to load tests:', e);
        }
        setIsLoading(false);
      };
      loadTests();
    }, []);

    const activeList = dynamicTests.filter(t => t.category === activeSection);

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pt-6">
        {/* Portal Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">
            Assessment <span className="text-[var(--primary)]">Forge</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Practice what you learn. AI-powered quiz engine tests your skill retention and knowledge gaps.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8 border-b border-white/5">
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id as any)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSection === s.id ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setViewMode(ViewMode.MOCK_ADMIN)} className="bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Initialize Admin Portal
            </button>
          )}
        </div>

        {/* Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {isLoading ? (
            <div className="col-span-full py-24 text-center">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Accessing Simulation Nodes...</p>
            </div>
          ) : activeList.map(test => (
            <div key={test.id} className="bg-[#0b0f1a] rounded-xl border border-white/5 hover:border-white/10 p-8 transition-all group relative overflow-hidden flex flex-col min-h-[300px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 group-hover:bg-[var(--primary)] transition-colors" />

              <div className="flex justify-between items-start mb-8">
                <div className={`px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border ${test.date === 'Live' ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
                  {test.date}
                </div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{test.level}</div>
              </div>

              <h3 className="text-xl font-bold text-white leading-tight mb-8 group-hover:translate-x-1 transition-transform">{test.title}</h3>

              <div className="grid grid-cols-2 gap-4 mb-auto">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Questions</p>
                  <p className="text-sm font-bold text-white">{test.questionsCount || 0}</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Duration</p>
                  <p className="text-sm font-bold text-white">{test.duration} MIN</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (test.isExternalHtml && test.externalHtmlUrl) {
                    window.open(test.externalHtmlUrl, '_blank');
                  } else {
                    setSelectedMockId(test.id);
                    setViewMode(ViewMode.MOCK_SIMULATOR);
                  }
                }}
                className="mt-10 w-full py-4 bg-slate-900 group-hover:bg-[var(--primary)] text-slate-400 group-hover:text-white border border-white/5 group-hover:border-transparent text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl"
              >
                {test.isExternalHtml ? 'Launch HTML Unit' : 'Initialize Simulator'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MockTestViewSupabase = () => {
    return (
      <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center space-y-12 md:space-y-16 pb-32">
        <header className="animate-apple opacity-0 [animation-fill-mode:forwards] px-6">
          <div className="size-20 md:size-24 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="text-4xl md:text-5xl group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">🚀</span>
          </div>
          <h1 className="text-4xl md:text-8xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none transition-all hover:tracking-normal duration-700 cursor-default">
            Testing <span className="text-[var(--primary)]">Vault</span>
          </h1>
          <p className="text-slate-500 font-black text-[9px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] animate-pulse">System Deployment: August 15, 2026</p>
        </header>
        
        <div className="max-w-3xl w-full px-4 animate-apple opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
          <div className="kinetic-portal p-8 md:p-16 relative group cursor-default">
            <div className="border-beam" />
            <div className="aurora-glow" />
            <div className="glass-noise" />
            
            <div className="relative z-10 space-y-6 md:space-y-8">
              <div className="flex items-center justify-center gap-2 mb-2 md:mb-4">
                 <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-white/20" />
                 <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Module Archive v4.0</span>
                 <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-white/20" />
              </div>
              
              <p className="text-slate-400 font-medium leading-relaxed text-base md:text-xl italic">
                "We are engineering a world-class examination infrastructure. Featuring real-time cloud analytics, AI-driven diagnostic protocols, and a hyper-accurate simulator for peak performance conditioning."
              </p>
              
              <div className="pt-8 md:pt-10 flex flex-wrap justify-center gap-8 md:gap-16 border-t border-white/5">
                {[
                  { icon: 'analytics', label: 'Cloud Analytics' },
                  { icon: 'psychology', label: 'AI Diagnostics' },
                  { icon: 'history_edu', label: 'PYQ Archives' }
                ].map((feature, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 group/feat">
                    <div className="size-12 md:size-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover/feat:text-white transition-all duration-500 relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/5 translate-y-full group-hover/feat:translate-y-0 transition-transform" />
                       <span className="material-symbols-outlined text-2xl md:text-3xl relative z-10">{feature.icon}</span>
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/feat:text-white transition-colors">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="animate-apple opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards] flex items-center gap-3 md:gap-4 text-slate-600">
           <div className="size-1 md:size-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Platform Core Synchronized</span>
        </div>
      </div>
    );
  };
  const OpenLibraryCard = () => (
    <div
      onClick={() => setViewMode(ViewMode.LIBRARY)}
      className="bg-[#0b0f1a] rounded-xl border border-white/5 p-8 flex flex-col group relative overflow-hidden cursor-pointer hover:border-[var(--primary)]/30 transition-all shadow-xl"
    >
      <div className="size-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-[var(--primary)] text-slate-500 group-hover:text-white">
        <span className="material-symbols-outlined scale-125">library_books</span>
      </div>
      <h3 className="text-xl font-bold mb-3 text-white tracking-tight group-hover:text-[var(--primary)] transition-colors italic">Elite <span className="text-[var(--primary)]">VAULT</span></h3>
      <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 italic">A curated vault of learning resources, tutorials, tools, and creative assets for skill mastery.</p>
      <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
        <span className="text-[var(--primary)]">Unlocked</span>
        <div className="w-1 h-1 bg-slate-800 rounded-full" />
        <span>Stratagem Level A</span>
      </div>
    </div>
  );

  interface LibraryBookProps {
    title: string;
    color: string;
    tagColor: string;
    status?: string;
    href?: string;
    reserved?: boolean;
    coverImageUrl?: string;
  }

  const LibraryBookInner: React.FC<LibraryBookProps> = ({ title, color, tagColor, status, href, reserved, coverImageUrl }) => {
    const displayImageUrl = getDirectDriveUrl(coverImageUrl);

    const Content = (
      <div className="flex flex-col items-center group/book perspective mb-8">
        <div className={`${displayImageUrl ? 'bg-slate-900' : color} w-44 aspect-[3/4] rounded-r-lg shadow-[10px_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden transform hover:rotate-y-[-10deg] transition-all duration-500 border-l-[12px] border-black/20`}>
          {displayImageUrl ? (
            <div className="absolute inset-0">
              <img src={displayImageUrl} alt={title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <>
              {/* Logo/Branding */}
              <div className="p-4 flex items-center gap-2 opacity-80">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <BatchWiseLogo className="w-3 h-3 invert" />
                </div>
                <span className="text-[10px] font-black text-white/90 tracking-tight">Batch<span className="text-white/60">Wise</span></span>
              </div>

              {/* Title Box */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-[4/1.2] bg-white rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center p-3 text-center">
                <span className="text-[10px] font-black leading-tight text-slate-800 uppercase tracking-tighter">{title}</span>
              </div>
            </>
          )}

          {/* Reflection/Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/book:opacity-100 transition-opacity pointer-events-none"></div>

          {reserved && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[7px] font-black text-white/80 uppercase tracking-[0.3em] border border-white/20 px-3 py-1 rounded-full">Coming Soon</span>
          </div>}
        </div>
        <span className="mt-6 text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/book:text-blue-500 transition-colors">{status || (reserved ? "Soon" : "Open")}</span>
      </div>
    );

    if (href && !reserved) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {Content}
        </a>
      );
    }
    return Content;
  };

  const ProfileSettingsView = () => {
    const [newName, setNewName] = useState(user?.displayName || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateName = async () => {
      if (!newName.trim()) return;
      setIsUpdating(true);
      try {
        await auth.updateProfile(newName);
        setUser({ ...user, displayName: newName });
        alert("Profile updated successfully.");
      } catch (e: any) {
        console.error(e);
        alert("Failed to update profile: " + e.message);
      } finally {
        setIsUpdating(false);
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-8 md:space-y-12 pb-32">
        <header className="animate-apple opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards] px-2">
          <div className="flex items-center gap-3 mb-4">
             <div className="size-1 w-6 md:w-8 bg-rose-600 rounded-full" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-rose-500/80">Executive Portal</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight mb-3 md:mb-4">
            Security & <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Identity</span>
          </h1>
          <p className="text-slate-400 font-medium text-base md:text-lg max-w-2xl">
            Manage your digital signature, synchronization protocols, and platform preferences through our secure encryption matrix.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          {/* Left Column: Command Card */}
          <div className="lg:col-span-4 space-y-6 animate-apple opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards]">
            <div className="kinetic-portal group p-8 md:p-10 flex flex-col items-center text-center">
              <div className="border-beam" />
              <div className="glass-noise" />
              <div className="aurora-glow" />
              
              <div className="relative mb-6 md:mb-8 group/avatar">
                <div className="size-24 md:size-32 rounded-full bg-slate-800 border-4 border-slate-900 shadow-2xl overflow-hidden group-hover/avatar:border-rose-500/50 transition-all duration-700 relative z-10">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover scale-110 group-hover/avatar:scale-100 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-3xl md:text-4xl text-white font-bold">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="absolute -inset-4 bg-rose-500/20 blur-2xl rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
                <div className="absolute bottom-1 right-1 size-6 md:size-7 bg-emerald-500 border-4 border-[#09090b] rounded-full z-20 shadow-lg" />
              </div>

              <div className="relative z-10">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-rose-500 transition-colors duration-500">{user?.displayName || 'Unknown Operator'}</h2>
                <p className="text-[11px] md:text-sm text-slate-500 font-bold tracking-wider mb-6 md:mb-8 uppercase">{user?.email}</p>

                <div className="flex items-center gap-3 justify-center mb-2">
                   <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[12px] md:text-[14px]">verified_user</span>
                      Secure Node
                   </div>
                </div>
              </div>
            </div>

            <div className="kinetic-portal p-6 md:p-8 space-y-4 md:space-y-5 animate-apple opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards]">
               <StudyHeatmap batches={data} />
            </div>

            <div className="kinetic-portal p-6 md:p-8 space-y-4 md:space-y-5 animate-apple opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards]">
               {[
                 { label: 'Active Since', value: 'May 2026', icon: 'history' },
                 { label: 'Clearance', value: 'Level 04', icon: 'security' },
                 { label: 'Sync Status', value: 'Encrypted', icon: 'sync', color: 'text-emerald-500' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between text-[11px] md:text-xs group/item">
                    <div className="flex items-center gap-3 text-slate-500">
                       <span className="material-symbols-outlined text-sm group-hover/item:text-rose-500 transition-colors">{item.icon}</span>
                       <span className="font-bold uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className={`font-bold ${item.color || 'text-white'}`}>{item.value}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Right Column: Systems */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8 animate-apple opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards]">
            {/* Signature Management */}
            <div className="kinetic-portal p-8 md:p-10 relative group">
              <div className="aurora-glow" style={{ '--portal-accent': '#f43f5e' } as any} />
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-white mb-8 md:mb-10 flex items-center gap-4">
                  <div className="size-9 md:size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <span className="material-symbols-outlined text-xl md:text-2xl">fingerprint</span>
                  </div>
                  Signature Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] block px-1">Global Callsign</label>
                    <div className="relative group/input">
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter identification..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-white focus:outline-none focus:border-rose-500/50 transition-all font-bold placeholder:text-slate-700 text-sm md:text-base"
                      />
                      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="space-y-3 opacity-40">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] block px-1">Network Node</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      readOnly 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-slate-400 font-bold cursor-not-allowed text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="mt-8 md:mt-10 flex flex-col md:flex-row items-center justify-between gap-6 p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                   <p className="text-[11px] md:text-xs text-slate-500 font-medium text-center md:text-left">Updating your global callsign will synchronize across all distributed cloud nodes.</p>
                   <button 
                    onClick={handleUpdateName}
                    disabled={isUpdating || newName === user?.displayName}
                    className="w-full md:w-auto relative px-8 py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-20 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-rose-600/30 overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    {isUpdating ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Apply Signature'}
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <div className="kinetic-portal p-6 md:p-8 group overflow-hidden">
                  <div className="aurora-glow" style={{ '--portal-accent': '#f59e0b' } as any} />
                  <div className="relative z-10 flex items-center justify-between mb-6 md:mb-8">
                     <div className="size-10 md:size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-0 md:mb-4 transition-transform group-hover:scale-110 duration-500">
                        <span className="material-symbols-outlined text-xl md:text-2xl">visibility_off</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" checked={isGuest} onChange={() => { }} />
                        <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 border border-white/5"></div>
                     </label>
                  </div>
                  <h4 className="text-white font-bold mb-1 md:mb-2 text-sm md:text-base">Anonymous Matrix</h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">Session-based extraction without a persistent cloud footprint.</p>
               </div>

               <div className="kinetic-portal p-6 md:p-8 group overflow-hidden">
                  <div className="aurora-glow" style={{ '--portal-accent': '#3b82f6' } as any} />
                  <div className="relative z-10 flex items-center justify-between mb-6 md:mb-8">
                     <div className="size-10 md:size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-0 md:mb-4 transition-transform group-hover:scale-110 duration-500">
                        <span className="material-symbols-outlined text-xl md:text-2xl">notifications_active</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" checked={true} readOnly />
                        <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 border border-white/5"></div>
                     </label>
                  </div>
                  <h4 className="text-white font-bold mb-1 md:mb-2 text-sm md:text-base">Neural Alerts</h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">Direct synchronization of platform directives and tactical updates.</p>
               </div>
               <div className="kinetic-portal p-6 md:p-8 group overflow-hidden">
                  <div className="aurora-glow" style={{ '--portal-accent': '#10b981' } as any} />
                  <div className="relative z-10 flex items-center justify-between mb-6 md:mb-8">
                     <div className="size-10 md:size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-0 md:mb-4 transition-transform group-hover:scale-110 duration-500">
                        <span className="material-symbols-outlined text-xl md:text-2xl">track_changes</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" checked={showTodayTarget} onChange={(e) => {
                          setShowTodayTarget(e.target.checked);
                          localStorage.setItem('showTodayTarget', String(e.target.checked));
                        }} />
                        <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 border border-white/5"></div>
                     </label>
                  </div>
                  <h4 className="text-white font-bold mb-1 md:mb-2 text-sm md:text-base">Today's Targets</h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">Display scheduled daily lectures on the main dashboard.</p>
               </div>
            </div>

            {/* Termination Vector */}
            <div className="kinetic-portal p-8 md:p-10 bg-rose-600/[0.03] border-rose-500/10 group">
               <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
                  <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-bold text-rose-500 mb-2">Emergency Purge</h3>
                    <p className="text-[11px] md:text-sm text-slate-500 font-medium max-w-sm">Permanently incinerate all cloud nodes, strategic archives, and command history. (Irreversible)</p>
                  </div>
                  <button className="w-full md:w-auto relative px-8 md:px-10 py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] transition-all duration-500">
                    Purge All Data
                  </button>
               </div>
            </div>

            {/* Manifest Vector */}
            <div className="pt-4 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 opacity-40 px-4">
               <div className="flex gap-6 md:gap-10">
                  <button onClick={() => setIsPrivacyOpen(true)} className="text-[9px] md:text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.3em]">Privacy Directive</button>
                  <button onClick={() => setIsDisclaimerOpen(true)} className="text-[9px] md:text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.3em]">Terms of Vector</button>
               </div>
               <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Batchwise Nexus v2.0.4 • 2026</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LibraryResourceCard = ({ resource, onEdit, onDelete, isPinned, onTogglePin }: { resource: LibraryResource; onEdit?: (r: LibraryResource) => void; onDelete?: (id: string) => void; isPinned?: boolean; onTogglePin?: (id: string) => void }) => {
    const getIcon = (cat: string) => {
      switch (cat.toLowerCase()) {
        case 'pdf': return 'description';
        case 'drive': return 'cloud_download';
        case 'telegram': return 'send';
        case 'formulas': return 'functions';
        case 'pyq': case 'pyqs': return 'history_edu';
        default: return 'bookmark';
      }
    };

    const getBtnText = (cat: string) => {
      switch (cat.toLowerCase()) {
        case 'pdf': return 'Download PDF';
        case 'drive': return 'Open Drive';
        case 'telegram': return 'Join Channel';
        case 'formulas': return 'Quick View';
        case 'pyq': case 'pyqs': return 'View Paper';
        default: return 'Open Resource';
      }
    };

    const getAccentColor = (cat: string) => {
      switch (cat.toLowerCase()) {
        case 'pdf': return 'bg-rose-500/10 text-rose-500';
        case 'drive': return 'bg-blue-500/10 text-blue-500';
        case 'telegram': return 'bg-emerald-500/10 text-emerald-500';
        case 'formulas': return 'bg-amber-500/10 text-amber-500';
        case 'pyq': case 'pyqs': return 'bg-purple-500/10 text-purple-500';
        default: return 'bg-slate-500/10 text-slate-500';
      }
    };

    // Can edit/delete if: user is the contributor OR user is yashwinka8@gmail.com
    const canManage = user && (
      user.uid === resource.contributorId ||
      user.email === 'yashwinka8@gmail.com' ||
      isAdmin
    );

    return (
      <div className={`bg-[#0b0f1a] rounded-xl border p-4 md:p-6 flex flex-col group relative overflow-hidden transition-all hover:border-white/10 h-full w-full ${isPinned ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-white/5'}`}>
        {isPinned && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        )}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`size-10 rounded-xl flex items-center justify-center ${getAccentColor(resource.category || 'PDF')}`}>
              <span className="material-symbols-outlined">{getIcon(resource.category || 'PDF')}</span>
            </div>
            {isPinned && (
              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Pinned</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onTogglePin && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(resource.id); }}
                className={`p-1.5 rounded-lg transition-all ${isPinned ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'}`}
                title={isPinned ? 'Unpin' : 'Pin to top'}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
              </button>
            )}
            <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.03] px-2 py-1 rounded border border-white/5">
              {resource.category || 'PDF'}
            </span>
            {canManage && (
              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                    className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                    title="Edit"
                  >
                    <EditIcon size={12} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${resource.title}"?`)) onDelete(resource.id); }}
                    className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-1 group-hover:text-[var(--primary)] transition-colors leading-tight">
          {resource.title}
        </h3>
        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-1 line-clamp-2">
          {resource.description || "Study material shared by the community."}
        </p>
        {resource.contributorName && (
          <p className="text-[9px] text-slate-600 mb-4">
            Shared by <span className="text-slate-400 font-medium">{resource.contributorName}</span>
          </p>
        )}

        <a
          href={resource.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full py-3 bg-white/[0.03] group-hover:bg-[var(--primary)] text-slate-400 group-hover:text-white border border-white/5 group-hover:border-transparent text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[14px]">{resource.category?.toLowerCase() === 'telegram' ? 'group' : 'open_in_new'}</span>
          {getBtnText(resource.category || 'PDF')}
        </a>
      </div>
    );
  };

  const LibraryView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);

    const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('bw_pinned_library') || '[]'); } catch { return []; }
    });

    const togglePin = (id: string) => {
      setPinnedIds(prev => {
        const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
        localStorage.setItem('bw_pinned_library', JSON.stringify(next));
        return next;
      });
    };
    const [formTitle, setFormTitle] = useState('');
    const [formHref, setFormHref] = useState('');
    const [formCategory, setFormCategory] = useState('PDF');
    const [formDesc, setFormDesc] = useState('');

    const categories = ['AI Tools', 'Video Editing', 'Design', 'Coding', 'Productivity', 'PDFs', 'Social', 'Templates', 'Resources'];

    const categoryMatcher = (cat: string, c: string) => {
      if (cat === 'All') return true;
      if (cat === 'AI Tools') return c.includes('ai') || c.includes('chatgpt') || c.includes('midjourney') || c.includes('generative');
      if (cat === 'Video Editing') return c.includes('video') || c.includes('edit') || c.includes('premiere') || c.includes('davinci') || c.includes('final cut');
      if (cat === 'Design') return c.includes('design') || c.includes('figma') || c.includes('canva') || c.includes('photoshop') || c.includes('ui');
      if (cat === 'Coding') return c.includes('code') || c.includes('program') || c.includes('javascript') || c.includes('python') || c.includes('web');
      if (cat === 'Productivity') return c.includes('productivity') || c.includes('notion') || c.includes('obsidian') || c.includes('workflow');
      if (cat === 'PDFs') return c.includes('pdf') || c === 'documents';
      if (cat === 'Social') return c.includes('drive') || c.includes('link') || c.includes('google') || c.includes('telegram') || c === 'group' || c === 'channel';
      if (cat === 'Templates') return c.includes('template') || c.includes('starter') || c.includes('boilerplate');
      if (cat === 'Resources') return c.includes('resource') || c.includes('tool') || c.includes('guide') || c.includes('tutorial');
      return false;
    };

    const getCategoryCount = (cat: string) => {
      if (cat === 'All') return libraryResources.length;
      return libraryResources.filter(r => categoryMatcher(cat, r.category?.toLowerCase() || '')).length;
    };

    const filteredResources = libraryResources.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const c = r.category?.toLowerCase() || '';
      if (activeCategory === 'All') return matchesSearch;
      return matchesSearch && categoryMatcher(activeCategory, c);
    });

    const openAddForm = () => {
      setFormTitle(''); setFormHref(''); setFormCategory('PDF'); setFormDesc('');
      setEditingResource(null);
      setShowAddForm(true);
    };

    const openEditForm = (r: LibraryResource) => {
      setFormTitle(r.title); setFormHref(r.href || ''); setFormCategory(r.category || 'PDF'); setFormDesc(r.description || '');
      setEditingResource(r);
      setShowAddForm(true);
    };

    const handleFormSubmit = async () => {
      if (!formTitle.trim() || !formHref.trim()) { alert('Please fill in the title and link.'); return; }
      try {
        await saveLibraryResource({
          id: editingResource?.id || `res_${Date.now()}`,
          title: formTitle.trim(),
          href: formHref.trim(),
          category: formCategory,
          description: formDesc.trim() || undefined,
          order: editingResource?.order || Date.now(),
          color: 'bg-white/5',
          contributorId: editingResource?.contributorId || user?.uid || '',
          contributorEmail: editingResource?.contributorEmail || user?.email || '',
          contributorName: editingResource?.contributorName || user?.displayName || 'Anonymous',
        } as LibraryResource);
        setShowAddForm(false);
        setEditingResource(null);
      } catch { alert('Failed to save.'); }
    };

    const handleDeleteRes = async (id: string) => {
      try { await deleteLibraryResource(id); } catch { alert('Failed to delete.'); }
    };

    const downloadSampleCSV = () => {
      const csvContent = "title,href,category,description,color,order\n" +
        "ChatGPT Prompt Guide,https://example.com/chatgpt.pdf,AI Tools,Master prompt engineering for AI tools,bg-slate-700,1\n" +
        "DaVinci Resolve Shortcuts,https://example.com/davinci.pdf,Video Editing,Quick reference for editing shortcuts,bg-blue-700,2\n" +
        "Figma UI Kit,https://example.com/figma,Design,Starter UI components for web design,bg-emerald-700,3";
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'library_template.csv');
      a.click();
    };

    return (
      <div className="max-w-7xl mx-auto p-6 md:p-10 pb-32 lg:pb-10">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Strategic <span className="text-[var(--primary)]">Vault</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">{libraryResources.length} Integrated Resources</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={downloadSampleCSV}
                className="size-10 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-[var(--primary)] flex items-center justify-center transition-all"
                title="Download Template"
             >
                <span className="material-symbols-outlined text-lg">download</span>
             </button>
             <button onClick={openAddForm} className="h-10 px-6 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <PlusIcon size={14} />
                Add Material
             </button>
          </div>
        </header>

        <div className="flex items-center gap-3 mb-8">
            <div className="relative flex-1 group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-lg group-focus-within:text-[var(--primary)] transition-colors">search</span>
                <input 
                    type="text" 
                    placeholder="Search resources..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--primary)]/30 transition-all"
                />
            </div>
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`size-[52px] rounded-2xl flex items-center justify-center border transition-all shrink-0 ${isFilterOpen ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                title="Toggle Filters"
            >
                <span className="material-symbols-outlined text-2xl">{isFilterOpen ? 'filter_list_off' : 'filter_list'}</span>
            </button>
            <div className="relative shrink-0">
                <input 
                  type="file" 
                  id="library-csv-import" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const text = event.target?.result as string;
                        const rows = text.split('\n').slice(1);
                        const newResources = rows.filter(r => r.trim()).map((row, i) => {
                            const [title, href, category, description] = row.split(',').map(s => s?.trim());
                            return {
                                id: `res_${Date.now()}_${i}`,
                                title: title || 'Imported Resource',
                                href: href || '',
                                category: category || 'PDF',
                                description: description || '',
                                contributorId: user?.uid || '',
                                contributorName: user?.displayName || 'Anonymous'
                            };
                        }).filter(r => r.title && r.href);
                        if (newResources.length > 0) {
                            await bulkSaveLibraryResources(newResources as any);
                            alert(`Imported ${newResources.length} units.`);
                        }
                    };
                    reader.readAsText(file);
                  }} 
                />
                <label htmlFor="library-csv-import" className="size-[52px] rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-slate-500 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all cursor-pointer" title="CSV Import">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                </label>
            </div>
        </div>

        {isFilterOpen && (
            <div className="flex flex-wrap gap-2 animate-apple mb-8 pb-2 border-b border-white/5">
                {['All', ...categories].map(cat => {
                const count = getCategoryCount(cat);
                return (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setIsFilterOpen(false); }}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 ${activeCategory === cat ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-white/[0.02] text-slate-500 border-white/5 hover:border-white/10'}`}>
                    {cat}
                    {count > 0 && <span className="opacity-40">{count}</span>}
                    </button>
                );
                })}
            </div>
        )}

        {activeCategory !== 'All' && !isFilterOpen && (
            <div className="flex items-center gap-2 mb-8 animate-apple">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Node:</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">{activeCategory}</span>
                    <button onClick={() => setActiveCategory('All')} className="text-[var(--primary)] hover:brightness-150"><XIcon size={12} /></button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[...filteredResources].sort((a, b) => {
            const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
            const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
            return bPinned - aPinned;
          }).map(resource => (
            <LibraryResourceCard key={resource.id} resource={resource} onEdit={openEditForm} onDelete={handleDeleteRes} isPinned={pinnedIds.includes(resource.id)} onTogglePin={togglePin} />
          ))}
          {filteredResources.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-slate-700 mb-3 block">search_off</span>
              <p className="text-slate-600 text-xs font-medium">No matching resources found.</p>
            </div>
          )}
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropBlur: '8px' }} onClick={() => { setShowAddForm(false); setEditingResource(null); }}>
            <div className="w-full max-w-md bg-[#0d0f14] rounded-t-3xl md:rounded-2xl border-t border-x md:border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{editingResource ? 'Edit Resource' : 'Share Resource'}</h3>
                <button onClick={() => { setShowAddForm(false); setEditingResource(null); }} className="size-10 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <input type="text" placeholder="Title (e.g. Physics Formula Sheet)" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--primary)]/30" />
                <input type="url" placeholder="Link (Google Drive, PDF URL, etc.)" value={formHref} onChange={e => setFormHref(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--primary)]/30" />
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--primary)]/30 appearance-none">
                  <option value="PDF" style={{ background: '#111318' }}>PDF</option>
                  <option value="Drive" style={{ background: '#111318' }}>Google Drive</option>
                  <option value="Telegram" style={{ background: '#111318' }}>Telegram</option>
                  <option value="Formulas" style={{ background: '#111318' }}>Formula Sheet</option>
                  <option value="PYQ" style={{ background: '#111318' }}>PYQ / Past Paper</option>
                </select>
                <textarea placeholder="Short description (optional)" rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--primary)]/30 resize-none" />
                <button onClick={handleFormSubmit}
                  className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-base">{editingResource ? 'save' : 'upload'}</span>
                  {editingResource ? 'Save Changes' : 'Add to Library'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="size-20 rounded-[2.5rem] bg-white shadow-2xl border border-rose-100 flex items-center justify-center mb-8 relative">
          <BatchWiseLogo className="w-10 h-10 text-rose-600" />
          <div className="absolute inset-0 border-4 border-rose-600 border-t-transparent rounded-[2.5rem] animate-spin" />
        </div>
        <p className="text-slate-900 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Initializing System...</p>
      </div>
    </div>
  );

  if (!user && !isGuest) {
    return (
      <PublicLandingView 
        onLogin={handleLogin}
        onGuestMode={handleGuestMode}
        onExplore={() => {
          handleGuestMode();
        }}
        onPrivacyOpen={() => setIsPrivacyOpen(true)}
        onDisclaimerOpen={() => setIsDisclaimerOpen(true)}
        loading={loading}
      />
    );
  }


  return (
    <div className={`h-screen flex flex-col bg-[var(--apple-bg)] font-sans text-white overflow-hidden w-full relative transition-colors duration-500`}>
      {/* SaaS Aurora Background */}
      <div className={`aurora-blur ${theme === 'night' ? 'opacity-20' : 'opacity-40'}`}>
          <div className="aurora-blob aurora-1"></div>
          <div className="aurora-blob aurora-2"></div>
          <div className="aurora-blob aurora-3"></div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>

      {/* In-App Notification Banner */}
      {inAppNotification && (
        <div className="fixed top-24 right-6 z-[200] animate-apple">
          <div className="bg-[var(--primary)] text-white rounded-xl shadow-2xl border border-white/20 p-5 max-w-md backdrop-blur-xl flex items-start gap-4 min-w-[340px]">
            <div className="flex-shrink-0 p-3 bg-white/20 rounded-lg">
              <span className="material-symbols-outlined">campaign</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base mb-1 tracking-tight">{inAppNotification.title}</h4>
              <p className="text-sm text-white/90 font-medium line-clamp-2">{inAppNotification.body}</p>
            </div>
            <button
              onClick={() => setInAppNotification(null)}
              className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Announcement Ticker Removed */}

      <div className="flex h-full overflow-hidden pb-[64px] lg:pb-0">
        {/* Sidebar Navigation */}
        {[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS, ViewMode.BATCH_LANDING, ViewMode.INSTRUCTOR_CONSOLE, ViewMode.BATCH_ADMIN].includes(viewMode) && (
          <aside className="w-64 border-r border-white/5 flex flex-col bg-[var(--apple-sidebar-bg)] backdrop-blur-3xl shrink-0 hidden lg:flex transition-colors duration-500">
            <div className="p-8 flex items-center gap-4 cursor-pointer group" onClick={() => { setViewMode(ViewMode.BATCHES); navigate('/'); }}>
              <div className="size-10 bg-[var(--apple-card-bg)] border border-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <BatchWiseLogo className="w-6 h-6 transition-transform duration-500 group-hover:rotate-[360deg]" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-[var(--apple-text)] uppercase italic">Batch<span className="text-[var(--primary)]">Wise</span></h1>
            </div>
            <nav className="flex-1 px-4 space-y-4 overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <button
                  onClick={() => { setViewMode(ViewMode.BATCHES); navigate('/'); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.BATCHES ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                >
                  <span className="material-symbols-outlined text-center scale-110">dashboard</span> Dashboard
                </button>
                <button
                  onClick={() => { setViewMode(ViewMode.LIBRARY); navigate('/library'); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.LIBRARY ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                >
                  <span className="material-symbols-outlined text-center scale-110">library_books</span> {activeBatch ? terms.library : 'Library'}
                </button>
                <button
                  onClick={() => setShowComingSoon(true)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]`}
                >
                  <span className="material-symbols-outlined text-center scale-110">quiz</span> Mock Tests
                </button>
                <button
                  onClick={() => { setViewMode(ViewMode.SETTINGS); navigate('/settings'); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.SETTINGS ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                >
                  <span className="material-symbols-outlined text-center scale-110">person</span> Profile
                </button>
                <button
                  onClick={() => { setViewMode(ViewMode.MARKETPLACE); navigate('/marketplace'); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.MARKETPLACE ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                >
                  <span className="material-symbols-outlined text-center scale-110">explore</span> Discover
                </button>
              </div>

              {isInstructor && (
                <div className="pt-6">
                  <p className="px-4 text-[8px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.3em] mb-4">Admin</p>
                  <div className="space-y-1">
                      <button
                        onClick={() => { setViewMode(ViewMode.ACCESS_REQUESTS); navigate('/access-requests'); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.ACCESS_REQUESTS ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                      >
                        <span className="material-symbols-outlined text-center scale-110">group_add</span> Access Requests
                      </button>
                      <button
                        onClick={() => { setViewMode(ViewMode.INSTRUCTOR_CONSOLE); navigate('/instructor'); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.INSTRUCTOR_CONSOLE ? 'bg-amber-500/10 text-amber-500 shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                      >
                        <span className="material-symbols-outlined text-center scale-110">shield_person</span> Instructor Panel
                      </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setViewMode(ViewMode.ADMIN); navigate('/admin'); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === ViewMode.ADMIN ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner' : 'text-[var(--apple-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--apple-text)]'}`}
                      >
                        <span className="material-symbols-outlined text-center scale-110">admin_panel_settings</span> Management Portal
                      </button>
                    )}
                  </div>
                </div>
              )}
            </nav>
            <div className="px-5 py-2 mt-4 space-y-2">
              <button
                onClick={() => setIsSupportSamosaOpen(true)}
                className="w-full relative group p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all text-left overflow-hidden active:scale-[0.98]"
              >
                <div className="relative z-10">
                  <h4 className="text-[11px] font-bold text-white mb-1">Buy me a Samosa 🥟</h4>
                  <p className="text-[9px] text-slate-500 font-medium">Support development</p>
                </div>
              </button>
            </div>
            <div className="p-6 mt-auto">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="size-10 rounded-xl bg-slate-900 overflow-hidden ring-1 ring-white/10 relative">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'U'}&backgroundColor=1e293b`} alt="User Profile" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-bold text-[var(--apple-text)] truncate">{user?.displayName || (isGuest ? "Guest User" : "Lead Student")}</p>
                  <p className="text-[8px] text-[var(--primary)] font-black uppercase tracking-[0.1em]">{isAdmin ? "Lead Instructor" : "student"}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Log Out">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden relative lg:border-l lg:border-[var(--apple-border)] bg-[var(--apple-bg)] transition-colors duration-300">
          {/* Mobile Top Header */}
          {[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS, ViewMode.BATCH_LANDING].includes(viewMode) && (
            <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-[var(--apple-header-bg)] border-b border-white/5 sticky top-0 z-[50]">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-center">
                  <BatchWiseLogo className="w-5 h-5" />
                </div>
                <h1 className="text-lg font-black tracking-tighter text-[var(--apple-text)] uppercase italic">Batch<span className="text-[var(--primary)]">Wise</span></h1>
              </div>
              <div className="flex items-center gap-1">
                {(() => {
                  const allSessions = data.flatMap(b => b.sessions || []);
                  const streak = calculateStreak(allSessions);
                  if (streak.count === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 animate-in fade-in slide-in-from-right-4">
                      <span className="material-symbols-outlined text-[14px] text-orange-500 fill-orange-500">local_fire_department</span>
                      <span className="text-[11px] font-black text-orange-500">{streak.count}</span>
                    </div>
                  );
                })()}
                <div className="relative">
                  <button 
                    onClick={() => {
                        setIsNotificationPanelOpen(!isNotificationPanelOpen);
                        if (!isNotificationPanelOpen) {
                            localStorage.setItem('last_read_notif', Date.now().toString());
                            setHasUnreadNotifications(false);
                        }
                    }} 
                    className="size-10 flex items-center justify-center text-slate-400 relative hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    {hasUnreadNotifications && <span className="absolute top-2 right-2 size-2 bg-[var(--primary)] rounded-full border border-[#0b0f1a]" />}
                  </button>

                  {isNotificationPanelOpen && (
                    <div className="fixed md:absolute top-20 md:top-full left-4 right-4 md:left-auto md:right-0 mt-2 md:mt-4 md:w-80 bg-[#0d0f14]/98 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] z-[500] overflow-hidden animate-apple border-t-white/20">
                      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-1 opacity-80">Tactical Feed</span>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Intelligence Briefing</h3>
                        </div>
                        <button onClick={() => setIsNotificationPanelOpen(false)} className="size-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all hover:bg-white/10 group active:scale-90">
                            <XIcon size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                      </div>
                      <div className="max-h-[60vh] md:max-h-[440px] overflow-y-auto no-scrollbar bg-black/20">
                        {(() => {
                          const combined = [
                            ...notifications.map(n => ({ ...n, type: 'global' })),
                            ...batchNotifications.map(n => ({ ...n, type: 'batch' }))
                          ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                          return combined.length > 0 ? (
                            combined.map((n, i) => (
                              <div key={n.id || i} className={`p-6 border-b border-white/5 hover:bg-white/[0.04] transition-all cursor-default relative group ${n.type === 'batch' ? 'bg-amber-500/[0.03]' : ''}`}>
                                {n.type === 'batch' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />}
                                <div className="flex gap-4">
                                    <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 ${n.type === 'batch' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                        <span className="material-symbols-outlined text-lg">{n.type === 'batch' ? 'campaign' : 'insights'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${n.type === 'batch' ? 'text-amber-500' : 'text-blue-500'}`}>
                                                {n.type === 'batch' ? 'Batch Alert' : 'Global Intel'}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase">
                                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Now'}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-white leading-tight mb-1.5 group-hover:text-[var(--primary)] transition-colors line-clamp-2">{n.title || n.text}</h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-3 group-hover:text-slate-400 transition-colors">{n.body || n.text}</p>
                                    </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-20 px-8 text-center flex flex-col items-center">
                              <div className="size-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border border-[var(--primary)]/20 animate-ping opacity-20" />
                                <span className="material-symbols-outlined text-slate-800 text-5xl">notifications_off</span>
                              </div>
                              <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-3">Frequency Clear</h4>
                              <p className="text-[10px] text-slate-600 leading-relaxed font-bold uppercase tracking-widest max-w-[180px] mx-auto">No tactical updates detected in your sector.</p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="p-5 bg-white/[0.02] text-center border-t border-white/5">
                        <button onClick={() => { setIsAnnouncementHistoryOpen(true); setIsNotificationPanelOpen(false); }} className="w-full py-4 text-[10px] font-black text-white uppercase tracking-[0.2em] hover:brightness-125 transition-all bg-gradient-to-r from-[var(--primary)] to-slate-800 rounded-2xl shadow-lg shadow-[var(--primary)]/10 active:scale-[0.98]">Archive Protocol</button>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    if (isInstructor && window.innerWidth < 1024) {
                      setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen);
                    } else {
                      setViewMode(ViewMode.SETTINGS);
                      navigate('/settings');
                    }
                  }}
                  className="size-8 rounded-lg bg-slate-900 border border-white/10 overflow-hidden ring-1 ring-white/5 mx-2 hover:scale-105 active:scale-95 transition-all outline-none"
                >
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'U'}&backgroundColor=1e293b`} className="w-full h-full object-cover" alt="Profile" />
                </button>
              </div>
            </header>
          )}

          {/* Top Navigation */}
          {[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS, ViewMode.BATCH_LANDING].includes(viewMode) && (
            <header className="h-14 border-b border-[var(--apple-border)] hidden lg:flex items-center justify-between px-8 bg-[var(--apple-header-bg)] sticky top-0 z-[40] shrink-0 transition-colors duration-500">
              <div className="flex items-center gap-3 text-[11px] font-medium tracking-tight">
                <button onClick={() => { setViewMode(ViewMode.BATCHES); navigate('/'); }} className="text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] transition-colors">Home</button>
                <span className="text-slate-800">›</span>
                <span className="text-[var(--apple-text)] font-bold opacity-90 uppercase tracking-widest text-[9px]">
                  {viewMode === ViewMode.BATCHES ? "home" : viewMode === ViewMode.ACCESS_REQUESTS ? "Access Requests" : viewMode === ViewMode.BATCH_LANDING ? "Batch Details" :
                    viewMode === ViewMode.ADMIN ? "Management Portal" :
                      viewMode === ViewMode.SETTINGS ? "Profile & Protocol" :
                        viewMode.replace('-', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <SyncStatusIndicator 
                  status={syncStatus} 
                  lastSyncTime={lastSyncTime} 
                  user={user} 
                  isGuest={isGuest} 
                  onSync={handleManualSync} 
                />

                {(() => {
                  const allSessions = data.flatMap(b => b.sessions || []);
                  const streak = calculateStreak(allSessions);
                  if (streak.count === 0) return null;
                  return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-all group cursor-default">
                      <div className="size-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[16px] fill-orange-500">local_fire_department</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-orange-500 leading-none">{streak.count} DAY STREAK</span>
                        <span className="text-[8px] font-bold text-orange-500/60 uppercase tracking-widest">{streak.isAtRisk ? 'Keep it alive!' : 'Consistent!'}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-4">
                  <button onClick={() => setIsInfoOpen(true)} className="text-slate-500 hover:text-white transition-colors" title="Documentation">
                    <span className="material-symbols-outlined text-[20px]">help_outline</span>
                  </button>
                  <button onClick={() => setIsAnalyticsOpen(true)} className="text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                  </button>
                  <button 
                    onClick={() => setIsSupportSamosaOpen(true)} 
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all group relative"
                    title="Energize the Developer (Samosa Protocol)"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover:scale-125 transition-transform">restaurant</span>
                    <span className="absolute -top-1 -right-1 size-2 bg-rose-500 rounded-full animate-ping" />
                  </button>

                  <div className="relative">
                    <button onClick={() => {
                        setIsNotificationPanelOpen(!isNotificationPanelOpen);
                        if (!isNotificationPanelOpen) {
                            localStorage.setItem('last_read_notif', Date.now().toString());
                            setHasUnreadNotifications(false);
                        }
                    }} className={`text-slate-500 hover:text-white transition-colors relative ${isNotificationPanelOpen ? 'text-white' : ''}`}>
                      <span className="material-symbols-outlined text-[20px]">notifications</span>
                      {hasUnreadNotifications && <span className="absolute -top-1 -right-1 size-2 bg-[var(--primary)] rounded-full border border-black shadow-[0_0_8px_rgba(218,11,11,0.5)] animate-pulse" />}
                    </button>

                    {isNotificationPanelOpen && (
                      <div className="absolute top-full right-0 mt-4 w-80 bg-[#0b0f1a] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-apple">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intelligence Briefing</span>
                          <button onClick={() => setIsNotificationPanelOpen(false)} className="text-slate-600 hover:text-white transition-colors"><XIcon size={14} /></button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                          {(() => {
                            const combined = [
                              ...notifications.map(n => ({ ...n, type: 'global' })),
                              ...batchNotifications.map(n => ({ ...n, type: 'batch' }))
                            ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                            return combined.length > 0 ? (
                              combined.map((n, i) => (
                                <div key={n.id || i} className={`p-4 border-b border-white/5 hover:bg-white/[0.01] transition-colors ${n.type === 'batch' ? 'bg-[var(--primary)]/5' : ''}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {n.type === 'batch' && <span className="material-symbols-outlined text-[10px] text-amber-500">campaign</span>}
                                    <h4 className="text-[11px] font-bold text-white">{n.title || n.text}</h4>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{n.body || n.text}</p>
                                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="py-12 text-center">
                                <span className="material-symbols-outlined text-slate-800 text-4xl mb-4">notifications_off</span>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Active Updates</p>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="p-3 bg-black/40 text-center">
                          <button onClick={() => { setIsAnnouncementHistoryOpen(true); setIsNotificationPanelOpen(false); }} className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest hover:brightness-125 transition-all">Archive Protocol</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Global Progress</span>
                  <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-tight">{calculateAnalytics().percentage}% COMPLETE</span>
                </div>
              </div>
            </header>
          )}

          <div className={`flex-1 flex flex-col relative z-10 w-full overflow-y-auto no-scrollbar min-h-0 ${[ViewMode.STUDIO, ViewMode.SEARCH_LAB, ViewMode.MARKETPLACE, ViewMode.LIBRARY].includes(viewMode) ? '' : 'p-4 md:p-6 md:max-w-7xl md:mx-auto w-full'}`}>
            {viewMode === ViewMode.BATCHES && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                  <div className="lg:col-span-12">
                    <OneTapResume data={data} onNavigate={(bId, sId, cId, lId) => {
                      setActiveBatchId(bId);
                      setActiveSubjectId(sId);
                      setActiveChapterId(cId);
                      setActiveLectureId(lId);
                      setViewMode(ViewMode.LECTURE_PLAYER);
                      navigate(`/batch/${bId}/player`);
                    }} />
                  </div>
                </div>

                <div className="pt-4">
                   <section className="animate-apple">
                     <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                       <div>
                         <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">My Batches</h1>
                         <p className="text-slate-400 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">Your study batches and course materials.</p>
                       </div>
                       {isInstructor && (
                         <button onClick={() => { setViewMode(ViewMode.INSTRUCTOR_CONSOLE); navigate('/instructor'); }} className="flex items-center gap-4 px-8 py-4 rounded-3xl bg-amber-600/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all group shrink-0 shadow-lg shadow-amber-900/5">
                           <div className="flex flex-col items-start">
                             <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">Instructor Console</span>
                           </div>
                         </button>
                       )}
                     </div>

                    <div className="mb-8">
                      <GoalDashboard userId={user?.uid || ''} completedCount={calculateAnalytics().completedLectures} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {data.map((batch) => {
                            const total = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.length, 0), 0);
                            const done = batch.subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.lectures.filter(l => l.completed).length, 0), 0);
                            const perc = total === 0 ? 0 : Math.round((done / total) * 100);
                            const subjectCount = batch.subjects.length;
                            const terms = getTerminology(batch.genre);
                            return (
                              <div key={batch.id} className="rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[var(--primary)]/30 transition-all cursor-pointer group hover:-translate-y-1 duration-300 relative overflow-hidden" onClick={() => { setActiveBatchId(batch.id); setViewMode(ViewMode.SUBJECTS); navigate(`/batch/${batch.id}`); }}>
                                {/* Banner */}
                                <div className="relative h-40 bg-slate-900 overflow-hidden">
                                  {batch.theme?.coverImage ? (
                                    <img src={batch.theme.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                      <span className="text-3xl">{batch.genre === 'creative' ? '🎨' : batch.genre === 'skill' ? '🛠️' : '📚'}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  {/* Progress badge */}
                                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-sm" style={{ color: perc === 100 ? '#22c55e' : 'var(--primary)' }}>
                                    {perc}%
                                  </div>
                                  {/* Actions */}
                                  <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingSettingsBatchId(batch.id); }} className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-white/20 transition-all text-[10px]" title="Settings">
                                      <SettingsIcon size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleRenameBatch(batch.id, batch.name); }} className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-white/20 transition-all text-[10px]" title="Rename">
                                      <EditIcon size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${batch.name}"?`)) handleDeleteBatch(batch.id); }} className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-red-400 hover:bg-red-500/30 transition-all text-[10px]" title="Delete">
                                      <TrashIcon size={14} />
                                    </button>
                                  </div>
                                  {/* Batch name on banner */}
                                  <div className="absolute bottom-3 left-3 right-3">
                                    <h3 className="text-sm font-bold text-white truncate drop-shadow-lg">{batch.name}</h3>
                                  </div>
                                </div>
                                {/* Stats */}
                                <div className="p-5">
                                  <p className="text-[11px] text-slate-500 font-medium mb-3">{subjectCount} {subjectCount === 1 ? terms.subject : terms.subjectPlural} · {total} {total === 1 ? terms.lecture.toLowerCase() : terms.lecturePlural.toLowerCase()}</p>
                                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${perc}%`, background: perc === 100 ? '#22c55e' : 'var(--primary)' }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div onClick={handleCreateBatch} className="border-2 border-dashed border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all min-h-[100px]">
                            <PlusIcon className="w-6 h-6 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase mt-2">New Batch</span>
                          </div>
                        </div>
                    </section>
                </div>
              </div>
            )}

            {viewMode === ViewMode.SUBJECTS && activeBatch && (
              <section className="animate-apple pt-4">
                <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-xl">
                  <nav className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <button onClick={() => { setViewMode(ViewMode.BATCHES); setActiveBatchId(null); navigate('/'); }} className="hover:text-primary transition-all">Home</button>
                    <span className="opacity-20">/</span>
                    <span className="text-slate-300">{activeBatch.name}</span>
                  </nav>
                  
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight">{activeBatch.name}</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-medium text-slate-500">by {activeBatch.creatorName || 'You'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {activeBatch.inviteCode && activeBatch.creatorId !== user?.uid && (
                        <button 
                          onClick={() => handleSyncBatchWithSource(activeBatch)}
                          className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center gap-2"
                          title="Fetch latest curriculum updates from the master node"
                        >
                          <span className="material-symbols-outlined text-sm">sync</span>
                          Sync Nodes
                        </button>
                      )}
                      <button
                        onClick={() => setShowScheduleCalendar(true)}
                        className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        Schedule
                      </button>
                      <button 
                         onClick={() => setIsMessagingOpen(true)}
                         className="px-5 py-3 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/20 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">forum</span>
                        Contact Instructor
                       </button>
                      <button
                        onClick={() => setCertificateTargetBatchId(activeBatch.id)}
                        className="px-5 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Certificate
                      </button>
                 </div>
               </div>
             </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeBatch.subjects.map((subject, index) => (
                    <div key={subject.id} onClick={() => navigate(`/batch/${activeBatch.id}/subject/${subject.id}`)} className="glass-card rounded-2xl border-white/5 hover:border-rose-500/30 p-4 transition-all group cursor-pointer flex flex-col relative hover:-translate-y-1 duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                          <span className="text-lg font-bold">{getSubjectEmoji(subject.name)}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleRenameSubject(subject.id, subject.name); }} className="p-2 text-slate-500 hover:text-white transition-colors"><EditIcon size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><TrashIcon size={14} /></button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{subject.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">{subject.chapters.length} {subject.chapters.length === 1 ? terms.chapter : terms.chapters}</div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Enter {terms.subject}</span>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-[var(--primary)] group-hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleAddSubject} className="group border-2 border-dashed border-white/5 hover:border-[var(--primary)]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-white/[0.02] min-h-[140px]">
                    <PlusIcon className="w-6 h-6 text-slate-500 group-hover:text-[var(--primary)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Add {terms.subject}</span>
                  </button>
                </div>
          </section>
        )}



            {viewMode === ViewMode.CHAPTERS && activeBatch && activeSubject && (
              <section className="animate-apple pt-4">
                <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-xl">
                  <nav className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <button onClick={() => navigate('/')} className="hover:text-primary transition-all">Home</button>
                    <span className="opacity-20">/</span>
                    <button onClick={() => navigate(`/batch/${activeBatchId}`)} className="hover:text-primary transition-all">{activeBatch.name}</button>
                    <span className="opacity-20">/</span>
                    <span className="text-slate-300">{activeSubject.name}</span>
                  </nav>
                  <h1 className="text-xl font-bold tracking-tight uppercase">Curriculum <span className="text-[var(--primary)]">{terms.chapters}</span></h1>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{activeSubject.name} Hub</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleAISuggestChapters} disabled={loading} className="bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[var(--primary)]/20 transition-all font-black text-[9px] uppercase tracking-widest">AI Optimizer</button>
                    <button onClick={handleAddChapter} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest">Add {terms.chapter}</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeSubject.chapters.map((chapter) => {
                    const total = chapter.lectures.length;
                    const completed = chapter.lectures.filter(l => l.completed).length;
                    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
                    return (
                      <div key={chapter.id} className="glass-card rounded-2xl border-white/5 hover:border-rose-500/10 p-4 transition-all group flex flex-col relative hover:-translate-y-1 duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${percent === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{terms.chapter.toUpperCase()} UNIT</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleRenameChapter(chapter.id, chapter.name); }} className="p-1.5 text-slate-500 hover:text-white transition-colors"><EditIcon size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.id); }} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"><TrashIcon size={14} /></button>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">{chapter.name}</h3>
                        <div className="mt-auto space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{completed}/{total} {terms.lecturePlural.toUpperCase()}</span>
                            <span className="text-[10px] font-black text-[var(--primary)]">{percent}%</span>
                          </div>
                          <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--primary)] transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(218,11,11,0.5)]" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-3">
                            <button onClick={() => { setActiveChapterId(chapter.id); setViewMode(ViewMode.LECTURES); navigate(`/batch/${activeBatch.id}/subject/${activeSubject.id}/chapter/${chapter.id}`); }} className="p-2 rounded-lg bg-slate-900 hover:bg-[var(--primary)] text-slate-500 hover:text-white transition-all border border-white/5" title={"Open " + terms.lecturePlural}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                            <button onClick={() => navigate(`/youtube-import?batch=${activeBatch.id}&subject=${activeSubject.id}&chapter=${chapter.id}`)} className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all border border-white/5" title="YouTube Import"><YoutubeIcon size={14} className="mx-auto" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}


            {viewMode === ViewMode.ADMIN && (
              <AdminPage
                onBack={() => setViewMode(ViewMode.BATCHES)}
                libraryResources={libraryResources}
              />
            )}

            {viewMode === ViewMode.LIBRARY && <LibraryView />}
            {viewMode === ViewMode.SETTINGS && <ProfileSettingsView />}

            {viewMode === ViewMode.NOTIFICATIONS && <NotificationsView notifications={notifications} />}
            {viewMode === ViewMode.MARKETPLACE && (
              <MarketplaceView
                batches={marketplaceBatches}
                onImport={(batch) => {
                  setSelectedMarketplaceBatch(batch);
                  setViewMode(ViewMode.BATCH_LANDING);
                  navigate(`/marketplace/node/${batch.id}`); 
                }}
                onBack={() => setViewMode(ViewMode.BATCHES)}
              />
            )}
            {viewMode === ViewMode.BATCH_LANDING && selectedMarketplaceBatch && (
              <BatchLandingView
                batch={selectedMarketplaceBatch}
                currentUser={user}
                onImportFree={() => {
                  handleImportBatchByCode(selectedMarketplaceBatch.inviteCode || selectedMarketplaceBatch.id, true);
                  setViewMode(ViewMode.BATCHES);
                }}
                isEnrolled={data.some(b => b.inviteCode === (selectedMarketplaceBatch.inviteCode || selectedMarketplaceBatch.id) || b.id === selectedMarketplaceBatch.id)}
                onProceed={() => {
                  setActiveBatchId(data.find(b => b.inviteCode === (selectedMarketplaceBatch.inviteCode || selectedMarketplaceBatch.id) || b.id === selectedMarketplaceBatch.id)?.id || null);
                  setViewMode(ViewMode.SUBJECTS);
                }}
                onBack={() => {
                  const isAlreadyInLibrary = data.some(b => b.inviteCode === (selectedMarketplaceBatch.inviteCode || selectedMarketplaceBatch.id) || b.id === selectedMarketplaceBatch.id);
                  if (isAlreadyInLibrary) {
                    setViewMode(ViewMode.BATCHES);
                  } else {
                    setViewMode(ViewMode.MARKETPLACE);
                  }
                  setSelectedMarketplaceBatch(null);
                }}
              />
            )}
            {viewMode === ViewMode.ACCESS_REQUESTS && (
              <AccessRequestsView
                currentUser={user}
                onBack={() => setViewMode(ViewMode.BATCHES)}
              />
            )}
            {viewMode === ViewMode.YOUTUBE_IMPORT && (
              <YoutubeImportView
                batches={data}
                initialBatchId={activeBatchId || undefined}
                initialSubjectId={activeSubjectId || undefined}
                initialChapterId={activeChapterId || undefined}
                onImport={async (bId, sId, cId, videos) => {
                  const newLectures: Lecture[] = videos.map((v, i) => ({
                    id: `l_${Date.now()}_${i}`,
                    title: v.title,
                    youtubeUrl: v.youtubeUrl,
                    embedUrl: v.youtubeUrl.replace('watch?v=', 'embed/').split('&')[0],
                    completed: false,
                    duration: v.duration,
                    description: v.description || ""
                  }));
                  setData(prev => prev.map(b => b.id === bId ? {
                    ...b,
                    isDirty: true,
                    subjects: b.subjects.map(s => s.id === sId ? {
                      ...s,
                      chapters: s.chapters.map(c => c.id === cId ? {
                        ...c,
                        lectures: [...c.lectures, ...newLectures]
                      } : c)
                    } : s)
                  } : b));
                  setViewMode(ViewMode.LECTURES);
                  setActiveBatchId(bId);
                  setActiveSubjectId(sId);
                  setActiveChapterId(cId);
                  alert(`Imported ${videos.length} sessions.`);
                }}
                onBack={() => setViewMode(ViewMode.CHAPTERS)}
              />
            )}



            {viewMode === ViewMode.SEARCH_LAB && activeBatchId && activeSubjectId && activeChapterId && (
              <div className="fixed inset-0 z-[2000] bg-[#0F0F0F]">
                <SearchYoutubeModal
                  onClose={() => {
                    setViewMode(ViewMode.LECTURES);
                    navigate(`/batch/${activeBatchId}/subject/${activeSubjectId}/chapter/${activeChapterId}`);
                  }}
                  onAdd={(videos) => {
                    const newLectures: Lecture[] = videos.map((video, index) => ({
                      id: `l_${Date.now()}_${index}`,
                      title: video.title,
                      youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
                      embedUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1&enablejsapi=1`,
                      completed: false,
                      duration: video.duration,
                      description: (video as any).description || ""
                    }));

                    setData(prev => prev.map(b => b.id === activeBatchId ? {
                      ...b,
                      isDirty: true,
                      subjects: b.subjects.map(s => s.id === activeSubjectId ? {
                        ...s,
                        chapters: s.chapters.map(c => c.id === activeChapterId ? {
                          ...c,
                          lectures: [...c.lectures, ...newLectures]
                        } : c)
                      } : s)
                    } : b));
                    alert(`Added ${videos.length} sessions to curriculum node.`);
                  }}
                />
              </div>
            )}

            {viewMode === ViewMode.BATCHES && (
              !isFooterHidden ? (
                <BriefFooter
                  user={user}
                  isAdmin={isAdmin}
                  onShowDisclaimer={() => setIsDisclaimerOpen(true)}
                  onShowPrivacy={() => setIsPrivacyOpen(true)}
                  onHide={() => setIsFooterHidden(true)}
                />
              ) : (
                <div className="py-12 flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => setIsFooterHidden(false)}
                     className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-[var(--primary)] transition-colors flex items-center gap-2"
                   >
                     <span className="material-symbols-outlined text-sm">unfold_more</span>
                     Show Knowledge Nexus
                   </button>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {viewMode === ViewMode.LECTURES && activeSubject && activeChapter && (() => {
        const activeLecture = activeChapter.lectures.find(l => l.id === activeLectureId) || activeChapter.lectures[0];
        return activeChapter.lectures.length > 0 ? (
          <div className="fixed inset-0 z-[100] bg-black overflow-auto">
            <LectureView
              subject={activeSubject}
              chapter={activeChapter}
              lecture={activeLecture}
              currentUser={user}
              isInstructor={isInstructor}
              onLectureNavigate={(cId, lId) => {
                setActiveChapterId(cId);
                setActiveLectureId(lId);
              }}
              onToggleComplete={(lId) => toggleLecture(lId)}
              onBack={() => {
                setViewMode(ViewMode.CHAPTERS);
                navigate(`/batch/${activeBatchId}/subject/${activeSubjectId}`);
              }}
              genre={activeBatch?.genre}
            />
          </div>
        ) : (
          <div className="fixed inset-0 z-[100] bg-[var(--apple-bg)] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No {terms.lecturePlural} Found</h3>
            <p className="text-slate-400 text-sm mb-6 text-center max-w-sm">This {terms.chapter.toLowerCase()} has no {terms.lecturePlural.toLowerCase()} yet. Add one below.</p>
            <div className="flex gap-4">
              <button onClick={() => handleAddLecture(activeChapter.id)} className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[var(--primary)]/20">Add {terms.lecture}</button>
              <button onClick={() => { setViewMode(ViewMode.CHAPTERS); navigate(`/batch/${activeBatchId}/subject/${activeSubjectId}`); }} className="bg-white/5 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5">← Back</button>
            </div>
          </div>
        );
      })()}

      {viewMode === ViewMode.INSTRUCTOR_CONSOLE && (
        <div className="fixed inset-0 z-[100] bg-black overflow-auto">
            <InstructorConsoleView
              batches={data.filter(b => b.creatorId === user?.uid || (!b.creatorId && !b.id.includes('imported')))}
              onManageBatch={(id) => {
                setActiveBatchId(id);
                setViewMode(ViewMode.BATCH_ADMIN);
                navigate(`/batch/${id}/admin`);
              }}
              onAccessRequests={() => {
                setViewMode(ViewMode.ACCESS_REQUESTS);
                navigate('/access-requests');
              }}
              onBack={() => {
                setViewMode(ViewMode.BATCHES);
                navigate('/');
              }}
            />
        </div>
      )}

      {viewMode === ViewMode.BATCH_ADMIN && activeBatch && (
        <div className="fixed inset-0 z-[100] bg-black overflow-auto">
          <BatchAdminView
            batch={activeBatch}
            onBack={() => {
              setViewMode(ViewMode.BATCHES);
              navigate('/');
            }}
            setLoading={setLoading}
            onUpdateBatch={handleUpdateBatchContent}
          />
        </div>
      )}

      {viewMode === ViewMode.STUDIO && activeSubject && activeChapter && (() => {
        const activeLectureForStudio = activeChapter.lectures.find(l => l.id === activeLectureId) || activeChapter.lectures[0];
        return (
          <div className="fixed inset-0 z-[100] bg-black overflow-auto">
            <StudioView
              subject={activeSubject}
              chapter={activeChapter}
              lecture={activeLectureForStudio}
              onLectureNavigate={(cId, lId) => {
                setActiveChapterId(cId);
                setActiveLectureId(lId);
              }}
              onToggleComplete={(lId) => toggleLecture(lId)}
              onBack={() => {
                setViewMode(ViewMode.CHAPTERS);
                navigate(`/batch/${activeBatchId}/subject/${activeSubjectId}`);
              }}
              onAddLecture={() => handleAddLecture(activeChapter.id)}
              onYoutubeImport={() => {
                navigate(`/youtube-import?batch=${activeBatchId}&subject=${activeSubjectId}&chapter=${activeChapter.id}`);
              }}
            />
          </div>
        );
      })()}

      {isAnalyticsOpen && <GlobalAnalyticsModal />}
      {isPrivacyOpen && <PrivacyPolicyModal />}
      {isDisclaimerOpen && <DisclaimerModal />}
      {isInfoOpen && <InformationModal onClose={() => setIsInfoOpen(false)} />}

      {isShareSettingsOpen && activeBatchId && (
        <ShareSettingsModal
          batch={data.find(b => b.id === activeBatchId)!}
          currentUser={user}
          onClose={() => setIsShareSettingsOpen(false)}
          onSave={(updated) => handleUpdateBatchSharing(updated)}
          onSendNotification={(title, body) => {
            const batch = data.find(b => b.id === activeBatchId);
            if (batch && batch.inviteCode) {
              handleBroadcastNotification(batch.inviteCode, title, body);
            }
          }}
          onRevokeAccess={async (reqId) => {
            if (window.confirm("Are you sure you want to revoke this user's access? They will lose sync immediately.")) {
              await revokeBatchAccess(reqId);
            }
          }}
          onRegenerateCode={() => {
            const newCode = generateInviteCode();
            setData(prev => prev.map(b => b.id === activeBatchId ? { ...b, inviteCode: newCode, isDirty: true } : b));
          }}
        />
      )}

      {editingSettingsBatchId && (
        <BatchSettingsModal
          batch={data.find(b => b.id === editingSettingsBatchId)!}
          onClose={() => setEditingSettingsBatchId(null)}
          onSave={handleSaveSettings}
        />
      )}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-apple">
          <div className="apple-card w-full max-w-lg shadow-2xl relative border border-[var(--apple-border)] overflow-hidden">
            <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-[var(--apple-text)]">{modal.title}</h3>
            {modal.message && <p className="text-[var(--apple-text-secondary)] font-medium text-sm leading-relaxed mb-8">{modal.message}</p>}
            {(modal.type === 'prompt') && (
              <input autoFocus type="text" defaultValue={modal.initialValue} placeholder={modal.placeholder} id="modal-input" className="apple-input mb-8" />
            )}
            {(modal.type === 'create-batch') && (
              <div className="space-y-6 mb-8 text-left">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--apple-text-secondary)] mb-2 block">Cohort Name</label>
                  <input autoFocus type="text" id="create-batch-name" placeholder="e.g. Cinema-grade Video Editing or AI Tools Mastery" className="apple-input" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--apple-text-secondary)] mb-3 block">Choose Cohort Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setCreateBatchGenre('study')}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
                        createBatchGenre === 'study' 
                          ? 'border-[var(--apple-accent)] bg-[var(--apple-accent)]/10 shadow-[0_0_20px_rgba(0,122,255,0.15)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">📚</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${createBatchGenre === 'study' ? 'border-[var(--apple-accent)]' : 'border-slate-600'}`}>
                          {createBatchGenre === 'study' && <div className="w-2 h-2 rounded-full bg-[var(--apple-accent)]" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--apple-text)]">Academic Batch</h4>
                        <p className="text-[10px] text-[var(--apple-text-secondary)] mt-1 leading-relaxed">Perfect for exam prep, school, university, or structured courses.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setCreateBatchGenre('skill')}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
                        createBatchGenre === 'skill'
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                          : 'border-white/5 bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">🛠️</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${createBatchGenre === 'skill' ? 'border-[#8B5CF6]' : 'border-slate-600'}`}>
                          {createBatchGenre === 'skill' && <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--apple-text)]">Skill Course</h4>
                        <p className="text-[10px] text-[var(--apple-text-secondary)] mt-1 leading-relaxed">For AI tools, video editing, coding, design, or any skill you want to master.</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setCreateBatchGenre('creative')}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
                        createBatchGenre === 'creative' 
                          ? 'border-[#FF2D55] bg-[#FF2D55]/10 shadow-[0_0_20px_rgba(255,45,85,0.15)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">🎨</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${createBatchGenre === 'creative' ? 'border-[#FF2D55]' : 'border-slate-600'}`}>
                          {createBatchGenre === 'creative' && <div className="w-2 h-2 rounded-full bg-[#FF2D55]" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--apple-text)]">Creative Masterclass</h4>
                        <p className="text-[10px] text-[var(--apple-text-secondary)] mt-1 leading-relaxed">For design, video editing, music, coding, or arts cohorts.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(modal.type === 'add-lecture') && (
              <div className="space-y-4 mb-8">
                <input autoFocus type="text" id="modal-title" placeholder="Descriptive Session Label" className="apple-input" />
                <input type="text" id="modal-url" placeholder="Paste Video Link (YouTube, Shorts, Live)" className="apple-input" />
              </div>
            )}
            {(modal.type === 'import-playlist') && (
              <div className="space-y-4 mb-8">
                <input autoFocus type="text" id="modal-url" placeholder="Paste YouTube Playlist URL" className="apple-input" />
              </div>
            )}
            {(modal.type === 'import-csv') && (
              <div className="space-y-4 mb-8">
                <div className="apple-card bg-black/5 dark:bg-white/5 p-6 border-dashed border-2 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    id="modal-csv-file"
                    accept=".csv,text/csv"
                    className="text-xs file:apple-button-primary file:mr-4 file:text-[10px]"
                  />
                </div>
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--apple-text-secondary)] mb-2">CSV Format Example:</p>
                  <pre className="text-[10px] text-[var(--apple-text)] font-mono opacity-80">
                    title,url
                    Lecture 1,https://youtube.com/watch?v=...
                    Lecture 2,https://youtube.com/watch?v=...
                  </pre>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={() => {
                const val = (document.getElementById('modal-input') as HTMLInputElement)?.value;
                const title = (document.getElementById('modal-title') as HTMLInputElement)?.value;
                const url = (document.getElementById('modal-url') as HTMLInputElement)?.value;
                const fileInput = (document.getElementById('modal-csv-file') as HTMLInputElement);
                const file = fileInput?.files?.[0];
                const createBatchName = (document.getElementById('create-batch-name') as HTMLInputElement)?.value;

                if (modal.type === 'add-lecture') modal.onConfirm({ title, url });
                else if (modal.type === 'create-batch') {
                  if (!createBatchName || !createBatchName.trim()) {
                    alert('Please enter a name.');
                    return;
                  }
                  modal.onConfirm({ name: createBatchName, genre: createBatchGenre });
                }
                else if (modal.type === 'import-playlist') {
                  modal.onConfirm({ url });
                }
                else if (modal.type === 'import-csv') {
                  if (file) modal.onConfirm(file);
                  else alert('Please select a CSV file to import.');
                }
                else modal.onConfirm(val || '');
              }} className="apple-button-primary w-full py-4 text-xs tracking-widest uppercase">{modal.confirmLabel}</button>
              <button onClick={() => setModal(null)} className="py-3 text-[10px] uppercase font-bold text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] tracking-widest transition-colors">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {isSearchYoutubeOpen && activeBatchId && activeSubjectId && activeChapterId && (
        <SearchYoutubeModal
          onClose={() => setIsSearchYoutubeOpen(false)}
          onAdd={(videos) => {
            const newLectures: Lecture[] = videos.map((video, index) => ({
              id: `l_${Date.now()}_${index}`,
              title: video.title,
              youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
              embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
              completed: false
            }));

            setData(prev => prev.map(b => b.id === activeBatchId ? {
              ...b,
              isDirty: true,
              subjects: b.subjects.map(s => s.id === activeSubjectId ? {
                ...s,
                chapters: s.chapters.map(c => c.id === activeChapterId ? {
                  ...c,
                  lectures: [...c.lectures, ...newLectures]
                } : c)
              } : s)
            } : b));
            setIsSearchYoutubeOpen(false);
          }}
        />
      )}

      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-12">
              <div className="size-24 rounded-[3rem] bg-white shadow-[0_20px_50px_rgba(225,29,72,0.15)] border border-rose-50 flex items-center justify-center relative group">
                <BatchWiseLogo className="w-12 h-12 text-rose-600 transition-transform group-hover:scale-110" />
                {/* Premium Spinning Ring */}
                <div className="absolute -inset-2 border-2 border-rose-100 rounded-[3.5rem]" />
                <div className="absolute -inset-2 border-2 border-rose-600 border-t-transparent rounded-[3.5rem] animate-spin" />
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-4">Synchronizing...</h2>
            
            <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-rose-50 border border-rose-100">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Strategic Connection Active</span>
            </div>
          </div>
          
          {/* Bottom attribution */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">BatchWise Protocol v1.4</p>
          </div>
        </div>
      )}

      {showComingSoon && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl animate-apple" onClick={() => setShowComingSoon(false)}>
          <div className="apple-card w-full max-w-sm shadow-2xl relative border border-[var(--apple-border)] overflow-hidden text-center p-12" onClick={e => e.stopPropagation()}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-[var(--primary)]/20 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="text-6xl mb-6 flex justify-center gap-2">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🚀</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>✨</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>💯</span>
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-slate-500">Launching Soon</h3>
            <p className="text-[var(--apple-text-secondary)] font-bold text-sm tracking-widest uppercase mb-8">Mark Your Calendar: August 15</p>

            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 mb-8 border border-black/5 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <p className="text-xs font-medium leading-relaxed opacity-80">
                We are cooking up something extremely powerful. An advanced, intelligent testing environment optimized for top-tier performance.
              </p>
            </div>

            <button onClick={() => setShowComingSoon(false)} className="w-full py-4 apple-button-primary bg-gradient-to-r from-[var(--primary)] to-slate-800 border-0 shadow-lg shadow-[var(--primary)]/20 text-xs tracking-widest uppercase font-black hover:scale-[1.02] active:scale-95 transition-all">
              Notify Me
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.SETTINGS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS].includes(viewMode) && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-[#0b0f1a]/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 z-[100] safe-area-bottom">
          <button 
            onClick={() => { setViewMode(ViewMode.BATCHES); navigate('/'); }}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === ViewMode.BATCHES ? 'text-[var(--primary)]' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button 
            onClick={() => { setViewMode(ViewMode.LIBRARY); navigate('/library'); }}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === ViewMode.LIBRARY ? 'text-[var(--primary)]' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{activeBatch ? terms.library : 'Library'}</span>
          </button>
          <button 
            onClick={() => setShowComingSoon(true)}
            className={`flex flex-col items-center gap-1 transition-all text-slate-500`}
          >
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Tests</span>
          </button>
          <button 
            onClick={() => { setViewMode(ViewMode.MARKETPLACE); navigate('/marketplace'); }}
            className={`flex flex-col items-center gap-1 transition-all ${viewMode === ViewMode.MARKETPLACE ? 'text-[var(--primary)]' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Discover</span>
          </button>
        </nav>
      )}

      {/* Mobile Admin Menu Overlay */}
      {isMobileAdminMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[110] animate-apple" onClick={() => setIsMobileAdminMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="absolute bottom-20 left-4 right-4 bg-[#0d0f14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Instructor Console</h3>
                </div>
                <div className="p-2">
                    <button onClick={() => { setViewMode(ViewMode.INSTRUCTOR_CONSOLE); navigate('/instructor'); setIsMobileAdminMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-amber-500">monitoring</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Performance Analytics</p>
                            <p className="text-[10px] text-slate-500">Monitor student progress</p>
                        </div>
                    </button>
                    <button onClick={() => { setViewMode(ViewMode.ACCESS_REQUESTS); navigate('/access-requests'); setIsMobileAdminMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-blue-500">group_add</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Access Requests</p>
                            <p className="text-[10px] text-slate-500">Manage batch enrollments</p>
                        </div>
                    </button>
                    {isAdmin && (
                        <>
                            <button onClick={() => { setViewMode(ViewMode.ADMIN); navigate('/admin'); setIsMobileAdminMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-rose-500">admin_panel_settings</span>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Management Portal</p>
                                    <p className="text-[10px] text-slate-500">Global system settings</p>
                                </div>
                            </button>
                        </>
                    )}
                    <div className="h-px bg-white/5 my-2 mx-4" />
                    <button onClick={() => { setViewMode(ViewMode.SETTINGS); navigate('/settings'); setIsMobileAdminMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-slate-500">person</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Profile Settings</p>
                            <p className="text-[10px] text-slate-500">Manage your account</p>
                        </div>
                    </button>
                    <button onClick={() => { if(confirm("Log out of your session?")) handleLogout(); setIsMobileAdminMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 transition-all">
                        <span className="material-symbols-outlined text-red-500">logout</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-red-500">Sign Out</p>
                            <p className="text-[10px] text-red-500/60">Terminate protocol session</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      )}

      <AnnouncementHistoryModal
        isOpen={isAnnouncementHistoryOpen}
        onClose={() => setIsAnnouncementHistoryOpen(false)}
        currentAnnouncement={announcementText}
        currentTimestamp={announcementTimestamp}
        currentTitle={announcementTitle}
        isAdmin={isAdmin}
      />

      {/* Contact Instructor Modal */}
      {isMessagingOpen && activeBatch && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropBlur: '8px' }} onClick={() => setIsMessagingOpen(false)}>
          <div className="w-full max-w-md bg-[#0d0f14] rounded-t-3xl md:rounded-2xl border-t border-x md:border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold text-lg">
                  {activeBatch.creatorName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">{activeBatch.creatorName || 'Instructor'}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Batch Instructor</p>
                </div>
              </div>
              <button onClick={() => setIsMessagingOpen(false)} className="size-10 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Message Form */}
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">Send a direct message to the batch instructor. You can include payment proof (links) or questions here.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const msg = (e.currentTarget.elements.namedItem('message') as HTMLTextAreaElement).value;
                  if (!msg.trim()) return;
                  if (loading) return;
                  try {
                    setLoading(true);
                    const { sendBatchInquiry } = await import('./services/firestoreService');
                    await sendBatchInquiry(
                      activeBatch.inviteCode || activeBatch.id,
                      activeBatch.sourceCreatorId || activeBatch.creatorId || 'admin',
                      user,
                      msg
                    );
                    alert("Message sent successfully!");
                    setIsMessagingOpen(false);
                  } catch (err) {
                    alert("Failed to send message. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex flex-col gap-4"
              >
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Write your message…"
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--primary)]/40 resize-none placeholder:text-slate-700"
                />
                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-[var(--primary)] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-[var(--primary)]/20">
                  <span className="material-symbols-outlined text-base">send</span>
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* ── Schedule Calendar Overlay ── */}
      {showScheduleCalendar && activeBatch && (
        <div className="fixed inset-0 z-[500] bg-[#09090b] overflow-y-auto animate-in fade-in duration-300">
          <ScheduleCalendarView
            batch={activeBatch}
            onBack={() => setShowScheduleCalendar(false)}
            onAutoSchedule={(updated) => {
              setData(prev => prev.map(b => b.id === updated.id ? updated : b));
              setShowScheduleCalendar(false);
              setTimeout(() => setShowScheduleCalendar(true), 50);
            }}
          />
        </div>
      )}


      {isSupportSamosaOpen && <SupportSamosa onClose={() => setIsSupportSamosaOpen(false)} user={user} />}

      {certificateTargetBatchId && activeBatch && (
        <CertificateView
          batch={activeBatch}
          userId={user?.uid || ''}
          userName={user?.displayName || 'Learner'}
          onClose={() => setCertificateTargetBatchId(null)}
        />
      )}

      {/* AI Command Nexus - God Mode */}
      <div className="fixed bottom-8 right-8 z-[1000] flex flex-col items-end gap-4">
        {isAINexusOpen && (
          <div className="w-80 glass-card rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <span className="material-symbols-outlined animate-spin-slow">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Sovereign</h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Full System Access</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <textarea 
                  value={aiCommand}
                  onChange={(e) => setAiCommand(e.target.value)}
                  placeholder="Execute system command..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  rows={3}
                />
                
                {aiResponse && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-indigo-300 leading-relaxed font-medium">{aiResponse}</p>
                  </div>
                )}
                
                {nexusReasoning && !aiResponse && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                    <p className="text-[9px] text-emerald-400 leading-relaxed italic">{nexusReasoning}</p>
                  </div>
                )}

                <button 
                  onClick={handleGlobalAICommand}
                  disabled={isExecutingCommand || !aiCommand.trim()}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isExecutingCommand ? 'Executing...' : 'Invoke Mutation'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsAINexusOpen(!isAINexusOpen)}
          className={`size-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isAINexusOpen ? 'bg-rose-500 rotate-45' : 'bg-indigo-600 hover:scale-110'}`}
        >
          <span className="material-symbols-outlined text-white text-3xl">
            {isAINexusOpen ? 'close' : 'bolt'}
          </span>
          {!isAINexusOpen && (
            <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/20"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default App;
