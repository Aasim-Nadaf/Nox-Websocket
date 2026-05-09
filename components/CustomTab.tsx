import { MessageSquare, User, Users } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const bgPrimary = isDark ? '#fbf9f6' : '#1a1a1a';
  const iconPrimary = isDark ? '#fbf9f6' : '#1a1a1a';
  const iconMuted = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(245,242,237,0.35)';
  const activeBg = isDark ? '#1a1a1a' : '#fbf9f6';

  const icons: any = {
    messages: MessageSquare,
    groups: Users,
    profile: User,
  };

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: Math.max(insets.bottom, 30) }}>
      <View
        className="flex-row items-center justify-center gap-2 rounded-[40px] px-2 py-2 shadow-2xl"
        style={{ backgroundColor: bgPrimary }}>
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
              activeOpacity={0.75}
              className="items-center justify-center rounded-[32px] px-6 py-[14px]"
              style={isFocused ? { backgroundColor: activeBg } : undefined}>
              <Icon
                size={22}
                strokeWidth={isFocused ? 2.5 : 1.8}
                color={isFocused ? iconPrimary : iconMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
