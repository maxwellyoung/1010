import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '../context/LocationContext';
import { Copy } from '../constants/Copy';

export interface Echo {
    id: string;
    message: string;
    timestamp: number;
}

export const useEchoes = () => {
    const { isInsideNetwork } = useLocation();
    const [activeEcho, setActiveEcho] = useState<Echo | null>(null);

    const triggerEcho = useCallback(() => {
        const messages = Copy.echo.messages;
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        setActiveEcho({
            id: Math.random().toString(36),
            message: randomMsg,
            timestamp: Date.now(),
        });

        // Auto-dismiss after 5s
        setTimeout(() => setActiveEcho(null), 5000);
    }, []);

    useEffect(() => {
        if (!isInsideNetwork) return;

        // Randomly trigger an echo (10% chance every 10s)
        const interval = setInterval(() => {
            if (Math.random() > 0.9) {
                triggerEcho();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isInsideNetwork, triggerEcho]);

    return { activeEcho, triggerEcho };
};
