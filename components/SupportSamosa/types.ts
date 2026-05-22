export interface Shoutout {
    id: string;
    name: string;
    samosas: number;
    message?: string;
    timestamp: any;
}

export interface SupportSamosaProps {
    onClose: () => void;
    user: any;
}
