import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { firestore } from './firebase';
import { Batch, LibraryResource, LectureNote, BatchResource, Goal, Certificate } from '../types';
import { sendNotificationToUser } from './notificationService';

export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error';

/**
 * Subscribe to global library resources
 */
export const subscribeToLibraryResources = (
    callback: (resources: LibraryResource[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return firestore
        .collection('library')
        .onSnapshot(
            (snapshot) => {
                const resources: LibraryResource[] = [];
                snapshot.forEach((doc) => {
                    resources.push({ ...doc.data(), id: doc.id } as LibraryResource);
                });
                resources.sort((a, b) => (a.order || 0) - (b.order || 0));
                callback(resources);
            },
            (error) => {
                console.error('Library subscription error:', error);
                if (onError) onError(error);
            }
        );
};

/**
 * Save or update a library resource (Admin only)
 */
export const saveLibraryResource = async (resource: LibraryResource): Promise<void> => {
    try {
        await firestore
            .collection('library')
            .doc(resource.id)
            .set(resource, { merge: true });
    } catch (error) {
        console.error('Error saving library resource:', error);
        throw error;
    }
};

/**
 * Save or update multiple library resources in a single batch (Admin only)
 */
export const bulkSaveLibraryResources = async (resources: LibraryResource[]): Promise<void> => {
    const startTime = Date.now();
    try {
        console.log(`[Sync] Starting bulk library save for ${resources.length} items...`);
        const batch = firestore.batch();
        resources.forEach(resource => {
            const docRef = firestore.collection('library').doc(resource.id);
            batch.set(docRef, resource, { merge: true });
        });
        await batch.commit();
        console.log(`[Sync] Bulk library save completed in ${Date.now() - startTime}ms`);
    } catch (error) {
        console.error(`[Sync] Bulk library save failed after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
};

/**
 * Delete a library resource (Admin only)
 */
export const deleteLibraryResource = async (resourceId: string): Promise<void> => {
    try {
        await firestore
            .collection('library')
            .doc(resourceId)
            .delete();
    } catch (error) {
        console.error('Error deleting library resource:', error);
        throw error;
    }
};

/**
 * Subscribe to global announcement ticker
 */
export const subscribeToAnnouncement = (
    callback: (text: string, updatedAt?: string, title?: string) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return firestore
        .collection('settings')
        .doc('announcement')
        .onSnapshot(
            (doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    callback(data?.text || '', data?.updatedAt, data?.title || '');
                } else {
                    callback('Welcome to BatchWise! Your ultimate skill learning companion.', new Date().toISOString(), 'Welcome');
                }
            },
            (error) => {
                console.error('Announcement subscription error:', error);
                if (onError) onError(error);
            }
        );
};

/**
 * Get announcement history
 */
export const getAnnouncementHistory = async (): Promise<any[]> => {
    try {
        const snapshot = await firestore
            .collection('settings')
            .doc('announcement')
            .collection('history')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const history: any[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                text: data.text || '',
                title: data.title || '',
                createdAt: data.createdAt || new Date().toISOString()
            });
        });

        return history;
    } catch (error) {
        console.error('Error getting announcement history:', error);
        return [];
    }
};

/**
 * Delete an announcement from history (Admin only)
 */
export const deleteAnnouncementHistoryItem = async (historyId: string): Promise<void> => {
    try {
        await firestore
            .collection('settings')
            .doc('announcement')
            .collection('history')
            .doc(historyId)
            .delete();
    } catch (error) {
        console.error('Error deleting announcement history item:', error);
        throw error;
    }
};

/**
 * Update global announcement ticker (Admin only)
 * Uses a transaction to ensure atomicity and reliability
 */
export const updateAnnouncement = async (text: string, title?: string): Promise<void> => {
    const startTime = Date.now();
    try {
        console.log('[Sync] Starting announcement update transaction...');
        const timestamp = new Date().toISOString();
        const mainDocRef = firestore.collection('settings').doc('announcement');
        const historyCollRef = mainDocRef.collection('history');

        await firestore.runTransaction(async (transaction) => {
            console.log('[Sync] Fetching current announcement data...');
            const currentDoc = await transaction.get(mainDocRef);
            const currentData = currentDoc.exists ? currentDoc.data() : null;
            const finalTitle = title || currentData?.title || 'Announcement';

            if (currentData) {
                const hasChanged = currentData.text !== text || currentData.title !== finalTitle;

                if (hasChanged) {
                    console.log('[Sync] Change detected. Preparing history logs...');
                    // Add history entry
                    const historyDocRef = historyCollRef.doc();
                    transaction.set(historyDocRef, {
                        text: currentData.text,
                        title: currentData.title || 'Announcement',
                        createdAt: currentData.updatedAt || timestamp
                    });
                } else {
                    console.log('[Sync] No content change. Transaction will complete without updates.');
                    return;
                }
            } else {
                console.log('[Sync] Initializing fresh announcement document.');
            }

            // Update/Set main announcement
            console.log('[Sync] Updating announcement document...');
            transaction.set(mainDocRef, {
                text,
                updatedAt: timestamp,
                title: finalTitle
            }, { merge: true });
        });

        console.log(`[Sync] Announcement transaction complete in ${Date.now() - startTime}ms`);
    } catch (error) {
        console.error(`[Sync] Announcement update failed after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
};

/**
 * Initialize library with seeds if empty
 */
export const initializeLibrary = async (seeds: LibraryResource[]): Promise<void> => {
    try {
        const snapshot = await firestore.collection('library').limit(1).get();
        if (snapshot.empty) {
            console.log('Seeding library collection...');
            const batch = firestore.batch();
            seeds.forEach(resource => {
                const docRef = firestore.collection('library').doc(resource.id);
                batch.set(docRef, resource);
            });
            await batch.commit();
            console.log('Library seeded successfully');
        }
    } catch (error) {
        console.error('Failed to initialize library:', error);
    }
};

/**
 * Subscribe to real-time batch updates from Firestore
 */
export const subscribeToBatches = (
    userId: string,
    callback: (batches: Batch[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return firestore
        .collection('users')
        .doc(userId)
        .collection('batches')
        .onSnapshot(
            (snapshot) => {
                const batches: Batch[] = [];
                snapshot.forEach((doc) => {
                    batches.push({ ...doc.data(), id: doc.id } as Batch);
                });
                batches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                callback(batches);
            },
            (error) => {
                console.error('Firestore subscription error:', error);
                if (onError) onError(error);
            }
        );
};

/**
 * Save a single batch to Firestore
 */
export const saveBatch = async (userId: string, batch: Batch): Promise<void> => {
    try {
        const { isDirty, ...batchData } = batch;
        await firestore
            .collection('users')
            .doc(userId)
            .collection('batches')
            .doc(batch.id)
            .set(batchData, { merge: true });
        await updateLastSyncTime(userId);
    } catch (error) {
        console.error('Error saving batch to Firestore:', error);
        throw error;
    }
};

/**
 * Perform an atomic sync of local batches to Firestore
 */
export const performAtomicSync = async (
    userId: string,
    changedBatches: Batch[],
    deletedBatchIds: string[]
): Promise<void> => {
    if (!userId) return;
    const startTime = Date.now();
    try {
        const batch = firestore.batch();
        const userDocRef = firestore.collection('users').doc(userId);
        const batchesCollRef = userDocRef.collection('batches');

        changedBatches.forEach(b => {
            const { isDirty, ...batchData } = b;
            batch.set(batchesCollRef.doc(b.id), batchData, { merge: true });
        });

        deletedBatchIds.forEach(id => {
            batch.delete(batchesCollRef.doc(id));
        });

        batch.set(userDocRef, {
            lastSyncTime: new Date().toISOString()
        }, { merge: true });

        await batch.commit();
        console.log(`[Sync] Atomic sync completed in ${Date.now() - startTime}ms`);
    } catch (error) {
        console.error(`[Sync] Atomic sync failed after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
};

/**
 * Delete a batch from Firestore
 */
export const deleteBatch = async (userId: string, batchId: string): Promise<void> => {
    try {
        await firestore
            .collection('users')
            .doc(userId)
            .collection('batches')
            .doc(batchId)
            .delete();
    } catch (error) {
        console.error('Error deleting batch from Firestore:', error);
        throw error;
    }
};

/**
 * Get all batches for a user
 */
export const getBatches = async (userId: string): Promise<Batch[]> => {
    try {
        const snapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('batches')
            .get();
        const batches: Batch[] = [];
        snapshot.forEach((doc) => {
            batches.push({ ...doc.data(), id: doc.id } as Batch);
        });
        batches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        return batches;
    } catch (error) {
        console.error('Error fetching batches from Firestore:', error);
        throw error;
    }
};

/**
 * Migrate data from localStorage to Firestore
 */
export const migrateFromLocalStorage = async (
    userId: string,
    localBatches: Batch[]
): Promise<void> => {
    try {
        const existingBatches = await getBatches(userId);
        if (existingBatches.length === 0 && localBatches.length > 0) {
            console.log('Migrating', localBatches.length, 'batches from localStorage to Firestore');
            await syncBatchesToFirestore(userId, localBatches);
        }
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
};

/**
 * Helper to sync multiple batches to Firestore
 */
export const syncBatchesToFirestore = async (userId: string, batches: Batch[]): Promise<void> => {
    if (!userId || batches.length === 0) return;
    try {
        const batch = firestore.batch();
        const userRef = firestore.collection('users').doc(userId);
        const batchesRef = userRef.collection('batches');
        batches.forEach((b) => {
            const { isDirty, ...batchData } = b;
            batch.set(batchesRef.doc(b.id), batchData, { merge: true });
        });
        await batch.commit();
        await updateLastSyncTime(userId);
    } catch (error) {
        console.error('Error syncing to Firestore:', error);
        throw error;
    }
};

/**
 * Update last sync timestamp
 */
export const updateLastSyncTime = async (userId: string): Promise<void> => {
    try {
        await firestore
            .collection('users')
            .doc(userId)
            .set({ lastSync: new Date().toISOString() }, { merge: true });
    } catch (error) {
        console.error('Error updating last sync time:', error);
    }
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = async (userId: string): Promise<string | null> => {
    try {
        const doc = await firestore.collection('users').doc(userId).get();
        return doc.data()?.lastSync || null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
};

/**
 * Add a new admin by email
 */
export const addAdmin = async (email: string): Promise<void> => {
    try {
        const sanitizedEmail = email.toLowerCase().trim();
        await firestore.collection('settings').doc('admins').set({
            adminEmails: firebase.firestore.FieldValue.arrayUnion(sanitizedEmail)
        }, { merge: true });
    } catch (error) {
        console.error('Error adding admin:', error);
        throw error;
    }
};

/**
 * Remove an admin by email
 */
export const removeAdmin = async (email: string): Promise<void> => {
    try {
        const sanitizedEmail = email.toLowerCase().trim();
        await firestore.collection('settings').doc('admins').set({
            adminEmails: firebase.firestore.FieldValue.arrayRemove(sanitizedEmail)
        }, { merge: true });
    } catch (error) {
        console.error('Error removing admin:', error);
        throw error;
    }
};

/**
 * Get list of all admins
 */
export const getAdmins = async (): Promise<string[]> => {
    try {
        const doc = await firestore.collection('settings').doc('admins').get();
        return doc.exists ? (doc.data()?.adminEmails || []) : [];
    } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
    }
};

/**
 * Check if an email is an admin
 */
export const checkIsAdmin = async (email: string): Promise<boolean> => {
    try {
        if (!email) return false;
        const sanitizedEmail = email.toLowerCase().trim();
        const doc = await firestore.collection('settings').doc('admins').get();
        if (doc.exists) {
            const admins = doc.data()?.adminEmails || [];
            return admins.includes(sanitizedEmail);
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Share a batch globally with a 6-digit coupon code
 */
export const shareBatchWithCode = async (inviteCode: string, batch: Batch): Promise<void> => {
    try {
        const { isDirty, ...batchData } = batch;
        await firestore.collection('shared_batches').doc(inviteCode).set({
            ...batchData,
            sharedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sharing batch:', error);
        throw error;
    }
};

/**
 * Retrieve a shared batch by its 6-digit coupon code
 */
export const getBatchByInviteCode = async (inviteCode: string): Promise<Batch | null> => {
    try {
        const doc = await firestore.collection('shared_batches').doc(inviteCode).get();
        if (doc.exists) {
            return { ...doc.data(), id: doc.id } as Batch;
        }
        return null;
    } catch (error) {
        console.error('Error fetching shared batch:', error);
        throw error;
    }
};

/**
 * Subscribe to public batches in the marketplace
 */
export const subscribeToMarketplaceBatches = (
    callback: (batches: Batch[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return firestore
        .collection('shared_batches')
        .where('isPublic', '==', true)
        .onSnapshot(
            (snapshot) => {
                const batches: Batch[] = [];
                snapshot.forEach((doc) => {
                    batches.push({ ...doc.data(), id: doc.id } as Batch);
                });
                batches.sort((a, b) => {
                    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
                    return new Date(b.sharedAt || 0).getTime() - new Date(a.sharedAt || 0).getTime();
                });
                callback(batches);
            },
            (error) => {
                console.error('Marketplace subscription error:', error);
                if (onError) onError(error);
            }
        );
};

/**
 * Update batch sharing settings
 */
export const updateBatchSharing = async (userId: string, batch: Batch): Promise<void> => {
    try {
        const { isDirty, ...batchData } = batch;
        await firestore
            .collection('users')
            .doc(userId)
            .collection('batches')
            .doc(batch.id)
            .set(batchData, { merge: true });

        if (batch.inviteCode) {
            if (batch.isPublic || batch.inviteCode) {
                await firestore.collection('shared_batches').doc(batch.inviteCode).set({
                    ...batchData,
                    sharedAt: batchData.sharedAt || new Date().toISOString(),
                    creatorId: userId
                }, { merge: true });
            } else {
                await firestore.collection('shared_batches').doc(batch.inviteCode).update({
                    isPublic: false
                });
            }
        }
    } catch (error) {
        console.error('Error updating batch sharing:', error);
        throw error;
    }
};

/**
 * Generate a unique 6-digit invite code
 */
export const generateInviteCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Subscribe to administrative notifications
 */
export const subscribeToNotifications = (
    callback: (notifications: any[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return firestore
        .collection('notifications')
        .limit(50)
        .onSnapshot(
            (snapshot) => {
                const notifications: any[] = [];
                snapshot.forEach((doc) => {
                    notifications.push({ ...doc.data(), id: doc.id });
                });
                notifications.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.sentAt || 0).getTime();
                    const timeB = new Date(b.createdAt || b.sentAt || 0).getTime();
                    return timeB - timeA;
                });
                callback(notifications);
            },
            (error) => {
                console.error('Notifications subscription error:', error);
                if (onError) onError(error);
            }
        );
};

/**
 * Request access to a batch
 */
export const requestAccessToBatch = async (batch: Batch, user: any): Promise<void> => {
    try {
        if (!user || !user.uid) throw new Error('User not authenticated');
        const batchId = batch.inviteCode || batch.id;
        const reqRef = firestore.collection('access_requests').doc(`${batchId}_${user.uid}`);
        await reqRef.set({
            batchId,
            batchName: batch.name,
            ownerId: batch.creatorId || 'admin',
            userId: user.uid,
            userEmail: user.email || '',
            userName: user.displayName || 'Unknown User',
            status: 'pending',
            createdAt: Date.now()
        }, { merge: true });

        // Notify the admin/owner
        const ownerId = batch.creatorId || 'admin';
        console.log(`[RequestAccess] Attempting to notify owner: ${ownerId}`);

        if (ownerId) {
            await sendNotificationToUser(
                ownerId,
                '🚨 New Access Request',
                `${user.displayName || 'A student'} is requesting access to "${batch.name}"`,
                { 
                    type: 'access_request', 
                    batchId, 
                    userId: user.uid,
                    userName: user.displayName || 'Student'
                }
            ).then(() => {
                console.log(`[RequestAccess] Notification sent to ${ownerId}`);
            }).catch(err => {
                console.warn(`[RequestAccess] Failed to notify owner ${ownerId}:`, err);
            });
        }
    } catch (error) {
        console.error('Error requesting access:', error);
        throw error;
    }
};

/**
 * Subscribe to incoming access requests for a batch owner
 */
export const subscribeToIncomingRequests = (
    ownerId: string,
    callback: (requests: any[]) => void
): (() => void) => {
    return firestore
        .collection('access_requests')
        .where('ownerId', '==', ownerId)
        .where('status', '==', 'pending')
        .onSnapshot(
            (snapshot) => {
                const requests: any[] = [];
                snapshot.forEach((doc) => {
                    requests.push({ ...doc.data(), id: doc.id });
                });
                callback(requests);
            },
            (error) => console.error('Error subscribing to incoming requests:', error)
        );
};

/**
 * Update the status of an access request
 */
export const updateAccessRequestStatus = async (requestId: string, status: 'approved' | 'rejected' | 'fulfilled'): Promise<void> => {
    try {
        await firestore.collection('access_requests').doc(requestId).update({ status });
    } catch (error) {
        console.error('Error updating request status:', error);
        throw error;
    }
};

/**
 * Subscribe to the user\'s approved access requests
 */
export const subscribeToMyApprovedRequests = (
    userId: string,
    callback: (requests: any[]) => void
): (() => void) => {
    return firestore
        .collection('access_requests')
        .where('userId', '==', userId)
        .where('status', '==', 'approved')
        .onSnapshot(
            (snapshot) => {
                const requests: any[] = [];
                snapshot.forEach((doc) => {
                    requests.push({ ...doc.data(), id: doc.id });
                });
                callback(requests);
            },
            (error) => console.error('Error subscribing to approved requests:', error)
        );
};

/**
 * Send a notification to all users of a specific batch
 */
export const sendBatchNotification = async (batchId: string, title: string, body: string, ownerId: string): Promise<void> => {
    try {
        await firestore.collection('batch_notifications').add({
            batchId,
            title,
            body,
            ownerId,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error('Error sending batch notification:', error);
        throw error;
    }
};

/**
 * Subscribe to notifications for a set of batch IDs
 */
export const subscribeToBatchNotifications = (
    batchIds: string[],
    callback: (notifications: any[]) => void
): (() => void) => {
    if (!batchIds || batchIds.length === 0) {
        callback([]);
        return () => {};
    }
    const uniqueIds = Array.from(new Set(batchIds.filter(id => !!id)));
    if (uniqueIds.length === 0) {
        callback([]);
        return () => {};
    }
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
        chunks.push(uniqueIds.slice(i, i + 30));
    }
    const chunkResults = new Map<number, any[]>();
    const unsubscribes = chunks.map((chunk, index) => {
        return firestore
            .collection('batch_notifications')
            .where('batchId', 'in', chunk)
            .onSnapshot(
                (snapshot) => {
                    const notices: any[] = [];
                    snapshot.forEach((doc) => {
                        notices.push({ ...doc.data(), id: doc.id });
                    });
                    chunkResults.set(index, notices);
                    const allNotices = Array.from(chunkResults.values()).flat();
                    allNotices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    callback(allNotices);
                },
                (error) => console.error('Error subscribing to batch notices:', error)
            );
    });
    return () => unsubscribes.forEach(un => un());
};

/**
 * Subscribe to all members of a batch
 */
export const subscribeToBatchMembers = (
    batchId: string,
    callback: (members: any[]) => void
): (() => void) => {
    return firestore
        .collection('access_requests')
        .where('batchId', '==', batchId)
        .where('status', 'in', ['approved', 'fulfilled'])
        .onSnapshot(
            (snapshot) => {
                const members: any[] = [];
                snapshot.forEach((doc) => {
                    members.push({ ...doc.data(), id: doc.id });
                });
                callback(members);
            },
            (error) => console.error('Error subscribing to batch members:', error)
        );
};

/**
 * Revoke a user's access to a batch
 */
export const revokeBatchAccess = async (requestId: string): Promise<void> => {
    try {
        await firestore.collection('access_requests').doc(requestId).delete();
    } catch (error) {
        console.error('Error revoking access:', error);
        throw error;
    }
};

/**
 * Sync study statistics for a member to the cloud for owner review.
 */
export const syncMemberStats = async (batchId: string, userId: string, stats: any): Promise<void> => {
    try {
        const statsRef = firestore.collection('batch_member_stats').doc(`${batchId}_${userId}`);
        await statsRef.set({
            ...stats,
            batchId,
            userId,
            updatedAt: Date.now()
        }, { merge: true });
        updateAvgCompletion(batchId).catch(() => {});
    } catch (error) {
        console.error('Error syncing member stats:', error);
    }
};

/**
 * Recompute the average completion % across all enrolled members of a batch
 */
export const updateAvgCompletion = async (batchId: string): Promise<void> => {
    try {
        const snapshot = await firestore
            .collection('batch_member_stats')
            .where('batchId', '==', batchId)
            .get();
        if (snapshot.empty) return;
        let total = 0;
        let count = 0;
        snapshot.forEach(doc => {
            const d = doc.data();
            if (typeof d.progress === 'number') {
                total += d.progress;
                count++;
            }
        });
        if (count === 0) return;
        const avg = Math.round(total / count);
        await firestore.collection('shared_batches').doc(batchId).update({
            avgCompletion: avg,
            enrolledCount: count
        });
    } catch (error) {}
};

/**
 * Subscribe to performance statistics for all members of a batch
 */
export const subscribeToBatchStats = (
    batchId: string,
    callback: (stats: any[]) => void
): (() => void) => {
    return firestore
        .collection('batch_member_stats')
        .where('batchId', '==', batchId)
        .onSnapshot(
            (snapshot) => {
                const stats: any[] = [];
                snapshot.forEach((doc) => {
                    stats.push({ ...doc.data(), id: doc.id });
                });
                callback(stats);
            },
            (error) => console.error('Error subscribing to batch stats:', error)
        );
};

/**
 * Send an inquiry message to a batch owner
 */
export const sendBatchInquiry = async (
    batchId: string, 
    ownerId: string, 
    user: any, 
    message: string
): Promise<void> => {
    try {
        if (!user || !user.uid) throw new Error('Authentication required');
        await firestore.collection('batch_inquiries').add({
            batchId,
            ownerId,
            userId: user.uid,
            userEmail: user.email || '',
            userName: user.displayName || 'Student',
            message: message.trim(),
            messages: [{ role: 'student', text: message.trim(), timestamp: Date.now() }],
            status: 'unread',
            createdAt: Date.now(),
            lastUpdatedAt: Date.now()
        });
    } catch (error) {
        console.error('Error sending inquiry:', error);
        throw error;
    }
};

/**
 * Admin Reply to an inquiry
 */
export const replyToInquiry = async (inquiryId: string, replyText: string): Promise<void> => {
    try {
        const docRef = firestore.collection('batch_inquiries').doc(inquiryId);
        await firebase.firestore().runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) throw new Error('Not found');
            const data = doc.data() as any;
            const updatedMessages = [...(data.messages || []), { role: 'admin', text: replyText.trim(), timestamp: Date.now() }];
            transaction.update(docRef, { messages: updatedMessages, status: 'replied', lastUpdatedAt: Date.now() });
        });
    } catch (error) {
        console.error('Error replying:', error);
        throw error;
    }
};

/**
 * Student Adds to the thread
 */
export const extendInquiry = async (inquiryId: string, text: string): Promise<void> => {
    try {
        const docRef = firestore.collection('batch_inquiries').doc(inquiryId);
        await firebase.firestore().runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) throw new Error('Not found');
            const data = doc.data() as any;
            const updatedMessages = [...(data.messages || []), { role: 'student', text: text.trim(), timestamp: Date.now() }];
            transaction.update(docRef, { messages: updatedMessages, status: 'unread', lastUpdatedAt: Date.now() });
        });
    } catch (error) {
        console.error('Error extending:', error);
        throw error;
    }
};

/**
 * Subscribe to incoming inquiries for a batch owner
 */
export const subscribeToIncomingInquiries = (
    ownerId: string,
    callback: (inquiries: any[]) => void
): (() => void) => {
    return firestore
        .collection('batch_inquiries')
        .where('ownerId', '==', ownerId)
        .onSnapshot(
            (snapshot) => {
                const inquiries: any[] = [];
                snapshot.forEach((doc) => {
                    inquiries.push({ ...doc.data(), id: doc.id });
                });
                inquiries.sort((a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0));
                callback(inquiries);
            },
            (error) => console.error('Inquiry subscription error:', error)
        );
};

/**
 * Subscribe to student's own inquiries
 */
export const subscribeToMyInquiries = (
    userId: string,
    batchId: string,
    callback: (inquiries: any[]) => void
): (() => void) => {
    return firestore
        .collection('batch_inquiries')
        .where('userId', '==', userId)
        .where('batchId', '==', batchId)
        .onSnapshot(
            (snapshot) => {
                const inquiries: any[] = [];
                snapshot.forEach((doc) => {
                    inquiries.push({ ...doc.data(), id: doc.id });
                });
                inquiries.sort((a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0));
                callback(inquiries);
            },
            (error) => console.error('My inquiry subscription error:', error)
        );
};

/**
 * Mark an inquiry as read
 */
export const markInquiryAsRead = async (inquiryId: string): Promise<void> => {
    try {
        await firestore.collection('batch_inquiries').doc(inquiryId).update({ status: 'read' });
    } catch (error) {
        console.error('Error updating status:', error);
    }
};

/**
 * Delete an inquiry
 */
export const deleteInquiry = async (inquiryId: string): Promise<void> => {
    try {
        await firestore.collection('batch_inquiries').doc(inquiryId).delete();
    } catch (error) {
        console.error('Error deleting inquiry:', error);
    }
};

/**
 * Increment the import count for a shared batch.
 */
export const incrementImportCount = async (inviteCode: string): Promise<void> => {
    try {
        const docRef = firestore.collection('shared_batches').doc(inviteCode);
        const doc = await docRef.get();
        if (doc.exists) {
            await docRef.update({
                importCount: firebase.firestore.FieldValue.increment(1)
            });
        }
    } catch (error) {
        console.error('Error incrementing import count:', error);
    }
};

/**
 * Log user activity for DAU/MAU tracking
 */
export const logActivity = async (userId: string): Promise<void> => {
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const monthStr = dateStr.substring(0, 7);

        const batch = firestore.batch();
        const dailyRef = firestore.collection('analytics').doc('activity').collection('daily').doc(`${dateStr}_${userId}`);
        batch.set(dailyRef, { userId, timestamp: Date.now(), date: dateStr }, { merge: true });

        const monthlyRef = firestore.collection('analytics').doc('activity').collection('monthly').doc(`${monthStr}_${userId}`);
        batch.set(monthlyRef, { userId, timestamp: Date.now(), month: monthStr }, { merge: true });

        await batch.commit();
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

/**
 * Get global analytics metrics (Admin only)
 */
export const getGlobalAnalytics = async (): Promise<any> => {
    const stats: any = {
        totalStudents: 0,
        avgProgress: 0,
        popularBatches: [],
        dau: 0,
        mau: 0,
        totalStudyTime: 0
    };

    try {
        // 1. Total Students & Progress
        try {
            const statsSnapshot = await firestore.collection('batch_member_stats').get();
            const uniqueUserIds = new Set<string>();
            let totalSessionsTime = 0;
            let totalProgress = 0;
            let statsCount = 0;

            statsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.userId) uniqueUserIds.add(data.userId);
                if (data.totalStudyTime) totalSessionsTime += data.totalStudyTime;
                if (typeof data.progress === 'number') {
                    totalProgress += data.progress;
                    statsCount++;
                }
            });
            stats.totalStudents = uniqueUserIds.size;
            stats.avgProgress = statsCount > 0 ? Math.round(totalProgress / statsCount) : 0;
            stats.totalStudyTime = totalSessionsTime;
        } catch (e) {
            console.error("Error fetching member stats:", e);
        }

        // 2. Popular Batches
        try {
            const batchesSnapshot = await firestore.collection('shared_batches')
                .orderBy('importCount', 'desc')
                .limit(5)
                .get();
            batchesSnapshot.forEach(doc => {
                stats.popularBatches.push({ ...doc.data(), id: doc.id });
            });
        } catch (e) {
            console.error("Error fetching popular batches:", e);
        }

        // 3. DAU/MAU
        try {
            const today = new Date().toISOString().split('T')[0];
            const monthStr = today.substring(0, 7);
            const dauSnapshot = await firestore.collection('analytics').doc('activity').collection('daily')
                .where('date', '==', today).get();
            stats.dau = dauSnapshot.size;
            const mauSnapshot = await firestore.collection('analytics').doc('activity').collection('monthly')
                .where('month', '==', monthStr).get();
            stats.mau = mauSnapshot.size;
        } catch (e) {
            console.error("Error fetching activity logs:", e);
        }
        return stats;
    } catch (error) {
        console.error('Global Analytics Error:', error);
        return stats;
    }
};

/**
 * Submit a student doubt
 */
export const submitDoubt = async (doubtData: Omit<Doubt, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    try {
        const docRef = firestore.collection('doubts').doc();
        const doubt: Doubt = {
            ...doubtData,
            id: docRef.id,
            status: 'pending',
            createdAt: Date.now()
        };
        await docRef.set(doubt);
        return docRef.id;
    } catch (error) {
        console.error('Error submitting doubt:', error);
        throw error;
    }
};

/**
 * Subscribe to doubts for a batch
 */
export const subscribeToDoubts = (batchId: string, callback: (doubts: Doubt[]) => void) => {
    return firestore.collection('doubts')
        .where('batchId', '==', batchId)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const doubts: Doubt[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                doubts.push(data as Doubt);
            });
            callback(doubts);
        }, error => {
            console.error('Error subscribing to doubts:', error);
        });
};

/**
 * Resolve a student doubt
 */
export const resolveDoubt = async (doubtId: string, reply: string, repliedBy: string): Promise<void> => {
    try {
        await firestore.collection('doubts').doc(doubtId).update({
            reply,
            repliedBy,
            repliedAt: Date.now(),
            status: 'resolved'
        });
    } catch (error) {
        console.error('Error resolving doubt:', error);
        throw error;
    }
};

/**
 * Add staff member to a batch
 */
export const addBatchStaff = async (staff: BatchStaff): Promise<void> => {
    try {
        await firestore.collection('batch_staff').doc(`${staff.batchId}_${staff.uid}`).set(staff);
    } catch (error) {
        console.error('Error adding batch staff:', error);
        throw error;
    }
};

/**
 * Get all staff members for a batch
 */
export const getBatchStaff = async (batchId: string): Promise<BatchStaff[]> => {
    try {
        const snapshot = await firestore.collection('batch_staff').where('batchId', '==', batchId).get();
        const staff: BatchStaff[] = [];
        snapshot.forEach(doc => staff.push(doc.data() as BatchStaff));
        return staff;
    } catch (error) {
        console.error('Error fetching batch staff:', error);
        return [];
    }
};

/**
 * Get granular analytics for a specific batch
 */
export const getBatchAnalytics = async (batchId: string): Promise<any> => {
    try {
        const snapshot = await firestore.collection('batch_member_stats')
            .where('inviteCode', '==', batchId)
            .get();
        
        const members: any[] = [];
        let totalProgress = 0;
        let totalStudyTime = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            members.push(data);
            totalProgress += data.progress || 0;
            totalStudyTime += data.totalStudyTime || 0;
        });

        return {
            memberCount: members.length,
            avgProgress: members.length > 0 ? Math.round(totalProgress / members.length) : 0,
            totalStudyTime,
            members: members.sort((a, b) => (b.progress || 0) - (a.progress || 0))
        };
    } catch (error) {
        console.error('Error fetching batch analytics:', error);
        return null;
    }
};

/**
 * Submit a reply to a doubt (can be by student or staff)
 */
export const submitDoubtReply = async (replyData: Omit<DoubtReply, 'id' | 'createdAt'>): Promise<void> => {
    try {
        const docRef = firestore.collection('doubt_replies').doc();
        const reply: DoubtReply = {
            ...replyData,
            id: docRef.id,
            createdAt: Date.now()
        };
        await docRef.set(reply);
        
        // Also mark the doubt as resolved if it's not already
        await firestore.collection('doubts').doc(replyData.doubtId).update({
            status: 'resolved'
        });
    } catch (error) {
        console.error('Error submitting doubt reply:', error);
        throw error;
    }
};

/**
 * Subscribe to replies for a specific doubt
 */
export const subscribeToReplies = (doubtId: string, callback: (replies: DoubtReply[]) => void) => {
    return firestore.collection('doubt_replies')
        .where('doubtId', '==', doubtId)
        .orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            const replies: DoubtReply[] = [];
            snapshot.forEach(doc => replies.push(doc.data() as DoubtReply));
            callback(replies);
        }, error => {
            console.error('Error subscribing to replies:', error);
    });
};

/**
 * Send a message to a group/community
 */
export const sendChatMessage = async (groupId: string, messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> => {
    try {
        const docRef = firestore.collection('community_messages').doc();
        const message: ChatMessage = {
            ...messageData,
            id: docRef.id,
            createdAt: Date.now()
        };
        await docRef.set({
            ...message,
            groupId
        });
        
        // Update group activity
        await firestore.collection('communities').doc(groupId).update({
            lastMessageAt: Date.now()
        }).catch(() => {}); // Optional: Group doc might not exist yet if it's dynamic
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

/**
 * Subscribe to group messages
 */
export const subscribeToGroupMessages = (groupId: string, callback: (messages: ChatMessage[]) => void) => {
    return firestore.collection('community_messages')
        .where('groupId', '==', groupId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(snapshot => {
            const messages: ChatMessage[] = [];
            snapshot.forEach(doc => messages.push(doc.data() as ChatMessage));
            callback(messages.reverse());
        }, error => {
            console.error('Error subscribing to chat:', error);
        });
};

/**
 * Get or Create a batch group
 */
export const getOrCreateBatchGroup = async (batchId: string, batchName: string): Promise<string> => {
    try {
        const groupDoc = await firestore.collection('communities').doc(batchId).get();
        if (!groupDoc.exists) {
            await firestore.collection('communities').doc(batchId).set({
                id: batchId,
                name: `${batchName} (Official)`,
                description: `Official discussion forum for ${batchName}`,
                isPrivate: true,
                batchId: batchId,
                memberCount: 1,
                createdAt: Date.now()
            });
        }
        return batchId;
    } catch (error) {
        console.error('Error with batch group:', error);
        return batchId;
    }
};

/**
 * Get public community groups
 */
export const subscribeToCommunityGroups = (callback: (groups: CommunityGroup[]) => void) => {
    return firestore.collection('communities')
        .where('isPrivate', '==', false)
        .onSnapshot(snapshot => {
            const groups: CommunityGroup[] = [];
            snapshot.forEach(doc => groups.push(doc.data() as CommunityGroup));
            callback(groups);
        });
};

/**
 * Create a new poll in a group
 */
export const createPoll = async (pollData: Omit<Poll, 'id' | 'createdAt'>): Promise<void> => {
    try {
        const docRef = firestore.collection('polls').doc();
        const poll: Poll = {
            ...pollData,
            id: docRef.id,
            createdAt: Date.now()
        };
        await docRef.set(poll);
    } catch (error) {
        console.error('Error creating poll:', error);
        throw error;
    }
};

/**
 * Vote on a poll
 */
export const voteOnPoll = async (pollId: string, optionId: string, userId: string): Promise<void> => {
    try {
        const pollRef = firestore.collection('polls').doc(pollId);
        await firestore.runTransaction(async (transaction) => {
            const doc = await transaction.get(pollRef);
            if (!doc.exists) return;
            
            const poll = doc.data() as Poll;
            if (poll.votedBy.includes(userId)) return;

            const newOptions = poll.options.map(opt => {
                if (opt.id === optionId) {
                    return { ...opt, votes: opt.votes + 1 };
                }
                return opt;
            });

            transaction.update(pollRef, {
                options: newOptions,
                votedBy: [...poll.votedBy, userId]
            });
        });
    } catch (error) {
        console.error('Error voting on poll:', error);
        throw error;
    }
};

/**
 * Subscribe to polls for a group
 */
export const subscribeToPolls = (groupId: string, callback: (polls: Poll[]) => void) => {
    return firestore.collection('polls')
        .where('groupId', '==', groupId)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const polls: Poll[] = [];
            snapshot.forEach(doc => polls.push(doc.data() as Poll));
            callback(polls);
        });
};

/**
 * Join a live study room
 */
export const joinStudyRoom = async (roomId: string, userId: string): Promise<void> => {
    try {
        const roomRef = firestore.collection('study_rooms').doc(roomId);
        await roomRef.update({
            participants: firebase.firestore.FieldValue.arrayUnion(userId)
        });
    } catch (error) {
        console.error('Error joining study room:', error);
    }
};

/**
 * Leave a live study room
 */
export const leaveStudyRoom = async (roomId: string, userId: string): Promise<void> => {
    try {
        const roomRef = firestore.collection('study_rooms').doc(roomId);
        await roomRef.update({
            participants: firebase.firestore.FieldValue.arrayRemove(userId)
        });
    } catch (error) {
        console.error('Error leaving study room:', error);
    }
};

/**
 * Social: Like a message/post
 */
export const likeMessage = async (messageId: string, userId: string): Promise<void> => {
    const msgRef = firestore.collection('community_messages').doc(messageId);
    await msgRef.update({
        likes: firebase.firestore.FieldValue.arrayUnion(userId)
    });
};

/**
 * Social: Update user profile
 */
export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
    if (!profile.uid) return;
    await firestore.collection('user_profiles').doc(profile.uid).set(profile, { merge: true });
};

/**
 * Social: Get user profile
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const doc = await firestore.collection('user_profiles').doc(uid).get();
    return doc.exists ? doc.data() as UserProfile : null;
};

/**
 * Social: Subscribe to user profile
 */
export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile) => void) => {
    return firestore.collection('user_profiles').doc(uid)
        .onSnapshot(doc => {
            if (doc.exists) callback(doc.data() as UserProfile);
        }, error => console.error('Error subscribing to user profile:', error));
};

/* ───── Lecture Notes ───── */

export const createNote = async (note: Omit<LectureNote, 'id' | 'createdAt'>): Promise<void> => {
    const ref = firestore.collection('lecture_notes').doc();
    await ref.set({ ...note, id: ref.id, createdAt: Date.now() });
};

export const subscribeToLectureNotes = (lectureId: string, callback: (notes: LectureNote[]) => void) => {
    return firestore.collection('lecture_notes')
        .where('lectureId', '==', lectureId)
        .onSnapshot(snap => {
            const notes = snap.docs.map(d => d.data() as LectureNote);
            notes.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            callback(notes);
        }, error => console.error('Error subscribing to notes:', error));
};

export const deleteNote = async (noteId: string): Promise<void> => {
    await firestore.collection('lecture_notes').doc(noteId).delete();
};

/* ───── Batch Resources ───── */

export const addResource = async (resource: Omit<BatchResource, 'id' | 'createdAt'>): Promise<void> => {
    const ref = firestore.collection('lecture_resources').doc();
    await ref.set({ ...resource, id: ref.id, createdAt: Date.now() });
};

export const subscribeToLectureResources = (lectureId: string, callback: (resources: BatchResource[]) => void) => {
    return firestore.collection('lecture_resources')
        .where('lectureId', '==', lectureId)
        .onSnapshot(snap => {
            const resources = snap.docs.map(d => d.data() as BatchResource);
            resources.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            callback(resources);
        }, error => console.error('Error subscribing to resources:', error));
};

export const deleteResource = async (resourceId: string): Promise<void> => {
    await firestore.collection('lecture_resources').doc(resourceId).delete();
};

/* ───── Goals ───── */

export const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'completed'>): Promise<void> => {
    const ref = firestore.collection('goals').doc();
    await ref.set({ ...goal, id: ref.id, createdAt: Date.now(), completed: false });
};

export const subscribeToUserGoals = (userId: string, callback: (goals: Goal[]) => void) => {
    return firestore.collection('goals')
        .where('userId', '==', userId)
        .onSnapshot(snap => {
            const goals = snap.docs.map(d => d.data() as Goal);
            goals.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            callback(goals);
        }, error => console.error('Error subscribing to goals:', error));
};

export const updateGoalProgress = async (goalId: string, currentCount: number, completed: boolean): Promise<void> => {
    await firestore.collection('goals').doc(goalId).update({ currentCount, completed });
};

export const deleteGoal = async (goalId: string): Promise<void> => {
    await firestore.collection('goals').doc(goalId).delete();
};

/* ───── Certificates ───── */

export const generateCertificate = async (data: Omit<Certificate, 'id' | 'issuedAt'>): Promise<string> => {
    const ref = firestore.collection('certificates').doc();
    const issuedAt = Date.now();
    await ref.set({ ...data, id: ref.id, issuedAt });
    return ref.id;
};

export const subscribeToUserCertificates = (userId: string, callback: (certs: Certificate[]) => void) => {
    return firestore.collection('certificates')
        .where('userId', '==', userId)
        .onSnapshot(snap => {
            const certs = snap.docs.map(d => d.data() as Certificate);
            certs.sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0));
            callback(certs);
        }, error => console.error('Error subscribing to certificates:', error));
};
