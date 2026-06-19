import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

/** Crisis alert — shown on the dashboard when the client's AI profile is flagged. */
export default function CrisisBanner() {
  const { t } = useTranslation();

  return (
    <View style={styles.box} accessibilityRole="alert">
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="warning" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{t('ai.crisis.title')}</Text>
          <Text style={styles.message}>{t('ai.crisis.message')}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL('tel:112')}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={15} color="#FFFFFF" />
              <Text style={styles.callText}>{t('ai.crisis.callEmergency')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={() => Linking.openURL('mailto:TalkRestSupport@gmail.com')}
              activeOpacity={0.85}
            >
              <Text style={styles.supportText}>{t('ai.crisis.contactSupport')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const RED = {
  border: '#FCA5A5',
  bg: 'rgba(254,242,242,0.7)',
  icon: '#EF4444',
  call: '#DC2626',
  title: '#991B1B',
  body: 'rgba(127,29,29,0.9)',
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: RED.border,
    backgroundColor: RED.bg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  row: { flexDirection: 'row', gap: Spacing.lg },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RED.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: RED.title },
  message: {
    marginTop: 4,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: RED.body,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: RED.call,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  callText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  supportBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: RED.border,
    backgroundColor: '#FFFFFF',
  },
  supportText: { color: RED.title, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
