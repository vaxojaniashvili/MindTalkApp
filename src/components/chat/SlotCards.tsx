import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { bookSlot, sendSlotOffer } from '../../api/endpoints';
import { formatDateTime } from '../../utils/helpers';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import type {
  ChatMessageData,
  ChatSessionData,
  RootStackParamList,
} from '../../types';

const DURATION_OPTIONS = [30, 45, 60, 90];

function fmtDateTime(iso: string, _locale: string) {
  return formatDateTime(iso);
}

/* ─── Slot offer (psychologist → client) ─── */
export function SlotOfferCard({
  message,
  session,
  viewerIsPsy,
  locale,
}: {
  message: ChatMessageData;
  session: ChatSessionData;
  viewerIsPsy: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const slots = message.meta?.slots ?? [];
  const price = session.booking?.consultation_price ?? 0;
  const currency = session.booking?.currency ?? 'GEL';

  async function choose(slotId: string, startUtc: string) {
    setLoadingId(slotId);
    try {
      const { data } = await bookSlot(session.id, startUtc);
      const result = await WebBrowser.openBrowserAsync(data.redirect_url);
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // user closed the payment sheet — refresh handled by screen on focus
      }
    } catch (err: any) {
      Alert.alert(err?.response?.data?.message ?? t('common.error'));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <View style={styles.offerWrap}>
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <Ionicons name="calendar-outline" size={16} color={Colors.terracotta[700]} />
          <Text style={styles.offerTitle}>{t('chat.booking.offerTitle')}</Text>
          {!viewerIsPsy && (
            <Text style={styles.offerPrice}>
              {price} {currency}
            </Text>
          )}
        </View>
        <View style={styles.offerBody}>
          {slots.length === 0 && <Text style={styles.muted}>—</Text>}
          {slots.map((slot) => {
            const isBooked = slot.status === 'booked';
            return (
              <View key={slot.id} style={[styles.slotRow, isBooked && styles.slotBooked]}>
                <Ionicons name="time-outline" size={16} color={Colors.ink.muted} />
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTime}>{fmtDateTime(slot.start_utc, locale)}</Text>
                  <Text style={styles.slotDur}>
                    {slot.duration_min} {t('availability.minutes')}
                  </Text>
                </View>
                {isBooked ? (
                  <View style={styles.bookedTag}>
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                    <Text style={styles.bookedTagText}>{t('chat.booking.booked')}</Text>
                  </View>
                ) : viewerIsPsy ? (
                  <Text style={styles.muted}>{t('chat.booking.open')}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.chooseBtn}
                    onPress={() => choose(slot.id, slot.start_utc)}
                    disabled={loadingId !== null}
                  >
                    {loadingId === slot.id ? (
                      <ActivityIndicator size="small" color={Colors.cream[50]} />
                    ) : (
                      <Ionicons name="checkmark" size={14} color={Colors.cream[50]} />
                    )}
                    <Text style={styles.chooseBtnText}>{t('chat.booking.choose')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* ─── Slot booked confirmation ─── */
export function SlotBookedCard({
  message,
  locale,
}: {
  message: ChatMessageData;
  locale: string;
}) {
  const { t } = useTranslation();
  const when = message.meta?.scheduled_at;
  const meetingUrl = message.meta?.meeting_url;

  return (
    <View style={styles.bookedWrap}>
      <View style={styles.bookedCard}>
        <View style={styles.bookedIcon}>
          <Ionicons name="calendar" size={18} color={Colors.success} />
        </View>
        <Text style={styles.bookedTitle}>{t('chat.booking.bookedTitle')}</Text>
        {when && (
          <Text style={styles.bookedWhen}>
            {fmtDateTime(when, locale)}
            {message.meta?.duration_min
              ? ` · ${message.meta.duration_min} ${t('availability.minutes')}`
              : ''}
          </Text>
        )}
        {meetingUrl && (
          <TouchableOpacity style={styles.joinBtn} onPress={() => Linking.openURL(meetingUrl)}>
            <Ionicons name="videocam" size={14} color={Colors.cream[50]} />
            <Text style={styles.joinBtnText}>{t('chat.booking.join')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── Slot offer composer (psychologist) ─── */
type DraftRow = { date: string; time: string; duration: number };

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function SlotOfferComposer({
  session,
  onOfferSent,
}: {
  session: ChatSessionData;
  onOfferSent: (m: ChatMessageData) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([
    { date: tomorrowDate(), time: '10:00', duration: 60 },
  ]);

  const googleConnected = session.booking?.psychologist_google_connected ?? false;

  if (!googleConnected) {
    return (
      <View style={styles.googleWarn}>
        <Text style={styles.googleWarnText}>{t('chat.booking.googleNeeded')}</Text>
      </View>
    );
  }

  function updateRow(i: number, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { date: tomorrowDate(), time: '10:00', duration: 60 }]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function send() {
    const now = Date.now();
    const slots: { start_utc: string; duration_min: number }[] = [];
    for (const r of rows) {
      if (!r.date || !r.time) continue;
      const local = new Date(`${r.date}T${r.time}`);
      if (Number.isNaN(local.getTime()) || local.getTime() <= now) continue;
      slots.push({ start_utc: local.toISOString(), duration_min: r.duration });
    }
    if (slots.length === 0) {
      Alert.alert(t('chat.booking.pickFuture'));
      return;
    }
    setSending(true);
    try {
      const { data } = await sendSlotOffer(session.id, slots);
      onOfferSent(data.message);
      setRows([{ date: tomorrowDate(), time: '10:00', duration: 60 }]);
      setOpen(false);
    } catch (err: any) {
      Alert.alert(err?.response?.data?.message ?? t('common.error'));
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <TouchableOpacity style={styles.composerToggle} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={16} color={Colors.terracotta[700]} />
        <Text style={styles.composerToggleText}>{t('chat.booking.composerToggle')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.composerBox}>
      <View style={styles.offerHeader}>
        <Ionicons name="calendar-outline" size={16} color={Colors.terracotta[700]} />
        <Text style={styles.offerTitle}>{t('chat.booking.composerTitle')}</Text>
      </View>
      <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
        {rows.map((r, i) => (
          <View key={i} style={styles.draftRow}>
            <TextInput
              value={r.date}
              onChangeText={(v) => updateRow(i, { date: v })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.ink.muted}
              style={styles.draftInput}
            />
            <TextInput
              value={r.time}
              onChangeText={(v) => updateRow(i, { time: v })}
              placeholder="HH:MM"
              placeholderTextColor={Colors.ink.muted}
              style={[styles.draftInput, { width: 64 }]}
            />
            <View style={styles.durChips}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => updateRow(i, { duration: d })}
                  style={[styles.durChip, r.duration === d && styles.durChipActive]}
                >
                  <Text
                    style={[styles.durChipText, r.duration === d && styles.durChipTextActive]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => removeRow(i)} disabled={rows.length <= 1}>
              <Ionicons
                name="trash-outline"
                size={16}
                color={rows.length <= 1 ? Colors.ink[20] : Colors.ink.muted}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.composerActions}>
        <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
          <Ionicons name="add" size={15} color={Colors.ink.soft} />
          <Text style={styles.addRowText}>{t('chat.booking.addSlot')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendOfferBtn} onPress={send} disabled={sending}>
          {sending ? (
            <ActivityIndicator size="small" color={Colors.cream[50]} />
          ) : (
            <Ionicons name="checkmark" size={15} color={Colors.cream[50]} />
          )}
          <Text style={styles.sendOfferText}>{t('chat.booking.send')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: FontSize.sm, color: Colors.ink.muted },
  offerWrap: { width: '100%', marginVertical: Spacing.md, alignItems: 'center' },
  offerCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[50],
    overflow: 'hidden',
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream[100],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  offerTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  offerPrice: { marginLeft: 'auto', fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.ink.soft },
  offerBody: { padding: Spacing.md, gap: Spacing.sm },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  slotBooked: { backgroundColor: Colors.ink[5], opacity: 0.7 },
  slotInfo: { flex: 1 },
  slotTime: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.primary.ink },
  slotDur: { fontSize: FontSize.xs, color: Colors.ink.muted, marginTop: 2 },
  bookedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookedTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.success },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.terracotta[600],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  chooseBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
  bookedWrap: { width: '100%', marginVertical: Spacing.lg, alignItems: 'center' },
  bookedCard: {
    maxWidth: 460,
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59,128,77,0.25)',
    backgroundColor: 'rgba(59,128,77,0.06)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  bookedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59,128,77,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookedTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary.ink },
  bookedWhen: { fontSize: FontSize.sm, color: Colors.ink.soft },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary.ink,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginTop: 4,
  },
  joinBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
  googleWarn: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(212,168,78,0.3)',
    backgroundColor: 'rgba(243,227,181,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  googleWarnText: { fontSize: FontSize.sm, color: Colors.sand[700] },
  composerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(174,85,56,0.3)',
    backgroundColor: 'rgba(174,85,56,0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  composerToggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.terracotta[700] },
  composerBox: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[50],
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  draftInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: FontSize.sm,
    color: Colors.primary.ink,
    width: 120,
  },
  durChips: { flexDirection: 'row', gap: 4 },
  durChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  durChipActive: { backgroundColor: Colors.primary.ink, borderColor: Colors.primary.ink },
  durChipText: { fontSize: FontSize.xs, color: Colors.ink.soft },
  durChipTextActive: { color: Colors.cream[50], fontWeight: FontWeight.semibold },
  composerActions: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  addRowText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.ink.soft },
  sendOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    backgroundColor: Colors.terracotta[600],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
  },
  sendOfferText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
});
