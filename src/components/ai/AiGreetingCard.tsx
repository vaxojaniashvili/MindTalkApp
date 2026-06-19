import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MiraAvatar from './MiraAvatar';
import { updateAiPersona } from '../../api/endpoints';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

type Props = {
  greeting: string;
  personaName: string;
  isCustom: boolean;
  onRenamed?: (name: string) => void;
};

/** Mira greeting card with inline persona rename — 1:1 with web AiGreetingCard. */
export default function AiGreetingCard({ greeting, personaName, isCustom, onRenamed }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(personaName);
  const [draft, setDraft] = useState(personaName);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = draft.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      Alert.alert(t('ai.persona.invalid'));
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateAiPersona(trimmed);
      setName(data.persona.name);
      setEditing(false);
      onRenamed?.(data.persona.name);
    } catch {
      Alert.alert(t('ai.persona.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.blob} pointerEvents="none" />
      <View style={styles.row}>
        <MiraAvatar size={56} />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  maxLength={30}
                  autoFocus
                  style={styles.input}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setDraft(name);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  <Ionicons name="close" size={14} color={Colors.ink.muted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.personaName}>{name}</Text>
                <View style={styles.dot} />
                <Text style={styles.aiLabel}>AI</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDraft(name);
                    setEditing(true);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="pencil" size={13} color={Colors.ink.muted} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(243,227,181,0.6)',
    backgroundColor: Colors.cream[50],
    padding: Spacing.xl,
  },
  blob: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(239,179,154,0.15)',
  },
  row: { flexDirection: 'row', gap: Spacing.lg },
  body: { flex: 1 },
  headerRow: { marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  personaName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary[600],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary[300] },
  aiLabel: {
    fontSize: FontSize['2xs'],
    color: Colors.ink.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.primary[300],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary[700],
    minWidth: 120,
  },
  saveBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: FontSize.md,
    lineHeight: 24,
    color: Colors.primary.ink,
  },
});
