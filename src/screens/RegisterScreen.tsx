import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Input from '../components/_atoms/Input';
import Button from '../components/_atoms/Button';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../types';

type Role = 'client' | 'psychologist';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const register = useAuthStore((s) => s.register);

  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setError(t('auth.confirmPassword'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        email,
        password,
        password_confirmation: confirmPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        locale: i18n.language,
      });
      navigation.goBack();
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <Text style={styles.brand}>MindTalk</Text>
            <Text style={styles.subtitle}>{t('auth.register')}</Text>
          </View>

          {/* Role selector */}
          <View style={styles.roleTabs}>
            <TouchableOpacity
              style={[styles.roleTab, role === 'client' && styles.roleTabActive]}
              onPress={() => setRole('client')}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleTabText, role === 'client' && styles.roleTabTextActive]}>
                {t('auth.registerAsClient')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleTab, role === 'psychologist' && styles.roleTabActive]}
              onPress={() => setRole('psychologist')}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleTabText, role === 'psychologist' && styles.roleTabTextActive]}>
                {t('auth.registerAsPsychologist')}
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Name fields */}
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Input
                label={t('auth.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
              />
            </View>
            <View style={styles.nameField}>
              <Input
                label={t('auth.lastName')}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
              />
            </View>
          </View>

          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title={t('auth.register')}
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t('auth.hasAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.switchLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  brand: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.ink.muted,
    marginTop: Spacing.sm,
  },
  roleTabs: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[100],
    padding: 4,
    marginBottom: Spacing.xl,
  },
  roleTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: Colors.primary.ink,
  },
  roleTabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
  },
  roleTabTextActive: {
    color: Colors.cream[50],
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameField: {
    flex: 1,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing['2xl'],
  },
  switchText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  switchLink: {
    fontSize: FontSize.sm,
    color: Colors.primary.ink,
    fontWeight: FontWeight.semibold,
  },
});
