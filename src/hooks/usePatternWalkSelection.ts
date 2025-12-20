import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '1010_PATTERN_WALK';

export const usePatternWalkSelection = () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setSelectedId(stored);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateSelection = async (id: string | null) => {
        setSelectedId(id);
        if (!id) {
            await AsyncStorage.removeItem(STORAGE_KEY);
            return;
        }
        await AsyncStorage.setItem(STORAGE_KEY, id);
    };

    return { selectedId, setSelectedId: updateSelection, loading };
};
