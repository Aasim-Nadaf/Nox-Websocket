import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Key, Smartphone, FileText } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PrivacySecurityScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const SecurityItem = ({ icon: Icon, title, description }: any) => (
    <TouchableOpacity activeOpacity={0.7} className="mb-6 flex-row items-center justify-between border-b border-border/10 pb-6">
      <View className="flex-1 flex-row items-center pr-4">
        <View className="mr-5 h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
          <Icon size={20} color={isDark ? '#fff' : '#000'} strokeWidth={1.5} />
        </View>
        <View className="flex-1">
          <Text className="font-jakarta text-[17px] font-medium text-foreground">{title}</Text>
          <Text className="mt-1 font-jakarta text-sm text-muted-foreground">{description}</Text>
        </View>
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
        <Text className="font-newsreader text-2xl font-bold italic text-foreground">Security</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-8 px-8">
          <Text className="mb-8 font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
            Privacy & Security
          </Text>

          <SecurityItem 
            icon={Key} 
            title="Change Password" 
            description="Update your password to keep your account secure."
          />
          
          <SecurityItem 
            icon={Smartphone} 
            title="Two-Factor Authentication" 
            description="Add an extra layer of security to your account."
          />

          <SecurityItem 
            icon={FileText} 
            title="Privacy Policy" 
            description="Read our policy on how we handle your data."
          />
          
          <TouchableOpacity className="mt-8 mb-4 h-14 w-full items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 active:bg-red-500/20">
            <Text className="font-jakarta text-[17px] font-bold text-red-500">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
