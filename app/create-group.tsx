import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      // Filter out self
      setUsers(data.filter((u: any) => u.id !== currentUser?.id));
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error loading users' });
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      return Toast.show({ type: 'error', text1: 'Group name is required' });
    }
    if (selectedIds.size === 0) {
      return Toast.show({ type: 'error', text1: 'Select at least one member' });
    }

    setCreating(true);
    try {
      const participantIds = [currentUser?.id, ...Array.from(selectedIds)];
      await api.post('/groups', {
        name: name.trim(),
        participantIds
      });
      Toast.show({ type: 'success', text1: 'Group created!' });
      router.back();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to create group' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className="font-newsreader text-2xl font-bold text-foreground">
          New Group
        </Text>
        <TouchableOpacity 
          onPress={handleCreate} 
          disabled={creating || !name.trim() || selectedIds.size === 0}
          className={`px-4 py-2 rounded-full ${(!name.trim() || selectedIds.size === 0) ? 'opacity-50' : 'bg-foreground'}`}>
          <Text className={`font-jakarta text-sm font-bold ${isDark ? 'text-black' : 'text-white'}`}>
            {creating ? '...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Name Input */}
        <View className="mb-8">
          <Text className="mb-2 font-jakarta text-sm font-medium text-muted-foreground">
            Group Name
          </Text>
          <View className="h-14 w-full justify-center rounded-2xl bg-secondary/50 px-5">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="E.g. Weekend Trip"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              className="font-jakarta text-[17px] text-foreground"
            />
          </View>
        </View>

        <Text className="mb-4 font-jakarta text-sm font-medium text-muted-foreground">
          Select Members ({selectedIds.size})
        </Text>

        {loading ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          users.map((u) => (
            <TouchableOpacity
              key={u.id}
              activeOpacity={0.7}
              onPress={() => toggleUser(u.id)}
              className="mb-4 flex-row items-center justify-between rounded-2xl bg-secondary/30 p-4">
              <Text className="font-jakarta text-[17px] font-medium text-foreground">
                {u.username}
              </Text>
              <View className={`h-6 w-6 rounded-full border items-center justify-center ${selectedIds.has(u.id) ? 'bg-foreground border-foreground' : 'border-muted-foreground/30'}`}>
                {selectedIds.has(u.id) && <Check size={14} color={isDark ? '#000' : '#fff'} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
