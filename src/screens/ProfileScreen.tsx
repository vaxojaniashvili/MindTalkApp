import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Avatar from '../components/_atoms/Avatar';
import Button from '../components/_atoms/Button';
import Badge from '../components/_atoms/Badge';
import { Card, CardContent } from '../components/_atoms/Card';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useLocale } from '../hooks/useLocale';
import type { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { localize } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  // ── Unauthenticated state ──
  if (!isAuth || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.unauthScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero with blobs */}
          <View style={styles.unauthHero}>
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />
            <View style={styles.blobCenter} />

            {/* Decorative circle with icon */}
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleInner}>
                <Ionicons name="person" size={40} color={Colors.cream[50]} />
              </View>
            </View>

            <Text style={styles.unauthTitle}>{t('profile.title')}</Text>
            <Text style={styles.unauthSubtitle}>
              {t('home.heroSubtitle')}
            </Text>
          </View>

          {/* Auth buttons */}
          <View style={styles.unauthBtns}>
            <Button
              title={t('auth.login')}
              onPress={() => navigation.navigate('Login')}
              size="lg"
              fullWidth
            />
            <Button
              title={t('auth.register')}
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              size="lg"
              fullWidth
            />
          </View>

          {/* Features preview */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresEyebrow}>
              {t('dashboard.quickActions').toUpperCase()}
            </Text>
            {[
              { icon: 'chatbubbles-outline' as const, label: t('dashboard.chatSessions') },
              { icon: 'calendar-outline' as const, label: t('dashboard.consultations') },
              { icon: 'book-outline' as const, label: t('dashboard.myCourses') },
              { icon: 'notifications-outline' as const, label: t('notifications.title') },
            ].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={item.icon} size={18} color={Colors.primary.ink} />
                </View>
                <Text style={styles.featureLabel}>{item.label}</Text>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.ink.muted} />
              </View>
            ))}
          </View>

          {/* Language switcher */}
          <TouchableOpacity
            style={styles.langBtnUnauth}
            onPress={() => {
              const langs = ['ka', 'en', 'ru'];
              const idx = langs.indexOf(i18n.language);
              i18n.changeLanguage(langs[(idx + 1) % langs.length]);
            }}
          >
            <Ionicons name="language-outline" size={18} color={Colors.primary.ink} />
            <Text style={styles.langBtnText}>
              {i18n.language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Authenticated state ──
  const profile = user.profile ?? {
    first_name: null, last_name: null, display_name: null,
    gender: null, date_of_birth: null, avatar_url: null,
    country: null, city: null, preferred_language: null, marketing_consent: false,
  } as const;

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleLanguageChange = () => {
    const langs = ['ka', 'en', 'ru'];
    const currentIdx = langs.indexOf(i18n.language);
    const next = langs[(currentIdx + 1) % langs.length];
    i18n.changeLanguage(next);
  };

  const infoRows = [
    { label: t('auth.email'), value: user.email, icon: 'mail-outline' as const },
    { label: t('profile.firstName'), value: profile.first_name, icon: 'person-outline' as const },
    { label: t('profile.lastName'), value: profile.last_name, icon: 'person-outline' as const },
    {
      label: t('profile.gender'),
      value: profile.gender
        ? t(`profile.${profile.gender === 'prefer_not' ? 'preferNot' : profile.gender}`)
        : null,
      icon: 'body-outline' as const,
    },
    { label: t('profile.dateOfBirth'), value: profile.date_of_birth, icon: 'calendar-outline' as const },
    { label: t('profile.country'), value: profile.country ? localize(profile.country.name) : null, icon: 'globe-outline' as const },
    { label: t('profile.city'), value: profile.city, icon: 'location-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar
            uri={profile.avatar_url}
            name={profile.display_name || user.email}
            size={80}
          />
          <Text style={styles.displayName}>
            {profile.display_name || profile.first_name || user.email}
          </Text>
          {user.roles.length > 0 && (
            <View style={styles.roles}>
              {user.roles.map((r) => (
                <Badge key={r} label={r} variant="primary" />
              ))}
            </View>
          )}
        </View>

        {/* Account Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountStatus')}</Text>
          <Card>
            <CardContent style={styles.statusContent}>
              <View style={styles.statusRow}>
                <Ionicons
                  name={user.email_verified_at ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={user.email_verified_at ? Colors.success : Colors.ink.muted}
                />
                <Text style={styles.statusText}>{t('profile.emailVerified')}</Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons
                  name={user.two_factor_enabled ? 'shield-checkmark' : 'shield-outline'}
                  size={20}
                  color={user.two_factor_enabled ? Colors.success : Colors.ink.muted}
                />
                <Text style={styles.statusText}>{t('profile.twoFactor')}</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('profile.title')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editLink}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>
          </View>
          <Card>
            <CardContent>
              {infoRows.map((row, i) => (
                <View
                  key={i}
                  style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}
                >
                  <View style={styles.infoLabel}>
                    <Ionicons name={row.icon} size={18} color={Colors.ink.muted} />
                    <Text style={styles.infoLabelText}>{row.label}</Text>
                  </View>
                  <Text style={styles.infoValue}>{row.value || '-'}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>

        {/* Language Switch */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.langButton} onPress={handleLanguageChange}>
            <Ionicons name="language-outline" size={20} color={Colors.primary.ink} />
            <Text style={styles.langText}>
              {t('profile.language')}: {i18n.language.toUpperCase()}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.ink.muted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title={t('auth.logout')}
            onPress={handleLogout}
            variant="destructive"
            fullWidth
            icon={<Ionicons name="log-out-outline" size={18} color={Colors.cream[50]} />}
          />
        </View>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },

  // ── Unauthenticated ──
  unauthScroll: {
    flexGrow: 1,
    paddingBottom: Spacing['4xl'],
  },
  unauthHero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.cream[100],
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  blobTopRight: {
    position: 'absolute',
    right: -50,
    top: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232,201,141,0.35)',
  },
  blobBottomLeft: {
    position: 'absolute',
    left: -40,
    bottom: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239,179,154,0.3)',
  },
  blobCenter: {
    position: 'absolute',
    right: 60,
    bottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(150,211,201,0.35)',
  },
  iconCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(15,48,44,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircleInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unauthTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  unauthSubtitle: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  unauthBtns: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    gap: Spacing.md,
  },

  // Features preview
  featuresSection: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
  },
  featuresEyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 2,
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    fontWeight: FontWeight.medium,
  },

  // Language button (unauth)
  langBtnUnauth: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[50],
  },
  langBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary.ink,
    letterSpacing: 1,
  },

  // ── Authenticated ──
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
    backgroundColor: Colors.cream[50],
    ...Shadow.sm,
  },
  displayName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    marginTop: Spacing.md,
    letterSpacing: -0.5,
  },
  roles: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  // Section
  section: {
    padding: Spacing.xl,
    paddingBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  editLink: {
    fontSize: FontSize.sm,
    color: Colors.primary.ink,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.lg,
  },
  // Status
  statusContent: {
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
  },
  // Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabelText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  infoValue: {
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    fontWeight: FontWeight.medium,
  },
  // Language
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  langText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    fontWeight: FontWeight.medium,
  },
});
