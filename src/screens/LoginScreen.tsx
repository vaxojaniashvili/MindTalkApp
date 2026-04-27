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
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../types';

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigation.goBack();
    } catch {
      setError(t('auth.loginError'));
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
          {/* Logo area */}
          <View style={styles.logoArea}>
            <Text style={styles.brand}>MindTalk</Text>
            <Text style={styles.subtitle}>{t('auth.login')}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

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
            autoComplete="password"
          />

          <TouchableOpacity>
            <Text style={styles.forgotLink}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.xl }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t('auth.noAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={styles.switchLink}>{t('auth.register')}</Text>
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
    marginBottom: Spacing['4xl'],
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
  error: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: 8,
  },
  forgotLink: {
    fontSize: FontSize.sm,
    color: Colors.primary.ink,
    textAlign: 'right',
    fontWeight: FontWeight.medium,
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
