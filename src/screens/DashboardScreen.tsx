import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Avatar from '../components/_atoms/Avatar';
import Button from '../components/_atoms/Button';
import { Card, CardContent, CardTitle } from '../components/_atoms/Card';
import Badge from '../components/_atoms/Badge';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchConsultations, fetchMyEnrollments } from '../api/endpoints';
import type { RootStackParamList, MainTabParamList, ApiConsultation, EnrollmentCard } from '../types';
import { useLocale } from '../hooks/useLocale';
import { getDisplayName } from '../utils/helpers';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show_client: 'danger',
  no_show_psych: 'danger',
  tech_issue: 'warning',
};

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data: consultData } = useQuery({
    queryKey: ['my-consultations'],
    queryFn: fetchConsultations,
    enabled: isAuth,
  });
  const { data: enrollData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: fetchMyEnrollments,
    enabled: isAuth,
  });
  const consultations = consultData?.data?.consultations ?? [];
  const enrollments = enrollData?.data?.enrollments ?? [];

  // Profile completion
  const profile = user?.profile;
  const fields = [
    profile?.first_name,
    profile?.last_name,
    profile?.display_name,
    profile?.gender,
    profile?.date_of_birth,
    profile?.country,
    profile?.city,
    profile?.preferred_language,
    profile?.avatar_url,
  ];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  const upcomingSessions = consultations.filter(
    (c) => c.status === 'scheduled' || c.status === 'in_progress',
  );

  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!isAuth) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.authHero}>
            <View style={styles.authBlobTR} />
            <View style={styles.authBlobBL} />
            <View style={styles.authIconOuter}>
              <View style={styles.authIconInner}>
                <Ionicons name="grid" size={32} color={Colors.cream[50]} />
              </View>
            </View>
            <Text style={styles.authTitle}>{t('dashboard.title')}</Text>
            <Text style={styles.authSubtitle}>{t('home.heroSubtitle')}</Text>
          </View>

          <View style={styles.authBtns}>
            <Button
              title={t('auth.login')}
              onPress={() => stackNav.navigate('Login')}
              size="lg"
              fullWidth
            />
            <Button
              title={t('auth.register')}
              onPress={() => stackNav.navigate('Register')}
              variant="outline"
              size="lg"
              fullWidth
            />
          </View>

          {/* Preview cards */}
          <View style={styles.authPreview}>
            <Text style={styles.authPreviewEyebrow}>{t('dashboard.quickActions').toUpperCase()}</Text>
            {[
              { icon: 'calendar-outline' as const, label: t('dashboard.upcomingSessions') },
              { icon: 'book-outline' as const, label: t('dashboard.myCourses') },
              { icon: 'chatbubbles-outline' as const, label: t('dashboard.chatSessions') },
            ].map((item, i) => (
              <View key={i} style={styles.authFeatureRow}>
                <View style={styles.authFeatureIcon}>
                  <Ionicons name={item.icon} size={18} color={Colors.primary.ink} />
                </View>
                <Text style={styles.authFeatureLabel}>{item.label}</Text>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.ink.muted} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Hero */}
        <LinearGradient colors={[Colors.primary[50], Colors.cream.DEFAULT]} style={styles.hero}>
          <View style={styles.heroRow}>
            <Avatar
              uri={profile?.avatar_url ?? null}
              name={profile?.display_name || user?.email || 'U'}
              size={56}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.welcomeText}>{t('dashboard.welcome')},</Text>
              <Text style={styles.userName}>
                {profile?.display_name || profile?.first_name || user?.email}
              </Text>
            </View>
          </View>

          {/* Profile completion */}
          <View style={styles.completionContainer}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionLabel}>{t('dashboard.profileCompletion')}</Text>
              <Text style={styles.completionPercent}>{completion}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: 'search' as const, label: t('home.findPsychologist'), tab: 'Psychologists' as const },
              { icon: 'book' as const, label: t('home.browseCourses'), tab: 'Courses' as const },
              { icon: 'chatbubbles' as const, label: t('dashboard.chatSessions'), tab: 'Home' as const },
              { icon: 'calendar' as const, label: t('dashboard.consultations'), tab: 'Home' as const },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionCard}
                onPress={() => tabNav.navigate(action.tab)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={24} color={Colors.primary.ink} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.upcomingSessions')}</Text>
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent>
                <Text style={styles.emptyText}>{t('dashboard.noUpcoming')}</Text>
              </CardContent>
            </Card>
          ) : (
            upcomingSessions.slice(0, 5).map((c: ApiConsultation) => (
              <Card key={c.id} style={styles.sessionCard}>
                <CardContent>
                  <View style={styles.sessionRow}>
                    <Avatar
                      uri={c.psychologist?.avatar_url ?? null}
                      name={c.psychologist ? getDisplayName(c.psychologist) : 'Unknown'}
                      size={40}
                    />
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName}>{c.psychologist ? getDisplayName(c.psychologist) : 'Unknown'}</Text>
                      <Text style={styles.sessionTime}>
                        {new Date(c.scheduled_at).toLocaleDateString()} -{' '}
                        {new Date(c.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Badge
                      label={t(`consultation.${c.status}`)}
                      variant={statusVariant[c.status] ?? 'neutral'}
                    />
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>

        {/* My Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.myCourses')}</Text>
          {enrollments.length === 0 ? (
            <Card>
              <CardContent>
                <Text style={styles.emptyText}>{t('dashboard.noCourses')}</Text>
              </CardContent>
            </Card>
          ) : (
            enrollments.slice(0, 5).map((e: EnrollmentCard) => (
              <Card key={e.id} style={styles.sessionCard}>
                <CardContent>
                  <Text style={styles.courseName}>{localize(e.course.title)}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${e.progress_percent}%` }]}
                      />
                    </View>
                    <Text style={styles.progressText}>{e.progress_percent}%</Text>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
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
  authScroll: {
    flexGrow: 1,
    paddingBottom: Spacing['4xl'],
  },
  authHero: {
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
  authBlobTR: {
    position: 'absolute',
    right: -50,
    top: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(150,211,201,0.35)',
  },
  authBlobBL: {
    position: 'absolute',
    left: -40,
    bottom: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232,201,141,0.3)',
  },
  authIconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(15,48,44,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  authIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  authSubtitle: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  authBtns: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    gap: Spacing.md,
  },
  authPreview: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
  },
  authPreviewEyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 2,
    marginBottom: Spacing.xl,
  },
  authFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  authFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  authFeatureLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    fontWeight: FontWeight.medium,
  },
  // Hero
  hero: {
    padding: Spacing.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  // Completion
  completionContainer: {
    marginTop: Spacing.xl,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  completionLabel: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
  },
  completionPercent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.cream[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.ink,
    borderRadius: 4,
  },
  // Section
  section: {
    padding: Spacing.xl,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  // Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
    textAlign: 'center',
  },
  // Sessions
  sessionCard: {
    marginBottom: Spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  sessionTime: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginTop: 2,
  },
  // Courses
  courseName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary.ink,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.ink.muted,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.lg,
  },
});
