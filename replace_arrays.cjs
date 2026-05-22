const fs = require('fs');

let text = fs.readFileSync('App.tsx', 'utf8');

// Replace array variants
const findStr = "[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.MOCK_TEST, ViewMode.MOCK_TEST_V2, ViewMode.MOCK_ADMIN, ViewMode.MOCK_ADMIN_V2, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE]";
const repStr = "[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.MOCK_TEST, ViewMode.MOCK_TEST_V2, ViewMode.MOCK_ADMIN, ViewMode.MOCK_ADMIN_V2, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS, ViewMode.BATCH_LANDING]";
text = text.split(findStr).join(repStr);

const findStr2 = "[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.MOCK_TEST, ViewMode.MOCK_TEST_V2, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE]";
const repStr2 = "[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.ADMIN, ViewMode.MOCK_TEST, ViewMode.MOCK_TEST_V2, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.SETTINGS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS, ViewMode.BATCH_LANDING]";
text = text.split(findStr2).join(repStr2);

const findStr3 = "[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.MOCK_TEST_V2, ViewMode.SETTINGS, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.MARKETPLACE]";
const repStr3 = "[ViewMode.BATCHES, ViewMode.LIBRARY, ViewMode.MOCK_TEST_V2, ViewMode.SETTINGS, ViewMode.SUBJECTS, ViewMode.CHAPTERS, ViewMode.MARKETPLACE, ViewMode.ACCESS_REQUESTS, ViewMode.BATCH_LANDING]";
text = text.split(findStr3).join(repStr3);

// Title logic
text = text.replace('viewMode === ViewMode.BATCHES ? "home" :', 'viewMode === ViewMode.BATCHES ? "home" : viewMode === ViewMode.ACCESS_REQUESTS ? "Access Requests" : viewMode === ViewMode.BATCH_LANDING ? "Batch Details" :');

fs.writeFileSync('App.tsx', text);
