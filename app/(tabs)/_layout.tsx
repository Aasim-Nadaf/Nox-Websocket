import { CustomTabBar } from '@/components/CustomTab';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen name="messages" />
        <Tabs.Screen name="groups" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
