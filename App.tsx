import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AppProviders from './src/providers/AppProviders';
import MainAppNavigator from './src/core/navigation/MainAppNavigator';
import { useAuthStore } from './src/store/authStore';
import { Colors } from './src/constants/theme';

function AppContent() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.cream.DEFAULT }}>
        <ActivityIndicator size="large" color={Colors.primary.ink} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <MainAppNavigator />
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
