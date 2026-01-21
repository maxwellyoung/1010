import { Redirect } from 'expo-router';

export default function Index() {
    // Go straight to onboarding - location permission is requested there
    return <Redirect href="/onboarding" />;
}
