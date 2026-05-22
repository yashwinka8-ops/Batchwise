import { supabase } from './supabase';
import { MockTest, MockQuestion } from '../types';

export const supabaseMockService = {
    // --- Test CRUD ---
    async getAllTests(publishedOnly = false) {
        let query = supabase
            .from('mock_tests')
            .select('*')
            .order('created_at', { ascending: false });

        if (publishedOnly) {
            query = query.eq('published', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as MockTest[];
    },

    async getTestById(testId: string) {
        const { data, error } = await supabase
            .from('mock_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (error) throw error;
        return data as MockTest;
    },

    async saveTest(test: Partial<MockTest>) {
        const testData = {
            ...test,
            created_at: test.createdAt || Date.now(),
            published: test.published ?? false,
        };
        // Remove camelCase fields if they differ from snake_case in Supabase later, 
        // but for now we'll assume the table matches the interface or we map it.
        // Let's map it to snake_case for Supabase best practices.
        const mappedData = {
            id: test.id,
            title: test.title,
            category: test.category,
            date: test.date,
            questions_count: test.questionsCount,
            duration: test.duration,
            level: test.level,
            is_sample: test.isSample,
            published: test.published,
            created_at: test.createdAt || Date.now(),
            syllabus: test.syllabus,
            is_external_html: test.isExternalHtml,
            external_html_url: test.externalHtmlUrl
        };

        const { data, error } = await supabase
            .from('mock_tests')
            .upsert(mappedData)
            .select()
            .single();

        if (error) throw error;
        return data.id;
    },

    async deleteTest(testId: string) {
        const { error } = await supabase
            .from('mock_tests')
            .delete()
            .eq('id', testId);
        if (error) throw error;
    },

    // --- Question CRUD ---
    async getQuestionsByTestId(testId: string) {
        const { data, error } = await supabase
            .from('mock_questions')
            .select('*')
            .eq('test_id', testId)
            .order('order', { ascending: true });

        if (error) throw error;
        // Map snake_case back to camelCase
        return data.map(q => ({
            id: q.id,
            type: q.type,
            subject: q.subject,
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correct_option_index,
            correctNumericAnswer: q.correct_numeric_answer,
            solution: q.solution,
            imageUrl: q.image_url,
            order: q.order,
            difficulty: q.difficulty,
            isTopPYQ: q.is_top_pyq
        })) as MockQuestion[];
    },

    async saveQuestion(testId: string, question: Partial<MockQuestion>) {
        const mappedData = {
            id: question.id,
            test_id: testId,
            type: question.type,
            subject: question.subject,
            text: question.text,
            options: question.options,
            correct_option_index: question.correctOptionIndex,
            correct_numeric_answer: question.correctNumericAnswer,
            solution: question.solution,
            image_url: question.imageUrl,
            order: question.order ?? 0,
            difficulty: question.difficulty,
            is_top_pyq: question.isTopPYQ
        };

        const { data, error } = await supabase
            .from('mock_questions')
            .upsert(mappedData)
            .select()
            .single();

        if (error) throw error;

        // Update question count in mock_tests
        const questions = await this.getQuestionsByTestId(testId);
        await supabase
            .from('mock_tests')
            .update({ questions_count: questions.length })
            .eq('id', testId);

        return data.id;
    },

    async deleteQuestion(testId: string, questionId: string) {
        const { error } = await supabase
            .from('mock_questions')
            .delete()
            .eq('id', questionId);

        if (error) throw error;

        // Update question count
        const questions = await this.getQuestionsByTestId(testId);
        await supabase
            .from('mock_tests')
            .update({ questions_count: questions.length })
            .eq('id', testId);
    },

    async uploadImage(testId: string, file: File | Blob): Promise<string> {
        const fileName = `${testId}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const { data, error } = await supabase.storage
            .from('test-assets')
            .upload(`images/${fileName}`, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('test-assets')
            .getPublicUrl(`images/${fileName}`);

        return publicUrl;
    },

    async uploadHtmlFile(testId: string, file: File): Promise<string> {
        const fileName = `${testId}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('test-assets')
            .upload(`html-tests/${fileName}`, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('test-assets')
            .getPublicUrl(`html-tests/${fileName}`);

        return publicUrl;
    },

    // --- User Attempts ---
    async submitAttempt(userId: string, testId: string, responses: any, score: any) {
        const { error } = await supabase
            .from('test_attempts')
            .upsert({
                id: `${userId}_${testId}`, // Simple unique key, adjust if retries allowed
                user_id: userId,
                test_id: testId,
                responses,
                score,
                submitted_at: Date.now()
            });
        if (error) throw error;
    },

    async getAttempt(userId: string, testId: string) {
        const { data, error } = await supabase
            .from('test_attempts')
            .select('*')
            .eq('user_id', userId)
            .eq('test_id', testId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for no rows found
        return data;
    }
};
