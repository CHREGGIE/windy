import { Tabs } from 'expo-router/js-tabs';
import { BottomNav } from '@/components/BottomNav';
import { color } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.background } }}>
      <Tabs.Screen name="now" options={{ title: 'Now' }} />
      <Tabs.Screen name="forecast" options={{ title: 'Forecast' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="places" options={{ title: 'Places' }} />
    </Tabs>
  );
}
