import { StudySession } from '../types';

/**
 * Calculates the current study streak in days
 * @param sessions Array of study sessions
 * @returns Object containing current streak count and last study date
 */
export const calculateStreak = (sessions: StudySession[]) => {
    if (!sessions || sessions.length === 0) {
        return { count: 0, lastDate: null, isAtRisk: false };
    }

    // Sort sessions by timestamp descending
    const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);
    const lastSession = sortedSessions[0];
    const lastDate = new Date(lastSession.timestamp);
    lastDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If last session was before yesterday, streak is broken
    if (lastDate < yesterday) {
        return { count: 0, lastDate: lastSession.timestamp, isAtRisk: true };
    }

    // If last session was today or yesterday, calculate streak
    let count = 0;
    let currentDateCheck = new Date(today);
    
    // If they haven't studied today yet, start checking from yesterday for the streak
    if (lastDate < today) {
        currentDateCheck = new Date(yesterday);
    }

    const uniqueDays = new Set<string>();
    sessions.forEach(s => {
        const d = new Date(s.timestamp);
        d.setHours(0, 0, 0, 0);
        uniqueDays.add(d.toISOString());
    });

    while (uniqueDays.has(currentDateCheck.toISOString())) {
        count++;
        currentDateCheck.setDate(currentDateCheck.getDate() - 1);
    }

    // Check if at risk (hasn't studied in last 20 hours but still within 24h window)
    const hoursSinceLastStudy = (Date.now() - lastSession.timestamp) / (1000 * 60 * 60);
    const isAtRisk = hoursSinceLastStudy >= 20 && hoursSinceLastStudy < 24;

    return { 
        count, 
        lastDate: lastSession.timestamp, 
        isAtRisk,
        hoursSinceLastStudy
    };
};

/**
 * Checks if a batch needs an inactivity reminder
 * @param batch The batch object
 * @returns true if reminder should be sent
 */
export const shouldRemindInactivity = (sessions: StudySession[] | undefined) => {
    if (!sessions || sessions.length === 0) return false;

    const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);
    const lastSession = sortedSessions[0];
    const hoursSinceLastStudy = (Date.now() - lastSession.timestamp) / (1000 * 60 * 60);

    // If it's been more than 24 hours but less than 48 (to avoid spamming if they stop entirely)
    return hoursSinceLastStudy >= 24 && hoursSinceLastStudy < 48;
};
