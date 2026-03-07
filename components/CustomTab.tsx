import { MessageSquare, User } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

export function CustomTabBar({ state, navigation }: any) {
  const activeColor = '#ffffff';
  const inactiveColor = '#71717a';

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
              <Icon color={isFocused ? activeColor : inactiveColor} size={24} />
              {/* {isFocused && (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  layout={Layout.springify().damping(15)}
                  style={styles.tabText}>
                  {route.name === 'messages' ? 'Messages' : 'Profile'}
                </Animated.Text>
              )} */}
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
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center', // ← this centers the pill
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 35,
    height: 65,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
});
