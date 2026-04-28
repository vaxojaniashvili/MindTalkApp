import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Avatar from '../components/_atoms/Avatar';
import BackButton from '../components/_atoms/BackButton';
import Badge from '../components/_atoms/Badge';
import Button from '../components/_atoms/Button';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchChatMessages, sendChatMessage, startLiveSession } from '../api/endpoints';
import { getDisplayName } from '../utils/helpers';
import type { RootStackParamList, ChatMessageData } from '../types';

const POLL_INTERVAL_MS = 4000;

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen({ route }: Props) {
  const { id: sessionId } = route.params;
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const lastIdRef = useRef(0);

  // Fetch messages
  const loadMessages = useCallback(async () => {
    try {
      const { data } = await fetchChatMessages(sessionId);
      const msgs = data.messages ?? [];
      const newLastId = msgs.length > 0 ? msgs[msgs.length - 1].id : 0;
      if (newLastId !== lastIdRef.current) {
        setMessages(msgs);
        lastIdRef.current = newLastId;
      }
    } catch {
      // silent fail for polling
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Poll every 4 seconds
  useEffect(() => {
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;

    setBody('');
    setSending(true);
    try {
      const { data } = await sendChatMessage(sessionId, text);
      setMessages((prev) => [...prev, data.message]);
      lastIdRef.current = data.message.id;
    } catch {
      Alert.alert(t('common.error'));
      setBody(text);
    } finally {
      setSending(false);
    }
  };

  const handleStartLive = async () => {
    try {
      await startLiveSession(sessionId);
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessageData }) => {
      const isOwn = item.sender_id === user?.id;
      const time = new Date(item.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const hasCrisis = (item.flags?.crisis_keywords?.length ?? 0) > 0;

      return (
        <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
          <View
            style={[
              styles.bubble,
              isOwn ? styles.bubbleOwn : styles.bubbleOther,
              hasCrisis && styles.bubbleCrisis,
            ]}
          >
            {!isOwn && <Text style={styles.senderName}>{item.sender_name}</Text>}
            {item.body && <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{item.body}</Text>}
            {item.attachment_url && (
              <Text style={[styles.attachment, isOwn && styles.attachmentOwn]}>
                📎 {t('chat.attachment')}
              </Text>
            )}
            <Text style={[styles.timeText, isOwn ? styles.timeTextOwn : styles.timeTextOther]}>
              {time}
            </Text>
          </View>
        </View>
      );
    },
    [user?.id, t],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackButton />
        <ActivityIndicator color={Colors.primary.ink} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('chat.typeMessage')}</Text>
          </View>
        }
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.composer}>
          <View style={styles.composerInner}>
            <TextInput
              style={styles.composerInput}
              value={body}
              onChangeText={setBody}
              placeholder={t('chat.typeMessage')}
              placeholderTextColor={Colors.ink.muted}
              multiline
              maxLength={5000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!body.trim() || sending}
            >
              <Ionicons name="send" size={18} color={Colors.cream[50]} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream[100],
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream[50],
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['6xl'],
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },

  // Message bubbles
  bubbleRow: {
    marginBottom: Spacing.sm,
  },
  bubbleRowOwn: {
    alignItems: 'flex-end',
  },
  bubbleRowOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary.ink,
  },
  bubbleOther: {
    backgroundColor: Colors.cream[50],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleCrisis: {
    borderWidth: 2,
    borderColor: 'rgba(220,38,38,0.3)',
  },
  senderName: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  messageText: {
    fontSize: FontSize.sm,
    color: Colors.ink.DEFAULT,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: Colors.cream[50],
  },
  attachment: {
    fontSize: FontSize.xs,
    color: Colors.ink.soft,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  attachmentOwn: {
    color: Colors.cream[200],
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  timeTextOwn: {
    color: 'rgba(254,253,251,0.6)',
  },
  timeTextOther: {
    color: Colors.ink.muted,
  },

  // Composer
  composer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cream[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  composerInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.cream.DEFAULT,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.lg,
    paddingRight: 4,
    paddingVertical: 4,
  },
  composerInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.ink.DEFAULT,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
