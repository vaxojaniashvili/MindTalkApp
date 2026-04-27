import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Button from '../components/_atoms/Button';
import PsychCardItem from '../components/_molecules/PsychCardItem';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';
import { fetchPsychologists, fetchSpecializations } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import type { MainTabParamList, PsychCard, Specialization } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const { data: psychData } = useQuery({
    queryKey: ['featured-psychologists'],
    queryFn: () => fetchPsychologists({ per_page: 6, sort: 'rating' }),
  });

  const { data: specData } = useQuery({
    queryKey: ['specializations'],
    queryFn: fetchSpecializations,
  });

  const psychologists = psychData?.data?.data ?? [];
  const specializations = specData?.data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── HERO ─── */}
        <View style={styles.hero}>
          {/* Decorative blobs */}
          <View style={styles.blobRight} />
          <View style={styles.blobLeft} />
          <View style={styles.blobCenter} />

          {/* Eyebrow */}
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>MINDTALK</Text>
          </View>

          {/* Title — serif, editorial */}
          <Text style={styles.heroTitle}>
            {t('home.heroTitle')}
          </Text>

          <Text style={styles.heroSubtitle}>
            {t('home.heroSubtitle')}
          </Text>

          <View style={styles.heroBtns}>
            <Button
              title={t('home.findPsychologist')}
              onPress={() => tabNav.navigate('Psychologists')}
              size="lg"
            />
            <Button
              title={t('home.browseCourses')}
              onPress={() => tabNav.navigate('Courses')}
              variant="outline"
              size="lg"
            />
          </View>
        </View>

        {/* ─── STATS STRIP ─── border-y, grid, serif numbers */}
        <View style={styles.statsStrip}>
          {[
            { value: '150+', label: t('home.specialists') },
            { value: '5,000+', label: t('home.completedSessions') },
            { value: '4.8', label: t('home.averageRating') },
            { value: '12+', label: t('home.countriesServed') },
          ].map((s, i) => (
            <View
              key={s.label}
              style={[styles.statCell, i > 0 && styles.statCellBorder]}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── SPECIALIZATIONS ─── */}
        {specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>
              {t('home.popularSpecializations').toUpperCase()}
            </Text>
            <FlatList
              data={specializations.slice(0, 12)}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specList}
              renderItem={({ item }: { item: Specialization }) => (
                <TouchableOpacity
                  style={styles.specPill}
                  activeOpacity={0.7}
                  onPress={() => tabNav.navigate('Psychologists')}
                >
                  <Text style={styles.specPillText}>{localize(item.name)}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={12}
                    color={Colors.ink.muted}
                    style={{ opacity: 0.4 }}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ─── FEATURED PSYCHOLOGISTS ─── */}
        {psychologists.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t('home.featuredPsychologists')}
              </Text>
              <TouchableOpacity onPress={() => tabNav.navigate('Psychologists')}>
                <Text style={styles.seeAllLink}>{t('common.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={psychologists}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.psychList}
              renderItem={({ item, index }: { item: PsychCard; index: number }) => (
                <View style={{ width: width * 0.78, marginRight: Spacing.lg }}>
                  <PsychCardItem item={item} index={index} />
                </View>
              )}
            />
          </View>
        )}

        {/* ─── HOW IT WORKS ─── editorial steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.howItWorks')}</Text>
          {[
            { num: '01', icon: 'search' as const, key: 'step1' },
            { num: '02', icon: 'calendar' as const, key: 'step2' },
            { num: '03', icon: 'videocam' as const, key: 'step3' },
          ].map((step) => (
            <View key={step.key} style={styles.stepRow}>
              <Text style={styles.stepNum}>{step.num}</Text>
              <View style={styles.stepDivider} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t(`home.${step.key}Title`)}</Text>
                <Text style={styles.stepDesc}>{t(`home.${step.key}Desc`)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── PULL QUOTE ─── dark section */}
        <View style={styles.quoteSection}>
          <Ionicons
            name="chatbubble-ellipses"
            size={80}
            color="rgba(232,201,141,0.2)"
            style={styles.quoteIcon}
          />
          <Text style={styles.quoteText}>
            {'"'}Your mental health journey starts with a single step — and the right person beside you.{'"'}
          </Text>
          <View style={styles.quoteDivider} />
          <Text style={styles.quoteAuthor}>MindTalk</Text>
        </View>

        {/* ─── PSYCHOLOGIST CTA ─── */}
        <View style={styles.section}>
          <View style={styles.ctaBox}>
            <View style={styles.ctaBlobTR} />
            <View style={styles.ctaBlobBL} />
            <Text style={styles.ctaEyebrow}>FOR PSYCHOLOGISTS</Text>
            <Text style={styles.ctaTitle}>Join Our Network</Text>
            <Text style={styles.ctaBody}>
              Connect with clients worldwide and grow your practice on a platform built for mental health professionals.
            </Text>
            <Button
              title="Learn More"
              onPress={() => {}}
              variant="primary"
              size="md"
              style={{ alignSelf: 'flex-start', marginTop: Spacing.lg }}
            />
          </View>
        </View>

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  scroll: {
    flex: 1,
  },

  // ── Hero ──
  hero: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['5xl'],
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.cream[100],
  },
  blobRight: {
    position: 'absolute',
    right: -40,
    top: 0,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232,201,141,0.35)',
  },
  blobLeft: {
    position: 'absolute',
    left: -30,
    bottom: 0,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(239,179,154,0.3)',
  },
  blobCenter: {
    position: 'absolute',
    right: 40,
    bottom: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(150,211,201,0.4)',
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.terracotta[600],
  },
  eyebrowText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: Spacing.lg,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.ink.soft,
    lineHeight: 26,
    marginBottom: Spacing['3xl'],
    maxWidth: 320,
  },
  heroBtns: {
    gap: Spacing.md,
  },

  // ── Stats Strip ──
  statsStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(250,248,243,0.5)',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  statCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Section ──
  section: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
  },
  sectionEyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 2,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllLink: {
    fontSize: FontSize.sm,
    color: Colors.primary[700],
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xl,
  },

  // ── Specialization Pills ──
  specList: {
    gap: 10,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ink[15],
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  specPillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },

  // ── Psychologists Carousel ──
  psychList: {
    paddingRight: Spacing['2xl'],
  },

  // ── How It Works ──
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  stepNum: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.medium,
    color: Colors.terracotta[600],
    width: 50,
    letterSpacing: -1,
  },
  stepDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.ink[20],
    marginTop: 8,
  },
  stepContent: {
    flex: 1,
    gap: 6,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.2,
  },
  stepDesc: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    lineHeight: 22,
  },

  // ── Pull Quote ──
  quoteSection: {
    backgroundColor: Colors.primary.ink,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['6xl'],
    marginTop: Spacing['4xl'],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteIcon: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  quoteText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.normal,
    fontStyle: 'italic',
    color: Colors.cream[50],
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  quoteDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(232,201,141,0.4)',
    marginVertical: Spacing.xl,
  },
  quoteAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.cream[300],
    letterSpacing: 1,
  },

  // ── CTA Box ──
  ctaBox: {
    backgroundColor: 'rgba(243,227,181,0.4)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['3xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  ctaBlobTR: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239,179,154,0.4)',
  },
  ctaBlobBL: {
    position: 'absolute',
    left: -50,
    bottom: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(150,211,201,0.3)',
  },
  ctaEyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.terracotta[700],
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  ctaTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  ctaBody: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    lineHeight: 22,
    maxWidth: 340,
  },
});
