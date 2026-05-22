# VAPID Key Configuration Required

## Important: Before Testing Notifications

The notification service requires a **VAPID key** (Voluntary Application Server Identification) to work properly.

### Steps to Generate and Configure VAPID Key:

1. **Go to Firebase Console**:
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project: "make-your-own-batch"

2. **Navigate to Cloud Messaging**:
   - Click on the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Go to the "Cloud Messaging" tab

3. **Generate Web Push Certificates**:
   - Scroll down to "Web Push certificates" section
   - If you don't have a key pair, click "Generate key pair"
   - Copy the generated key (it will look like: `BKf9XqZj5rQ_8vZxE7VjJ8kF2K3HhYq6WnJzIxRmNp-8kVtQ3LbGjXzH9YwKmPq7RsT2UvN5WxC4DfE6GhI8JkL`)

4. **Update the Code**:
   - Open `services/notificationService.ts`
   - Find line 52 where `vapidKey` is defined
   - Replace the placeholder key with your actual VAPID key:
   
   ```typescript
   const token = await messaging.getToken({
       vapidKey: 'YOUR_ACTUAL_VAPID_KEY_HERE'
   });
   ```

5. **Save and Redeploy**:
   - Save the file
   - Restart the development server: `npm run dev`

### Why is this needed?

The VAPID key identifies your application to the push notification service and ensures that only your application can send notifications to your users. It's a security measure that prevents unauthorized parties from sending notifications to your users.

### Note on Service Worker

The service worker (`public/firebase-messaging-sw.js`) will handle background notifications (when the app is not in focus). Make sure this file is accessible at the root URL path of your application.

## Testing After Configuration

Once you've configured the VAPID key:

1. Reload the application
2. Grant notification permissions when prompted
3. As an admin, update an announcement with the "Send Push Notification" checkbox enabled
4. Verify that notifications appear both:
   - In-app (when browser is focused)
   - As system notifications (when browser is minimized/unfocused)
