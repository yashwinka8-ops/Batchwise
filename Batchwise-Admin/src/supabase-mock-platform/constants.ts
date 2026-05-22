import { Question, Subject, QuestionType } from './types';

export const MOCK_QUESTIONS: Question[] = [];

const SUBJECTS = [Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS];

let idCounter = 1;

SUBJECTS.forEach(subject => {
  // Section A: 20 MCQs
  for (let i = 1; i <= 20; i++) {
    MOCK_QUESTIONS.push({
      id: idCounter++,
      subject,
      type: QuestionType.MCQ,
      text: `Question ${i} of ${subject} (Section A - MCQ)`,
      imageUrl: `https://placehold.co/800x200/png?text=${subject}+MCQ+Q${i}+Image`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctOptionIndex: 0 // Default mock answer
    });
  }

  // Section B: 10 Numerical
  for (let i = 1; i <= 10; i++) {
    MOCK_QUESTIONS.push({
      id: idCounter++,
      subject,
      type: QuestionType.NUMERICAL,
      text: `Question ${i} of ${subject} (Section B - Numerical Value)`,
      imageUrl: `https://placehold.co/800x200/png?text=${subject}+Numerical+Q${i}+Image`,
      correctNumericAnswer: "5" // Default mock answer
    });
  }
});
