import { useEffect, useMemo, useState } from 'react';

export type SignalGlyph = {
    id: string;
    x: number;
    y: number;
    symbol: string;
    createdAt: number;
    ttlMs: number;
};

const glyphSet = ['+', '[]', '<>', '/\\', '--', '::', 'o', 'x', '^', '~'];

export const useSignalGlyphs = (active: boolean, isInsideNetwork: boolean) => {
    const [glyphs, setGlyphs] = useState<SignalGlyph[]>([]);

    useEffect(() => {
        if (!active && !isInsideNetwork) {
            setGlyphs([]);
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.12 + Math.random() * 0.6;
            const symbol = glyphSet[Math.floor(Math.random() * glyphSet.length)];
            const glyph: SignalGlyph = {
                id: `glyph-${now}-${Math.random().toString(36).slice(2, 6)}`,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                symbol,
                createdAt: now,
                ttlMs: 12000,
            };
            setGlyphs(prev => [glyph, ...prev].slice(0, 8));
        }, active ? 4500 : 9000);
        return () => clearInterval(interval);
    }, [active, isInsideNetwork]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setGlyphs(prev => prev.filter(glyph => now - glyph.createdAt < glyph.ttlMs));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return useMemo(() => glyphs, [glyphs]);
};
