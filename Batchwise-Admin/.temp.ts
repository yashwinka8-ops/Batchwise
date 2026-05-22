import { supabaseMockService } from './src/supabase-mock-platform/services/supabaseMockService';

async function run() {
    try {
        const id = await supabaseMockService.saveTest({
            id: 'test_1234',
            title: 'Test Title Updated',
            category: 'mocks',
            date: 'Live',
            duration: 180,
            level: 'Advanced',
            isSample: false,
            published: false,
            createdAt: Date.now()
        });
        console.log('SUCCESS UPDATE:', id);
    } catch(err) {
        console.error('ERROR UPDATE:', err);
    }
}
run();
