export enum QuestionStatus {
    NOT_VISITED = 'NOT_VISITED',
    NOT_ANSWERED = 'NOT_ANSWERED',
    ANSWERED = 'ANSWERED',
    MARKED_FOR_REVIEW = 'MARKED_FOR_REVIEW',
    ANSWERED_AND_MARKED_FOR_REVIEW = 'ANSWERED_AND_MARKED_FOR_REVIEW',
}

export interface Question {
    id: string | number;
    number: number;
    text?: string;
    imageUrl?: string;
    options?: string[];
    type: string;
    correctMarks: number;
    negativeMarks: number;
    selectedOption?: number | null;
    numericAnswer?: string | null;
    status: QuestionStatus;
    _originalId?: string | number;
}

export interface Section {
    id: string;
    name: string;
    type: string;
    subType: string;
    questions: Question[];
}

export interface User {
    name: string;
    imageUrl: string;
}
