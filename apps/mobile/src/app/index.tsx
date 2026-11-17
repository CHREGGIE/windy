import { Redirect } from 'expo-router';
import { useAppState } from '@/state/AppState';

/** New users start at onboarding; everyone else goes straight to Now. */
export default function Index() {
  const { onboarded } = useAppState();
  return <Redirect href={onboarded ? '/now' : '/onboarding'} />;
}
