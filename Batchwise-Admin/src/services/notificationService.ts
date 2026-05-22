import { messaging, firestore } from './firebase';

/**
 * Notification Service for BatchWise
 * Handles push notifications using Firebase Cloud Messaging
 */

/**
 * Request notification permissions from the user
 * @returns true if permission granted, false otherwise
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    try {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};

/**
 * Get the current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
};

/**
 * Get FCM token for the current device
 * @param userId - The authenticated user's ID
 * @returns FCM token or null if failed
 */
export const getFCMToken = async (userId: string): Promise<string | null> => {
    try {
        if (!messaging) {
            console.warn('Firebase Messaging not available');
            return null;
        }

        // Cache check: Don't write to Firestore if we've already stored this token recently
        const cachedToken = localStorage.getItem(`fcm_token_${userId}`);
        const lastUpdate = localStorage.getItem(`fcm_token_time_${userId}`);
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Request permission first
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            console.warn('Notification permission denied');
            return null;
        }

        // Get FCM token
        const token = await messaging.getToken({
            vapidKey: 'BI77aKLALaKVGG_F5sh7q0NEQYb5ix1y7UwWnygFC3I_PyHCO57vQyb6tgzXQTICFjcnsdkVr-bDqGkLmthz7bI'
        });

        if (token) {
            // Only write to Firestore if token changed OR 24 hours passed
            if (token !== cachedToken || !lastUpdate || (now - parseInt(lastUpdate)) > ONE_DAY) {
                console.log('[Sync] Storing new/expired FCM token in Firestore');
                await storeFCMToken(userId, token);
                localStorage.setItem(`fcm_token_${userId}`, token);
                localStorage.setItem(`fcm_token_time_${userId}`, now.toString());
            }
            return token;
        }

        return null;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

/**
 * Store FCM token in Firestore
 * @param userId - The authenticated user's ID
 * @param token - The FCM token
 */
export const storeFCMToken = async (userId: string, token: string): Promise<void> => {
    try {
        await firestore
            .collection('fcmTokens')
            .doc(userId)
            .set({
                token,
                updatedAt: new Date().toISOString(),
                userId
            }, { merge: true });
    } catch (error) {
        console.error('Error storing FCM token:', error);
        throw error;
    }
};

/**
 * Get all FCM tokens (for admin use when sending notifications)
 * @returns Array of FCM tokens
 */
export const getAllFCMTokens = async (): Promise<string[]> => {
    try {
        const snapshot = await firestore.collection('fcmTokens').get();
        const tokens: string[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.token) {
                tokens.push(data.token);
            }
        });

        return tokens;
    } catch (error) {
        console.error('Error getting FCM tokens:', error);
        return [];
    }
};

/**
 * Send notification to all subscribed users (Admin only)
 * Note: This is a client-side implementation. For production, use Firebase Cloud Functions
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional data payload
 */
export const sendNotificationToAll = async (
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<void> => {
    try {
        console.log(`Preparing to send notification: ${title}`);

        // Timeout promise to prevent hanging
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Notification request timed out')), 5000)
        );

        // Actual operation
        const operation = async () => {
            // Get all FCM tokens
            // optimize: limit to 20 for client-side demo to prevent freezing
            const snapshot = await firestore.collection('fcmTokens').limit(50).get();
            const tokens: string[] = [];
            snapshot.forEach(doc => {
                const t = doc.data()?.token;
                if (t) tokens.push(t);
            });

            if (tokens.length === 0) {
                console.warn('No FCM tokens found');
                return;
            }

            console.log(`Simulating broadcast to ${tokens.length} devices locally.`);

            // Display a local notification as fallback/confirmation for the admin
            if (getNotificationPermission() === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'announcement',
                    requireInteraction: false,
                    data
                });
            }

            // Store notification in Firestore for record-keeping
            await firestore.collection('notifications').add({
                title,
                body,
                data: data || {},
                createdAt: new Date().toISOString(),
                recipientCount: tokens.length,
                status: 'simulated_client_side'
            });
        };

        // Race between operation and timeout
        await Promise.race([operation(), timeout]);

    } catch (error) {
        console.error('Error sending notification:', error);
        // Don't throw, just log. We don't want to break the announcement update flow.
    }
};

/**
 * Setup foreground message listener
 * @param callback - Function to call when message received
 */
export const onMessageListener = (callback: (payload: any) => void): (() => void) => {
    if (!messaging) {
        console.warn('Firebase Messaging not available');
        return () => { };
    }

    const unsubscribe = messaging.onMessage((payload) => {
        console.log('Message received in foreground:', payload);
        callback(payload);
    });

    return unsubscribe;
};

/**
 * Delete FCM token for user (e.g., on logout)
 * @param userId - The authenticated user's ID
 */
export const deleteFCMToken = async (userId: string): Promise<void> => {
    try {
        if (messaging) {
            await messaging.deleteToken();
        }

        await firestore
            .collection('fcmTokens')
            .doc(userId)
            .delete();
    } catch (error) {
        console.error('Error deleting FCM token:', error);
    }
};
