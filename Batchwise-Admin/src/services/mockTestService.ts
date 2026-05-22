import { firestore, storage } from './firebase';
import { MockTest, MockQuestion } from '../types';

const TESTS_COLLECTION = 'mock_tests';
const QUESTIONS_SUBCOLLECTION = 'questions';

export const mockTestService = {
    // --- Test CRUD ---
    async getAllTests(publishedOnly = false) {
        let query = firestore.collection(TESTS_COLLECTION).orderBy('createdAt', 'desc');
        if (publishedOnly) {
            query = query.where('published', '==', true);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockTest));
    },

    async getTestById(testId: string) {
        const doc = await firestore.collection(TESTS_COLLECTION).doc(testId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() } as MockTest;
        }
        return null;
    },

    async saveTest(test: Partial<MockTest>) {
        const testId = test.id || firestore.collection(TESTS_COLLECTION).doc().id;
        const testRef = firestore.collection(TESTS_COLLECTION).doc(testId);

        const testData = {
            ...test,
            id: testId,
            createdAt: test.createdAt || Date.now(),
            published: test.published ?? false,
        };

        await testRef.set(testData, { merge: true });
        return testId;
    },

    async deleteTest(testId: string) {
        await firestore.collection(TESTS_COLLECTION).doc(testId).delete();
    },

    // --- Question CRUD ---
    async getQuestionsByTestId(testId: string) {
        const snapshot = await firestore
            .collection(TESTS_COLLECTION)
            .doc(testId)
            .collection(QUESTIONS_SUBCOLLECTION)
            .orderBy('order', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockQuestion));
    },

    async saveQuestion(testId: string, question: Partial<MockQuestion>) {
        const questionId = question.id || firestore.collection(TESTS_COLLECTION).doc(testId).collection(QUESTIONS_SUBCOLLECTION).doc().id;
        const questionRef = firestore.collection(TESTS_COLLECTION).doc(testId).collection(QUESTIONS_SUBCOLLECTION).doc(questionId);

        const questionData = {
            ...question,
            id: questionId,
            order: question.order ?? 0,
        };

        await questionRef.set(questionData, { merge: true });

        // Update question count in MockTest
        const questions = await this.getQuestionsByTestId(testId);
        await firestore.collection(TESTS_COLLECTION).doc(testId).update({
            questionsCount: questions.length
        });

        return questionId;
    },

    async deleteQuestion(testId: string, questionId: string) {
        await firestore.collection(TESTS_COLLECTION).doc(testId).collection(QUESTIONS_SUBCOLLECTION).doc(questionId).delete();

        // Update question count
        const questions = await this.getQuestionsByTestId(testId);
        await firestore.collection(TESTS_COLLECTION).doc(testId).update({
            questionsCount: questions.length
        });
    },

    async uploadImage(testId: string, blob: Blob): Promise<string> {
        const fileName = `questions/${testId}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const ref = storage.ref().child(fileName);
        await ref.put(blob);
        return await ref.getDownloadURL();
    },

    async uploadHtmlFile(testId: string, file: File): Promise<string> {
        const fileName = `tests/${testId}/${Date.now()}_${file.name}`;
        const ref = storage.ref().child(fileName);
        await ref.put(file);
        return await ref.getDownloadURL();
    },

    // --- User Attempts ---
    async submitAttempt(userId: string, testId: string, responses: Record<string | number, any>, score: any) {
        const attemptId = `${userId}_${testId}`;
        await firestore.collection('test_attempts').doc(attemptId).set({
            userId,
            testId,
            responses,
            score,
            submittedAt: Date.now()
        });
    },

    async getAttempt(userId: string, testId: string) {
        const doc = await firestore.collection('test_attempts').doc(`${userId}_${testId}`).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    }
};
