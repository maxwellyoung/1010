import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';

export interface Echo {
    id: string;
    message: string;
    timestamp: number;
}

export const useEchoes = () => {
    const { isInsideNetwork } = useLocation();
    const [activeEcho, setActiveEcho] = useState<Echo | null>(null);

    useEffect(() => {
        if (!isInsideNetwork) return;

        // Randomly trigger an echo
        const interval = setInterval(() => {
            if (Math.random() > 0.9) { // 10% chance every check
                triggerEcho();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isInsideNetwork]);

    const triggerEcho = () => {
        const messages = [
            "THE SIGNAL IS THIN HERE.",
            "SOMEONE WALKED THIS PATH YESTERDAY.",
            "LOOK UP. THE WINDOW IS OPEN.",
            "1010 REMEMBERS.",
            "STATIC IN THE AIR.",
        ];

        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        setActiveEcho({
            id: Math.random().toString(36),
            message: randomMsg,
            timestamp: Date.now(),
        });

        // Auto-dismiss after 5s
        setTimeout(() => setActiveEcho(null), 5000);
    };

    return { activeEcho, triggerEcho };
};
