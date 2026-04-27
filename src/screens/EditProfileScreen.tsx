import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Input from '../components/_atoms/Input';
import Button from '../components/_atoms/Button';
import BackButton from '../components/_atoms/BackButton';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { updateProfile } from '../api/endpoints';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const profile = user?.profile;

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: displayName || null,
        city: city || null,
      });
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('profile.editProfile')}</Text>

          <Input
            label={t('profile.firstName')}
            value={firstName}
            onChangeText={setFirstName}
          />

          <Input
            label={t('profile.lastName')}
            value={lastName}
            onChangeText={setLastName}
          />

          <Input
            label={t('profile.displayName')}
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label={t('profile.city')}
            value={city}
            onChangeText={setCity}
          />

          <Button
            title={t('common.save')}
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />

          <Button
            title={t('common.cancel')}
            onPress={() => navigation.goBack()}
            variant="ghost"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    marginBottom: Spacing['2xl'],
    letterSpacing: -0.5,
  },
});
