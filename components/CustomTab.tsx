import { MessageSquare, User } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

export function CustomTabBar({ state, navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const icons: any = {
    messages: MessageSquare,
    profile: User,
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const Icon = icons[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.activeTab]}
              activeOpacity={0.7}>
              <Icon
                color={isFocused ? '#ffffff' : isDark ? '#52525b' : '#a1a1aa'} // zinc-600 dark, zinc-400 light
                size={28}
                strokeWidth={isFocused ? 2.5 : 2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.85)', // Slight transparency for a glass effect
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 32,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.15)', // Subtle highlight for active tab
  },
});
