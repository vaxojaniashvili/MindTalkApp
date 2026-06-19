import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MiraAvatar from './MiraAvatar';
import { useLocale } from '../../hooks/useLocale';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme';
import type { AiMatch, RootStackParamList } from '../../types';

type Props = {
  matches: AiMatch[];
  personaName: string;
};

/** AI-recommended psychologist matches — 1:1 with web AiMatchesSection. */
export default function AiMatchesSection({ matches, personaName }: Props) {
  const { t } = useTranslation();

  if (matches.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <MiraAvatar size={32} />
        <Text style={styles.title}>{t('ai.matches.title', { name: personaName })}</Text>
      </View>
      <View style={styles.list}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </View>
    </View>
  );
}

function MatchCard({ match }: { match: AiMatch }) {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const psych = match.psychologist;
  if (!psych) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.psychRow}>
          {psych.avatar_url ? (
            <Image source={{ uri: psych.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {psych.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.psychInfo}>
            <Text style={styles.psychName} numberOfLines={1}>
              {psych.display_name}
            </Text>
            <View style={styles.ratingRow}>
              {psych.rating_count > 0 && (
                <>
                  <Ionicons name="star" size={12} color={Colors.sand[600]} />
                  <Text style={styles.ratingText}>{psych.rating_avg.toFixed(1)}</Text>
                  <Text style={styles.ratingText}>·</Text>
                </>
              )}
              <Text style={styles.ratingText}>
                {psych.rating_count || 0} {t('ai.matches.reviews')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreCol}>
          <View style={styles.scorePill}>
            <Ionicons name="sparkles" size={11} color={Colors.primary[700]} />
            <Text style={styles.scoreText}>{Math.round(match.score)}</Text>
          </View>
          <Text style={styles.matchLabel}>{t('ai.matches.match')}</Text>
        </View>
      </View>

      <Text style={styles.reasoning}>{match.reasoning}</Text>

      {psych.specializations?.length > 0 && (
        <View style={styles.specRow}>
          {psych.specializations.slice(0, 3).map((s) => (
            <View key={s.slug} style={styles.specChip}>
              <Text style={styles.specText}>
                {typeof s.name === 'string' ? s.name : localize(s.name)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.price}>
          {psych.consultation_base_price
            ? `${psych.consultation_base_price} ${psych.currency ?? 'GEL'}`
            : ''}
        </Text>
        <View style={styles.footerBtns}>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => nav.navigate('PsychologistDetail', { slug: psych.slug })}
          >
            <Text style={styles.ghostBtnText}>{t('ai.matches.view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => nav.navigate('BookPsychologist', { slug: psych.slug })}
          >
            <Text style={styles.primaryBtnText}>{t('ai.matches.book')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary.ink },
  list: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  psychRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary[700] },
  psychInfo: { flex: 1 },
  psychName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.primary.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontSize: FontSize.xs, color: Colors.ink.muted },
  scoreCol: { alignItems: 'flex-end' },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  scoreText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary[700] },
  matchLabel: {
    fontSize: FontSize['2xs'],
    color: Colors.ink.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  reasoning: { fontSize: FontSize.sm, lineHeight: 21, color: Colors.ink.soft },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  specChip: {
    backgroundColor: 'rgba(243,227,181,0.3)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  specText: { fontSize: FontSize.xs, color: Colors.sand[700] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: FontSize.xs, color: Colors.ink.muted },
  footerBtns: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ghostBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  ghostBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.primary[700] },
  primaryBtn: {
    backgroundColor: Colors.primary.ink,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  primaryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
});
