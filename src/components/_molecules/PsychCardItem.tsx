import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../_atoms/Avatar';
import StarRating from '../_atoms/StarRating';
import TrustBadge from '../_atoms/TrustBadge';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
  CARD_BAND_COLORS,
} from '../../constants/theme';
import { useLocale } from '../../hooks/useLocale';
import { getDisplayName } from '../../utils/helpers';
import type { PsychCard, RootStackParamList } from '../../types';

interface Props {
  item: PsychCard;
  index?: number;
}

export default function PsychCardItem({ item, index = 0 }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { localize } = useLocale();
  const bandColor = CARD_BAND_COLORS[index % CARD_BAND_COLORS.length];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('PsychologistDetail', { slug: item.slug })}
    >
      {/* Top accent band — matches website h-[92px] */}
      <View style={[styles.topBand, { backgroundColor: bandColor }]} />

      {/* Avatar overlapping band — website: -mt-10 px-6, h-20 w-20 ring-4 ring-card */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatarRing}>
          <Avatar uri={item.avatar_url} name={getDisplayName(item)} size={80} />
        </View>
      </View>

      {/* Body content — website: px-6 pb-6 pt-3, gap-3 */}
      <View style={styles.body}>
        {/* Name + trust badge */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {getDisplayName(item)}
          </Text>
          <TrustBadge level={item.verification_level} />
        </View>

        {/* Meta line — website: text-[12px] text-ink-muted */}
        <View style={styles.metaLine}>
          <StarRating rating={item.rating_avg ?? 0} count={item.rating_count} size={12} />
          {item.years_of_experience ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{item.years_of_experience} yrs</Text>
            </>
          ) : null}
          {item.city ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Ionicons name="location-outline" size={11} color={Colors.ink.muted} />
              <Text style={styles.metaText}>{item.city}</Text>
            </>
          ) : null}
        </View>

        {/* Headline — website: line-clamp-2, text-[14px] text-ink-soft */}
        {item.headline && (
          <Text style={styles.headline} numberOfLines={2}>
            {localize(item.headline)}
          </Text>
        )}

        {/* Spec tags — website: rounded-full border border-ink/10 px-2.5 py-0.5 text-[11px] */}
        <View style={styles.specRow}>
          {item.specializations.slice(0, 3).map((s) => (
            <View key={s.slug} style={styles.specTag}>
              <Text style={styles.specTagText}>{localize(s.name)}</Text>
            </View>
          ))}
          {item.specializations.length > 3 && (
            <View style={[styles.specTag, styles.specTagMore]}>
              <Text style={styles.specTagText}>+{item.specializations.length - 3}</Text>
            </View>
          )}
        </View>

        {/* Footer — website: border-t border-ink/10 pt-4 mt-auto */}
        <View style={styles.footer}>
          <View>
            {item.displayed_price ? (
              <Text style={styles.price}>
                {item.displayed_price}{' '}
                <Text style={styles.currency}>{item.currency}</Text>
              </Text>
            ) : null}
            <Text style={styles.perSession}>per session</Text>
          </View>

          <View style={styles.footerRight}>
            {/* Language tags — website: uppercase tracking-wider text-[10px] */}
            <View style={styles.langRow}>
              {item.languages.map((l) => (
                <View key={l} style={styles.langTag}>
                  <Text style={styles.langText}>{l.toUpperCase()}</Text>
                </View>
              ))}
            </View>
            {/* Arrow button — website: h-10 w-10 rounded-full bg-ink/5 */}
            <View style={styles.arrowBtn}>
              <Ionicons name="arrow-forward" size={16} color={Colors.ink.soft} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  topBand: {
    height: 72,
  },
  avatarWrap: {
    marginTop: -40,
    paddingHorizontal: Spacing['2xl'],
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.white,
    ...Shadow.sm,
  },
  body: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  metaLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
  },
  metaText: {
    fontSize: 12,
    color: Colors.ink.muted,
  },
  headline: {
    fontSize: 14,
    lineHeight: 19,
    color: Colors.ink.soft,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specTag: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  specTagMore: {
    backgroundColor: Colors.ink[5],
  },
  specTagText: {
    fontSize: FontSize.xs,
    color: Colors.ink.soft,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
  currency: {
    fontSize: FontSize.md,
    color: Colors.ink.muted,
  },
  perSession: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    marginTop: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    gap: 4,
  },
  langTag: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  langText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 1,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ink[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
