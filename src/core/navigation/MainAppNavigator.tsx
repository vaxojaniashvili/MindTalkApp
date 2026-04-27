import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import TabNavigation from './TabNavigation';
import LoginScreen from '../../screens/LoginScreen';
import RegisterScreen from '../../screens/RegisterScreen';
import PsychologistDetailScreen from '../../screens/PsychologistDetailScreen';
import CourseDetailScreen from '../../screens/CourseDetailScreen';
import EditProfileScreen from '../../screens/EditProfileScreen';
import ChatSessionsScreen from '../../screens/ChatSessionsScreen';
import { Colors } from '../../constants/theme';
import type { RootStackParamList } from '../../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn} activeOpacity={0.7}>
      <Ionicons name="chevron-back" size={22} color={Colors.primary.ink} />
    </TouchableOpacity>
  );
}

export default function MainAppNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: false,
        headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
      })}
    >
      <Stack.Screen name="Main" component={TabNavigation} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PsychologistDetail" component={PsychologistDetailScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ink[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
