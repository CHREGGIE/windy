import { Redirect } from 'expo-router';

/** A new user starts at onboarding. Persisting "already onboarded" arrives with accounts. */
export default function Index() {
  return <Redirect href="/onboarding" />;
}
