import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Toast from 'react-native-toast-message';
export default function PersonalInformationScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const isDark = colorScheme === 'dark';
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if ((!username.trim() && !password.trim() && bio === user?.bio) || !user) return;

    setIsSaving(true);
    try {
      const payload: any = {};
      if (username.trim() && username !== user.username) payload.username = username.trim();
      if (password.trim()) payload.password = password.trim();
      if (bio !== user.bio) payload.bio = bio.trim();

      const response = await api.put(`/users/${user.id}`, payload);

      if (response.data) {
        // Update local store
        if (token) {
          await setAuth({ ...user, username: response.data.username || user.username, bio: response.data.bio }, token);
        }

        // Clear password field after successful update
        setPassword('');

        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your information has been changed successfully.',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.error || 'Something went wrong.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10">
          <ArrowLeft size={20} color={isDark ? '#fff' : '#000'} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text className="font-newsreader text-2xl font-bold italic text-foreground">
          Personal Info
        </Text>
        <View className="w-10" />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-8 px-8">
          <Text className="mb-8 font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
            Account Details
          </Text>
          <View className="mb-6">
            <Text className="mb-2 font-jakarta text-sm font-medium text-muted-foreground">
              Username
            </Text>
            <View className="h-14 w-full justify-center rounded-2xl bg-secondary/50 px-5">
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                className="font-jakarta text-[17px] text-foreground"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-2 font-jakarta text-sm font-medium text-muted-foreground">
              Bio
            </Text>
            <View className="w-full justify-center rounded-2xl bg-secondary/50 px-5 py-4">
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Write a short bio..."
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                className="font-jakarta text-[17px] text-foreground"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-2 font-jakarta text-sm font-medium text-muted-foreground">
              New Password
            </Text>
            <View className="h-14 w-full justify-center rounded-2xl bg-secondary/50 px-5">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password (optional)"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                className="font-jakarta text-[17px] text-foreground"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>
          <View className="mb-6">
            <Text className="mb-2 font-jakarta text-sm font-medium text-muted-foreground">
              Email
            </Text>
            <View className="h-14 w-full justify-center rounded-2xl bg-secondary/50 px-5 opacity-60">
              <Text className="font-jakarta text-[17px] text-foreground">
                contact@{user?.username || 'user'}.com
              </Text>
            </View>
            <Text className="mt-2 font-jakarta text-xs text-muted-foreground">
              Email cannot be changed currently.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-2 font-jakarta text-sm font-medium text-muted-foreground">
              Phone Number
            </Text>
            <View className="h-14 w-full justify-center rounded-2xl bg-secondary/50 px-5 opacity-60">
              <Text className="font-jakarta text-[17px] text-foreground">+1 (555) 000-0000</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`mt-6 h-14 w-full items-center justify-center rounded-full active:opacity-80 ${isSaving ? 'bg-primary/50' : 'bg-primary'}`}>
            {isSaving ? (
              <ActivityIndicator color={isDark ? '#000' : '#fff'} />
            ) : (
              <Text className="font-jakarta text-[17px] font-bold text-primary-foreground">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
