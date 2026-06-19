import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Avatar from '../_atoms/Avatar';
import { Card, CardContent } from '../_atoms/Card';
import {
  fetchPsychologistReviews,
  fetchReviewEligibility,
  submitReview,
} from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/helpers';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import type { ApiReviewList, Review } from '../../types';

type Props = {
  slug: string;
  initialList: ApiReviewList;
};

/** Reviews block — 1:1 with web reviews-section: rating summary, distribution,
 * eligibility-gated write form, and the review list with psychologist replies. */
export default function ReviewsSection({ slug, initialList }: Props) {
  const { t, i18n } = useTranslation();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const [list, setList] = useState(initialList);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => setList(initialList), [initialList]);

  useEffect(() => {
    if (!isAuth) return;
    fetchReviewEligibility(slug)
      .then((r) => setEligible(r.data.eligible))
      .catch(() => setEligible(false));
  }, [isAuth, slug]);

  async function refresh() {
    try {
      const { data } = await fetchPsychologistReviews(slug);
      setList(data);
    } catch {
      /* ignore */
    }
  }

  const rating = list.meta.rating_avg;
  const dist = ratingDistribution(list.data);
  const locale = i18n.language === 'ka' ? 'ka-GE' : i18n.language;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t('reviews.title')}</Text>
          <Text style={styles.subtitle}>
            {t('reviews.count', { count: list.meta.rating_count })}
          </Text>
        </View>
        {eligible && !showForm && (
          <TouchableOpacity style={styles.writeBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="create-outline" size={15} color={Colors.cream[50]} />
            <Text style={styles.writeBtnText}>{t('reviews.writeReview')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating summary */}
      {rating !== null && rating !== undefined && (
        <Card style={styles.summaryCard}>
          <CardContent>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={styles.bigRating}>{rating.toFixed(1)}</Text>
                <View>
                  <View style={styles.starsRow}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={14}
                        color={i < Math.round(rating) ? Colors.sand[600] : Colors.ink[20]}
                      />
                    ))}
                  </View>
                  <Text style={styles.summaryCount}>
                    {t('reviews.count', { count: list.meta.rating_count })}
                  </Text>
                </View>
              </View>
              <View style={styles.distCol}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = dist[star] ?? 0;
                  return (
                    <View key={star} style={styles.distRow}>
                      <Text style={styles.distStar}>{star}</Text>
                      <Ionicons name="star" size={11} color={Colors.sand[600]} />
                      <View style={styles.distTrack}>
                        <View style={[styles.distFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.distPct}>{Math.round(pct)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <ReviewForm
          slug={slug}
          onCancel={() => setShowForm(false)}
          onDone={() => {
            setShowForm(false);
            setEligible(false);
            refresh();
          }}
        />
      )}

      {list.data.length === 0 ? (
        <Card>
          <CardContent>
            <Text style={styles.empty}>{t('reviews.empty')}</Text>
          </CardContent>
        </Card>
      ) : (
        list.data.map((r) => <ReviewItem key={r.id} review={r} locale={locale} />)
      )}

      {!eligible && isAuth && list.data.length > 0 && (
        <Text style={styles.ineligible}>{t('reviews.ineligibleHint')}</Text>
      )}
    </View>
  );
}

function ratingDistribution(reviews: Review[]): Record<number, number> {
  if (reviews.length === 0) return {};
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) counts[r.rating] = (counts[r.rating] ?? 0) + 1;
  const total = reviews.length;
  const out: Record<number, number> = {};
  for (const k of Object.keys(counts)) out[Number(k)] = (counts[Number(k)] / total) * 100;
  return out;
}

function ReviewForm({
  slug,
  onCancel,
  onDone,
}: {
  slug: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    if (body.length < 20) return;
    setPending(true);
    try {
      await submitReview(slug, { rating, title: title || null, body });
      onDone();
    } catch {
      setPending(false);
    }
  }

  return (
    <Card style={styles.formCard}>
      <CardContent>
        <Text style={styles.formLabel}>{t('reviews.yourRating')}</Text>
        <View style={styles.formStars}>
          {[1, 2, 3, 4, 5].map((v) => (
            <TouchableOpacity key={v} onPress={() => setRating(v)} hitSlop={6}>
              <Ionicons
                name="star"
                size={28}
                color={v <= rating ? Colors.sand[600] : Colors.ink[20]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          placeholder={t('reviews.reviewTitle')}
          placeholderTextColor={Colors.ink.muted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          style={styles.formInput}
        />
        <TextInput
          placeholder={t('reviews.reviewBody')}
          placeholderTextColor={Colors.ink.muted}
          value={body}
          onChangeText={setBody}
          maxLength={2000}
          multiline
          numberOfLines={5}
          style={[styles.formInput, styles.formTextarea]}
        />
        <View style={styles.formActions}>
          <TouchableOpacity onPress={onCancel} disabled={pending} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submit}
            disabled={pending || body.length < 20}
            style={[styles.submitBtn, (pending || body.length < 20) && styles.submitDisabled]}
          >
            {pending ? (
              <ActivityIndicator size="small" color={Colors.cream[50]} />
            ) : (
              <Text style={styles.submitText}>{t('reviews.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );
}

function ReviewItem({ review, locale }: { review: Review; locale: string }) {
  const { t } = useTranslation();
  const date = formatDate(review.created_at);
  return (
    <Card style={styles.reviewCard}>
      <CardContent>
        <View style={styles.reviewHeader}>
          <Avatar uri={review.author.avatar_url} name={review.author.display_name} size={40} />
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewName}>{review.author.display_name}</Text>
            <View style={styles.reviewSub}>
              <View style={styles.starsRow}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Ionicons
                    key={i}
                    name="star"
                    size={11}
                    color={i < review.rating ? Colors.sand[600] : Colors.ink[15]}
                  />
                ))}
              </View>
              <Text style={styles.reviewDate}>· {date}</Text>
            </View>
          </View>
        </View>
        {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
        {review.body && <Text style={styles.reviewBody}>{review.body}</Text>}
        {review.psych_reply_body && (
          <View style={styles.replyBox}>
            <Text style={styles.replyLabel}>{t('reviews.psychReply')}</Text>
            <Text style={styles.replyText}>{review.psych_reply_body}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { padding: Spacing.xl, gap: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.primary.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm, color: Colors.ink.muted, marginTop: 2 },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary.ink,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  writeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
  summaryCard: {},
  summaryRow: { flexDirection: 'row', gap: Spacing.xl, alignItems: 'center' },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bigRating: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.primary.ink },
  starsRow: { flexDirection: 'row', gap: 1 },
  summaryCount: {
    fontSize: FontSize['2xs'],
    color: Colors.ink.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  distCol: { flex: 1, gap: 5 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distStar: { width: 10, fontSize: FontSize.xs, color: Colors.ink.muted },
  distTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.ink[5], overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary.ink },
  distPct: { width: 32, textAlign: 'right', fontSize: FontSize.xs, color: Colors.ink.muted },
  empty: { textAlign: 'center', paddingVertical: Spacing.xl, fontSize: FontSize.sm, color: Colors.ink.muted },
  ineligible: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.ink.muted },
  formCard: {},
  formLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formStars: { flexDirection: 'row', gap: 4, marginTop: Spacing.sm, marginBottom: Spacing.md },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.cream[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.md,
  },
  formTextarea: { minHeight: 110, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  cancelBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  cancelText: { fontSize: FontSize.sm, color: Colors.ink.soft },
  submitBtn: {
    backgroundColor: Colors.primary.ink,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
  reviewCard: {},
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  reviewMeta: { flex: 1, gap: 2 },
  reviewName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.ink.DEFAULT },
  reviewSub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewDate: { fontSize: FontSize.xs, color: Colors.ink.muted },
  reviewTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.primary.ink, marginTop: 4 },
  reviewBody: { fontSize: FontSize.sm, color: Colors.ink.soft, lineHeight: 20, marginTop: 2 },
  replyBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary.ink,
    borderRadius: BorderRadius.sm,
  },
  replyLabel: {
    fontSize: FontSize['2xs'],
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  replyText: { fontSize: FontSize.sm, color: Colors.ink.soft, marginTop: 4 },
});
