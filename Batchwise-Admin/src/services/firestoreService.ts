import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { firestore } from './firebase';
import { Batch, LibraryResource } from '../types';

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
 * @returns Array of past announcements
 */
export const getAnnouncementHistory = async (): Promise<Array<{ text: string; createdAt: string; id: string; title?: string }>> => {
    try {
        const snapshot = await firestore
            .collection('settings')
            .doc('announcement')
            .collection('history')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const history: Array<{ text: string; createdAt: string; id: string; title?: string }> = [];
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
 * @param historyId - The ID of the history document to delete
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
 * Firestore Service for BatchWise
 * Handles all cloud database operations for cross-device synchronization
 */

/**
 * Subscribe to real-time batch updates from Firestore
 * @param userId - The authenticated user's ID
 * @param callback - Function to call when batches are updated
 * @returns Unsubscribe function
 */
export const subscribeToBatches = (
    userId: string,
    callback: (batches: Batch[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const unsubscribe = firestore
        .collection('users')
        .doc(userId)
        .collection('batches')
        .onSnapshot(
            (snapshot) => {
                const batches: Batch[] = [];
                snapshot.forEach((doc) => {
                    batches.push({ ...doc.data(), id: doc.id } as Batch);
                });
                // Sort by createdAt to maintain consistent order
                batches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                callback(batches);
            },
            (error) => {
                console.error('Firestore subscription error:', error);
                if (onError) onError(error);
            }
        );

    return unsubscribe;
};

/**
 * Save a single batch to Firestore
 * @param userId - The authenticated user's ID
 * @param batch - The batch to save
 */
export const saveBatch = async (userId: string, batch: Batch): Promise<void> => {
    try {
        // Strip isDirty flag before saving
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
 * Save all batches to Firestore (bulk operation)
 * @param userId - The authenticated user's ID
 * @param batches - Array of batches to save
 */
export const syncBatchesToFirestore = async (userId: string, batches: Batch[]): Promise<void> => {
    if (!userId || !batches) return;

    try {
        console.log(`Syncing ${batches.length} batches to Firestore for user ${userId}`);
        const batch = firestore.batch();
        const userBatchesRef = firestore.collection('users').doc(userId).collection('batches');

        batches.forEach((batchData) => {
            const docRef = userBatchesRef.doc(batchData.id);
            batch.set(docRef, batchData, { merge: true });
        });

        await batch.commit();
        await updateLastSyncTime(userId);
    } catch (error) {
        console.error('Error syncing batches to Firestore:', error);
        throw error;
    }
};

/**
 * Perform an atomic sync of multiple batches (upserts and deletes)
 * Uses a WriteBatch to save on quota and ensure consistency
 */
export const performAtomicSync = async (
    userId: string,
    changedBatches: Batch[],
    deletedBatchIds: string[]
): Promise<void> => {
    if (!userId) return;

    const startTime = Date.now();
    try {
        console.log(`[Sync] Starting atomic sync for user ${userId} (${changedBatches.length} updates, ${deletedBatchIds.length} deletes)`);
        const batch = firestore.batch();
        const userDocRef = firestore.collection('users').doc(userId);
        const batchesCollRef = userDocRef.collection('batches');

        // 1. Queue updates/inserts
        changedBatches.forEach(b => {
            const { isDirty, ...batchData } = b;
            batch.set(batchesCollRef.doc(b.id), batchData, { merge: true });
        });

        // 2. Queue deletions
        deletedBatchIds.forEach(id => {
            batch.delete(batchesCollRef.doc(id));
        });

        // 3. Update last sync time in the same batch if possible
        // (If updateLastSyncTime uses a separate document, we add it here)
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
 * Get all batches for a user (one-time fetch)
 * @param userId - The authenticated user's ID
 * @returns Array of batches
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

        // Sort by createdAt
        batches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        return batches;
    } catch (error) {
        console.error('Error fetching batches from Firestore:', error);
        throw error;
    }
};

/**
 * Migrate data from localStorage to Firestore
 * This is a one-time operation when a user first logs in
 * @param userId - The authenticated user's ID
 * @param localBatches - Batches from localStorage
 */
export const migrateFromLocalStorage = async (
    userId: string,
    localBatches: Batch[]
): Promise<void> => {
    try {
        // Check if user already has data in Firestore
        const existingBatches = await getBatches(userId);

        if (existingBatches.length === 0 && localBatches.length > 0) {
            // User has no Firestore data but has localStorage data - migrate it
            console.log('Migrating', localBatches.length, 'batches from localStorage to Firestore');
            await syncBatchesToFirestore(userId, localBatches);
        }
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
};

/**
 * Update last sync timestamp in user metadata
 * @param userId - The authenticated user's ID
 */
export const updateLastSyncTime = async (userId: string): Promise<void> => {
    try {
        await firestore
            .collection('users')
            .doc(userId)
            .set(
                {
                    lastSync: new Date().toISOString(),
                },
                { merge: true }
            );
    } catch (error) {
        console.error('Error updating last sync time:', error);
    }
};

/**
 * Get last sync timestamp
 * @param userId - The authenticated user's ID
 * @returns ISO timestamp string or null
 */
export const getLastSyncTime = async (userId: string): Promise<string | null> => {
    try {
        const doc = await firestore.collection('users').doc(userId).get();
        const data = doc.data();
        return data?.lastSync || null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
};

/**
 * Add a new admin by email
 * @param email - The email to add as admin
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
 * @param email - The email to remove
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
 * @returns Array of admin emails
 */
export const getAdmins = async (): Promise<string[]> => {
    try {
        const doc = await firestore.collection('settings').doc('admins').get();
        if (doc.exists) {
            return doc.data()?.adminEmails || []; // Removed type argument from data()
        }
        return [];
    } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
    }
};

/**
 * Check if an email is an admin
 * @param email - The email to check
 * @returns boolean
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
                // Sort by featured first, then by sharedAt
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
 * Update batch sharing settings and publish/unpublish from marketplace
 */
export const updateBatchSharing = async (userId: string, batch: Batch): Promise<void> => {
    try {
        const { isDirty, ...batchData } = batch;
        
        // 1. Update in user's private collection
        await firestore
            .collection('users')
            .doc(userId)
            .collection('batches')
            .doc(batch.id)
            .set(batchData, { merge: true });

        // 2. Handle global sharing
        if (batch.inviteCode) {
            if (batch.isPublic || batch.inviteCode) {
                // Publish/Update in shared_batches
                await firestore.collection('shared_batches').doc(batch.inviteCode).set({
                    ...batchData,
                    sharedAt: batchData.sharedAt || new Date().toISOString(),
                    creatorId: userId // Ensure correct ownership in shared record
                }, { merge: true });
            } else {
                // If we ever want to explicitly remove from shared_batches when unsharing
                // However, usually we just keep it there if inviteCode exists but set isPublic: false
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
                // Sort client-side for compatibility between 'sentAt' and 'createdAt'
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
        // Use the inviteCode (batch.id) to identify the batch uniquely in requests
        const batchId = batch.inviteCode || batch.id;
        const reqRef = firestore.collection('access_requests').doc(`${batchId}_${user.uid}`);
        await reqRef.set({
            batchId: batchId,
            batchName: batch.name,
            ownerId: batch.creatorId || 'admin',
            userId: user.uid,
            userEmail: user.email || '',
            userName: user.displayName || 'Unknown User',
            status: 'pending',
            createdAt: Date.now()
        }, { merge: true });
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

    // Filter out duplicates and invalid IDs
    const uniqueIds = Array.from(new Set(batchIds.filter(id => !!id)));
    if (uniqueIds.length === 0) {
        callback([]);
        return () => {};
    }

    // Firestore 'in' query supports up to 30 items
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
        chunks.push(uniqueIds.slice(i, i + 30));
    }

    const chunkResults = new Map<number, any[]>();

    const unsubscribes = chunks.map((chunk, index) => {
        return firestore
            .collection('batch_notifications')
            .where('batchId', 'in', chunk)
            .orderBy('createdAt', 'desc')
            .limit(30)
            .onSnapshot(
                (snapshot) => {
                    const notices: any[] = [];
                    snapshot.forEach((doc) => {
                        notices.push({ ...doc.data(), id: doc.id });
                    });
                    chunkResults.set(index, notices);
                    
                    // Merge all results
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
 * Subscribe to all members of a batch (approved/fulfilled requests)
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
 * Sync study statistics for a member to the cloud for owner review
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
    } catch (error) {
        console.error('Error syncing member stats:', error);
        // Silent fail to not interrupt student flow
    }
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
