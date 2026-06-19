import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fetchRefundEligibility, requestRefund } from '../../api/endpoints';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import type { RefundEligibility } from '../../types';

type Props = {
  orderId: string;
};

/** Refund request flow — 1:1 with web refund-request-button. */
export default function RefundRequestButton({ orderId }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const openModal = async () => {
    setError(null);
    setSuccess(false);
    setReason('');
    setOpen(true);
    setLoading(true);
    try {
      const { data } = await fetchRefundEligibility(orderId);
      setEligibility(data);
    } catch {
      setEligibility({ eligible: false, reason: t('refund.checkFailed') });
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (reason.trim().length < 10) {
      setError(t('refund.reasonRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestRefund(orderId, reason.trim());
      setSuccess(true);
    } catch (err: any) {
      const errors = (err?.response?.data?.errors ?? {}) as Record<string, string[]>;
      const firstErr =
        Object.values(errors)[0]?.[0] ??
        err?.response?.data?.message ??
        t('refund.sendFailed');
      setError(firstErr as string);
    } finally {
      setSubmitting(false);
    }
  };

  const watched = Math.round((eligibility?.watched_seconds ?? 0) / 60);
  const max = Math.round((eligibility?.max_watch_seconds ?? 1800) / 60);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={openModal}>
        <Ionicons name="refresh-outline" size={14} color={Colors.ink.soft} />
        <Text style={styles.triggerText}>{t('refund.button')}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('refund.title')}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={Colors.ink.muted} />
              </TouchableOpacity>
            </View>

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{t('refund.success')}</Text>
              </View>
            ) : loading ? (
              <ActivityIndicator color={Colors.ink.muted} style={{ paddingVertical: Spacing['3xl'] }} />
            ) : eligibility && !eligibility.eligible ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>
                  {eligibility.reason ?? t('refund.ineligible', { watched, max })}
                </Text>
              </View>
            ) : eligibility ? (
              <>
                <View style={styles.eligibleBox}>
                  <Text style={styles.eligibleText}>
                    {t('refund.eligible', {
                      watched,
                      max,
                      amount: (eligibility.amount ?? 0).toFixed(2),
                      currency: eligibility.currency ?? 'GEL',
                    })}
                  </Text>
                </View>
                <Text style={styles.label}>{t('refund.reasonLabel')}</Text>
                <TextInput
                  style={styles.textarea}
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t('refund.reasonPlaceholder')}
                  placeholderTextColor={Colors.ink.muted}
                  multiline
                  numberOfLines={4}
                />
                {error && <Text style={styles.errorMsg}>{error}</Text>}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
                    <Text style={styles.cancelText}>{t('refund.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator size="small" color={Colors.cream[50]} />
                    ) : (
                      <Text style={styles.submitText}>{t('refund.submit')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  triggerText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.ink.soft },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,48,44,0.4)',
    padding: Spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.primary.ink },
  successBox: {
    borderWidth: 1,
    borderColor: 'rgba(59,128,77,0.3)',
    backgroundColor: 'rgba(59,128,77,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  successText: { fontSize: FontSize.sm, color: Colors.success, lineHeight: 20 },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(176,74,62,0.3)',
    backgroundColor: 'rgba(176,74,62,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  errorBoxText: { fontSize: FontSize.sm, color: Colors.danger, lineHeight: 20 },
  eligibleBox: {
    borderWidth: 1,
    borderColor: 'rgba(59,128,77,0.3)',
    backgroundColor: 'rgba(59,128,77,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  eligibleText: { fontSize: FontSize.sm, color: Colors.ink.soft, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.primary.ink, marginBottom: 6 },
  textarea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.ink.DEFAULT,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorMsg: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.danger },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.lg },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  cancelText: { fontSize: FontSize.sm, color: Colors.ink.soft },
  submitBtn: {
    backgroundColor: Colors.primary.ink,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  submitText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.cream[50] },
});
