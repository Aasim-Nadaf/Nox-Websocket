import React from 'react';
import { View, Text } from 'react-native';
import { ToastConfig, BaseToastProps } from 'react-native-toast-message';
import { CheckCircle2, XCircle, Info } from 'lucide-react-native';

const MinimalToast = ({
  text1,
  text2,
  icon: Icon,
  iconColor,
}: BaseToastProps & { icon: any; iconColor: string }) => (
  <View className="mt-4 flex-row items-center rounded-full border border-zinc-200/80 bg-white px-5 py-3.5 shadow-sm shadow-black/5 dark:border-zinc-800/80 dark:bg-zinc-900">
    <Icon size={18} color={iconColor} strokeWidth={2.5} />
    <View className="ml-3 flex-shrink">
      {text1 && !text2 && (
        <Text className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{text1}</Text>
      )}
      {text2 && !text1 && (
        <Text className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">{text2}</Text>
      )}
      {text1 && text2 && (
        <Text className="text-[14px]">
          <Text className="font-semibold text-zinc-900 dark:text-zinc-100">{text1} </Text>
          <Text className="font-medium text-zinc-500 dark:text-zinc-400">· {text2}</Text>
        </Text>
      )}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  success: (props) => <MinimalToast {...props} icon={CheckCircle2} iconColor="#10b981" />,
  error: (props) => <MinimalToast {...props} icon={XCircle} iconColor="#ef4444" />,
  info: (props) => <MinimalToast {...props} icon={Info} iconColor="#3b82f6" />,
};

