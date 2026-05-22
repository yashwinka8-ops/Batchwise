import { saveBatch, syncBatchesToFirestore, performAtomicSync } from './services/firestoreService';

async function test() {
    console.log('Testing sync functions...');
    const userId = "test_user_123";
    const batchData = {
        id: "test_batch_123",
        name: "Test Batch",
        subjects: [],
        createdAt: Date.now(),
        creatorId: userId,
        isDirty: true
    };
    
    try {
        console.log('Testing saveBatch...');
        await saveBatch(userId, batchData);
        console.log('SUCCESS: saveBatch');
        
        console.log('Testing performAtomicSync...');
        await performAtomicSync(userId, [batchData], []);
        console.log('SUCCESS: performAtomicSync');
    } catch (e) {
        console.error('ERROR in sync test:', e);
    }
}

test().then(() => {
    console.log('Done');
    process.exit(0);
});
