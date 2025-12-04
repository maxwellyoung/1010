import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
    id: string;
    joinedAt: string;
    activationDate: string;
    isActivated: boolean;
}

const STORAGE_KEY = '1010_PROFILE';

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setProfile(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (contact: string) => {
        // Mock profile creation
        const now = new Date();
        const activation = new Date(now);
        activation.setDate(now.getDate() + 60);

        const newProfile: UserProfile = {
            id: Math.random().toString(36).substring(7),
            joinedAt: now.toISOString(),
            activationDate: activation.toISOString(),
            isActivated: false,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
        setProfile(newProfile);
        return newProfile;
    };

    return { profile, loading, createProfile };
};
