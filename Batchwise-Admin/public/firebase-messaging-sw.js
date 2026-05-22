// Firebase Cloud Messaging Service Worker
// Handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyCxMmk9_WibV9iZp3T3X3TCGuauRVDnTzk",
    authDomain: "make-your-own-batch.firebaseapp.com",
    databaseURL: "https://make-your-own-batch-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "make-your-own-batch",
    storageBucket: "make-your-own-batch.firebasestorage.app",
    messagingSenderId: "1005043118877",
    appId: "1:1005043118877:web:af3d50bfe534c68714e7f4",
    measurementId: "G-01QQM0864W"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Announcement';
    const notificationOptions = {
        body: payload.notification?.body || 'Check out the latest update!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'announcement',
        requireInteraction: false,
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
