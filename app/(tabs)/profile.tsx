import React from 'react';
import { View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';
import {
  LogOut,
  ChevronRight,
  Bell,
  User as UserIcon,
  Shield,
  Palette,
  Globe,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const MenuItem = ({ icon: Icon, label, value, onPress, isDestructive }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="mb-6 flex-row items-center justify-between border-b border-border/10 pb-6">
      <View className="flex-row items-center">
        <View className="mr-5 h-10 w-10 items-center justify-center rounded-full bg-secondary/50">
          <Icon
            size={18}
            color={isDestructive ? '#ef4444' : isDark ? '#fff' : '#000'}
            strokeWidth={1.5}
          />
        </View>
        <Text
          className={`font-jakarta text-[17px] font-medium ${isDestructive ? 'text-red-500' : 'text-foreground'}`}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center">
        {value && (
          <Text className="mr-3 font-jakarta text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-60">
            {value}
          </Text>
        )}
        <ChevronRight size={16} color={isDark ? '#444' : '#ccc'} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10">
          <ArrowLeft size={20} color={isDark ? '#fff' : '#000'} strokeWidth={1.5} />
        </TouchableOpacity>

        <Text className="font-newsreader text-2xl font-bold italic text-foreground">Profile</Text>

        <TouchableOpacity className="w-10 items-end">
          <MoreVertical size={20} color={isDark ? '#fff' : '#000'} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* User Identity Section */}
        <View className="mt-12 items-center px-6">
          <View className="relative h-32 w-32 items-center justify-center rounded-full bg-secondary p-1">
            <View className="h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-background">
              <Image
                source={{ uri: `https://i.pravatar.cc/150?u=${user?.username}` }}
                className="h-full w-full opacity-90 grayscale"
                resizeMode="cover"
              />
            </View>
            <View className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-background bg-primary" />
          </View>

          <Text className="mt-8 font-newsreader text-3xl font-bold italic text-foreground">
            {user?.username || 'Guest User'}
          </Text>
          <Text className="mt-2 font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
            ARCHIVIST & ATHLETE
          </Text>
        </View>

        {/* Menu Sections */}
        <View className="mt-16 px-8">
          {/* Account Section */}
          <Text className="mb-10 font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
            Account
          </Text>

          <MenuItem icon={UserIcon} label="Personal Information" />
          <MenuItem icon={Bell} label="Notifications" />
          <MenuItem icon={Shield} label="Privacy & Security" />

          {/* Preferences Section */}
          <Text className="mb-10 mt-6 font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
            Preferences
          </Text>

          <MenuItem
            icon={Palette}
            label="Appearance"
            value={isDark ? 'Carbon' : 'Chalk'}
            onPress={toggleTheme}
          />
          <MenuItem icon={Globe} label="Language" value="EN-US" />

          {/* Destructive Actions */}
          <Dialog>
            <DialogTrigger asChild>
              <View className="mt-6">
                <MenuItem icon={LogOut} label="Logout" isDestructive />
              </View>
            </DialogTrigger>
            <DialogContent className="w-[340px] rounded-[32px] border border-border/20 bg-background p-6 shadow-2xl">
              <DialogHeader className="mt-2 items-center gap-1">
                <DialogTitle className="font-newsreader text-2xl font-bold italic tracking-tight text-foreground">
                  Sign Out
                </DialogTitle>
                <DialogDescription className="mt-2 px-2 text-center font-jakarta text-[15px] leading-relaxed text-muted-foreground">
                  Are you sure you want to sign out of your account?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-10 flex-col gap-3">
                <DialogClose asChild>
                  <TouchableOpacity
                    onPress={() => {
                      logout();
                      Toast.show({
                        type: 'success',
                        text1: 'Signed Out',
                        text2: 'Session ended successfully.',
                      });
                    }}
                    className="h-16 w-full items-center justify-center rounded-full bg-red-500 shadow-sm active:bg-red-600">
                    <Text className="font-jakarta text-[17px] font-bold text-white">Log out</Text>
                  </TouchableOpacity>
                </DialogClose>
                <DialogClose asChild>
                  <TouchableOpacity className="h-16 w-full items-center justify-center rounded-full bg-secondary active:opacity-80">
                    <Text className="font-jakarta text-[17px] font-bold text-foreground">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </View>
      </ScrollView>

      {/* Persistence visuals matching Stitch profile */}
      {/* <View 
        className="absolute bottom-10 self-center bg-secondary/80 rounded-full flex-row p-2 backdrop-blur-xl border border-border/10 shadow-2xl"
        style={{ paddingHorizontal: 8 }}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/messages')}
          className="px-10 py-4 rounded-full">
          <View className="h-5 w-5 bg-muted-foreground opacity-20 rounded-sm" />
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-10 py-4 rounded-full bg-primary shadow-sm">
          <View className="h-5 w-5 bg-primary-foreground rounded-full" />
        </TouchableOpacity>
      </View> */}
    </View>
  );
}
