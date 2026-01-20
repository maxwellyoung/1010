import { useCallback } from 'react';
import { Share, ShareContent, Platform, Alert } from 'react-native';
import { NetworkStats } from './useNetworkStats';
import { UserProfile } from './useProfile';

interface ShareOptions {
    stats?: NetworkStats;
    profile?: UserProfile | null;
    encounterCount?: number;
    isInsideNetwork?: boolean;
}

/**
 * Hook for sharing network presence and stats with others.
 * Uses the native Share API to share encounter statistics.
 */
export const useShare = () => {
    /**
     * Share network presence stats
     */
    const sharePresence = useCallback(async (options: ShareOptions) => {
        const { stats, profile, encounterCount = 0, isInsideNetwork = false } = options;

        // Build the share message
        let message = '1010 Network\n\n';

        if (isInsideNetwork) {
            message += 'I\'m currently present in the 1010 Network - Auckland CBD\'s hyper-local presence layer.\n\n';
        } else {
            message += 'I\'m part of the 1010 Network - Auckland CBD\'s hyper-local presence layer.\n\n';
        }

        if (encounterCount > 0) {
            message += `I've had ${encounterCount} encounter${encounterCount !== 1 ? 's' : ''} in the network.\n`;
        }

        if (stats && stats.totalParticipants > 0) {
            message += `The network currently has ${stats.totalParticipants} participant${stats.totalParticipants !== 1 ? 's' : ''}.\n`;
        }

        if (profile?.joinedAt) {
            const joinDate = new Date(profile.joinedAt);
            const formattedDate = joinDate.toLocaleDateString('en-NZ', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            message += `\nMember since ${formattedDate}.\n`;
        }

        message += '\nA presence layer for this place. The network remembers you here.';

        const shareContent: ShareContent = {
            message,
            title: '1010 Network',
        };

        // On iOS, we can also set a URL if we have one
        if (Platform.OS === 'ios') {
            // Could add a URL here in the future
            // shareContent.url = 'https://1010.network';
        }

        try {
            const result = await Share.share(shareContent);

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Shared with activity type
                    console.log('[Share] Shared via:', result.activityType);
                } else {
                    // Shared
                    console.log('[Share] Shared successfully');
                }
                return true;
            } else if (result.action === Share.dismissedAction) {
                // Dismissed
                console.log('[Share] Share dismissed');
                return false;
            }
            return false;
        } catch (error) {
            console.error('[Share] Error sharing:', error);
            Alert.alert(
                'Unable to Share',
                'There was an error sharing your network presence. Please try again.'
            );
            return false;
        }
    }, []);

    /**
     * Share a simple encounter message
     */
    const shareEncounter = useCallback(async (encounterCount: number) => {
        const message = `I've had ${encounterCount} encounter${encounterCount !== 1 ? 's' : ''} in the 1010 Network - Auckland CBD's ambient presence layer.\n\nThe network remembers you here.`;

        try {
            await Share.share({
                message,
                title: '1010 Network Encounters',
            });
            return true;
        } catch (error) {
            console.error('[Share] Error sharing encounter:', error);
            return false;
        }
    }, []);

    return {
        sharePresence,
        shareEncounter,
    };
};
