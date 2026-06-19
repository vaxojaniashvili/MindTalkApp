import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/_atoms/BackButton';
import { SlotOfferCard, SlotBookedCard, SlotOfferComposer } from '../components/chat/SlotCards';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  fetchChatMessages,
  fetchChatSessionDetail,
  sendChatMessage,
  startLiveSession,
  pingChatPresence,
} from '../api/endpoints';
import { getEcho } from '../lib/echo';
import { formatTime } from '../utils/helpers';
import type { RootStackParamList, ChatMessageData, ChatSessionData } from '../types';

const POLL_INTERVAL_MS = 7000;
const GROUP_GAP_MS = 4 * 60_000;

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

type Group = {
  senderId: string;
  senderName: string;
  startedAt: string;
  messages: ChatMessageData[];
};

function isSpecial(m: ChatMessageData) {
  return m.type === 'slot_offer' || m.type === 'slot_booked' || m.type === 'system';
}

function buildGroups(messages: ChatMessageData[]): Group[] {
  const groups: Group[] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    const lastSpecial = last ? isSpecial(last.messages[0]) : false;
    const sameAuthor = !!last && last.senderId === m.sender_id && !lastSpecial && !isSpecial(m);
    const lastTime = last
      ? new Date(last.messages[last.messages.length - 1].created_at).getTime()
      : 0;
    const within = m.created_at ? new Date(m.created_at).getTime() - lastTime < GROUP_GAP_MS : false;
    if (sameAuthor && within) last.messages.push(m);
    else groups.push({ senderId: m.sender_id, senderName: m.sender_name, startedAt: m.created_at, messages: [m] });
  }
  return groups;
}

export default function ChatRoomScreen({ route }: Props) {
  const { id: sessionId } = route.params;
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [session, setSession] = useState<ChatSessionData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const flatListRef = useRef<FlatList>(null);

  const appendMessage = useCallback((m: ChatMessageData) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].sort((a, b) => a.id - b.id);
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await fetchChatMessages(sessionId);
      const msgs = data.messages ?? [];
      setMessages((prev) => {
        const map = new Map<number, ChatMessageData>();
        for (const m of prev) map.set(m.id, m);
        for (const m of msgs) map.set(m.id, m);
        return Array.from(map.values()).sort((a, b) => a.id - b.id);
      });
    } catch {
      /* silent */
    }
  }, [sessionId]);

  const loadSession = useCallback(async () => {
    try {
      const { data } = await fetchChatSessionDetail(sessionId);
      setSession(data.session);
    } catch {
      /* silent */
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    (async () => {
      await Promise.all([loadSession(), loadMessages()]);
      setLoading(false);
    })();
  }, [loadSession, loadMessages]);

  // Refresh when screen regains focus (e.g. after a payment redirect)
  useFocusEffect(
    useCallback(() => {
      loadSession();
      loadMessages();
    }, [loadSession, loadMessages]),
  );

  // Realtime via Reverb/Echo
  useEffect(() => {
    if (!token) {
      setConnection('disconnected');
      return;
    }
    const echo = getEcho(token);
    if (!echo) {
      setConnection('disconnected');
      return;
    }
    const channelName = `chat.${sessionId}`;
    try {
      setConnection('connecting');
      const channel = echo.private(channelName);
      channel.listen('.message.sent', (event: ChatMessageData) => {
        appendMessage({
          ...event,
          type: event.type ?? 'text',
          meta: event.meta ?? null,
          attachment_size: event.attachment_size ?? null,
          read_at: event.read_at ?? null,
        });
      });
      const pusher = (echo as any).connector?.pusher?.connection;
      pusher?.bind('connected', () => setConnection('connected'));
      pusher?.bind('disconnected', () => setConnection('disconnected'));
      pusher?.bind('unavailable', () => setConnection('disconnected'));
      pusher?.bind('connecting', () => setConnection('connecting'));
    } catch {
      // Realtime failed — polling fallback keeps the chat live.
      setConnection('disconnected');
      return;
    }
    return () => {
      try {
        echo.leave(channelName);
      } catch {
        /* ignore */
      }
    };
  }, [token, sessionId, appendMessage]);

  // Fallback poll (safety net when websocket isn't connected)
  useEffect(() => {
    const interval = setInterval(() => {
      if (connection !== 'connected') loadMessages();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [connection, loadMessages]);

  // Presence heartbeat
  useEffect(() => {
    const ping = () => pingChatPresence(sessionId).catch(() => {});
    ping();
    const interval = setInterval(ping, 45_000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setBody('');
    setSending(true);
    try {
      const { data } = await sendChatMessage(sessionId, text);
      appendMessage(data.message);
    } catch (err: any) {
      Alert.alert(err?.response?.data?.message ?? t('common.error'));
      setBody(text);
    } finally {
      setSending(false);
    }
  };

  const handleStartLive = async () => {
    try {
      const { data } = await startLiveSession(sessionId);
      setSession(data.session);
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  const viewerIsPsy = session?.counterpart.role === 'client';
  const isBooking = session?.type === 'booking';
  const isLive = session?.type === 'live_30' || session?.type === 'live_60';
  const canStartLive = !!isLive && !session?.live_started_at && session?.status === 'active';
  const bookingLocked = !!isBooking && !!session?.booking?.closed_at;
  const isOpen =
    session?.status === 'active' &&
    !bookingLocked &&
    (!session?.ends_at || new Date(session.ends_at) > new Date());

  const counterpartName =
    session?.counterpart.display_name ||
    `${session?.counterpart.first_name ?? ''} ${session?.counterpart.last_name ?? ''}`.trim() ||
    '—';

  const hasCrisisFlag = messages.some(
    (m) => (m.flags?.crisis_keywords?.length ?? 0) > 0,
  );

  const groups = useMemo(() => buildGroups(messages), [messages]);

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ActivityIndicator color={Colors.primary.ink} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  const renderGroup = ({ item: g }: { item: Group }) => {
    const first = g.messages[0];
    if (first.type === 'slot_offer') {
      return <SlotOfferCard message={first} session={session} viewerIsPsy={viewerIsPsy} locale={locale} />;
    }
    if (first.type === 'slot_booked') {
      return <SlotBookedCard message={first} locale={locale} />;
    }
    const isOwn = g.senderId === user?.id;
    const lastMsg = g.messages[g.messages.length - 1];
    const time = formatTime(lastMsg.created_at);
    return (
      <View style={[styles.groupRow, isOwn ? styles.alignEnd : styles.alignStart]}>
        {!isOwn && (
          <View style={styles.bubbleAvatar}>
            {session.counterpart.avatar_url ? (
              <Image source={{ uri: session.counterpart.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{counterpartName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        )}
        <View style={[styles.bubbleCol, isOwn ? styles.alignEnd : styles.alignStart]}>
          {!isOwn && <Text style={styles.senderName}>{g.senderName}</Text>}
          {g.messages.map((m) => {
            const hasCrisis = (m.flags?.crisis_keywords?.length ?? 0) > 0;
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  isOwn ? styles.bubbleOwn : styles.bubbleOther,
                  hasCrisis && styles.bubbleCrisis,
                ]}
              >
                {m.body && (
                  <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{m.body}</Text>
                )}
                {m.attachment_url && (
                  <Text style={[styles.attachment, isOwn && styles.attachmentOwn]}>
                    📎 {t('chat.attach')}
                  </Text>
                )}
              </View>
            );
          })}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{time}</Text>
            {isOwn && lastMsg.read_at && (
              <Ionicons name="checkmark-done" size={12} color={Colors.primary[600]} />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerInfo}>
          {session.counterpart.avatar_url ? (
            <Image source={{ uri: session.counterpart.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerInitial}>{counterpartName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {counterpartName}
            </Text>
            <View style={styles.headerMeta}>
              <Text style={styles.headerType}>{t(`chat.planType.${session.type}`)}</Text>
              <ConnectionDot state={connection} />
            </View>
          </View>
        </View>
        {canStartLive && (
          <TouchableOpacity style={styles.liveBtn} onPress={handleStartLive}>
            <Ionicons name="play-circle" size={16} color={Colors.cream[50]} />
            <Text style={styles.liveBtnText}>{t('chat.startLive')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Crisis ribbon */}
      {hasCrisisFlag && (
        <View style={styles.crisisRibbon}>
          <Ionicons name="warning-outline" size={14} color={Colors.danger} />
          <Text style={styles.crisisText}>{t('chat.crisisBanner')}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(g, i) => `${g.senderId}-${g.startedAt}-${i}`}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('chat.typeMessage')}</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Composer */}
      {isOpen ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.composer}>
            {isBooking && viewerIsPsy && (
              <SlotOfferComposer session={session} onOfferSent={appendMessage} />
            )}
            <View style={styles.composerInner}>
              <TextInput
                style={styles.composerInput}
                value={body}
                onChangeText={setBody}
                placeholder={t('chat.typeMessage')}
                placeholderTextColor={Colors.ink.muted}
                multiline
                maxLength={5000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!body.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={Colors.cream[50]} />
                ) : (
                  <Ionicons name="send" size={18} color={Colors.cream[50]} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.closedFooter}>
          <Text style={styles.closedText}>
            {bookingLocked ? t('chat.booking.locked') : t(`chat.status.${session.status}`)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function ConnectionDot({ state }: { state: ConnectionState }) {
  const { t } = useTranslation();
  const color =
    state === 'connected' ? Colors.success : state === 'connecting' ? Colors.sand[600] : Colors.danger;
  const label =
    state === 'connected'
      ? t('chat.connected')
      : state === 'connecting'
        ? t('chat.reconnecting')
        : t('chat.disconnected');
  return (
    <View style={styles.connRow}>
      <View style={[styles.connDot, { backgroundColor: color }]} />
      <Text style={[styles.connText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream[100] },
  loader: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream[50],
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitial: { color: Colors.cream[50], fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  headerText: { flex: 1 },
  headerName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.primary.ink },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 1 },
  headerType: { fontSize: FontSize['2xs'], color: Colors.ink.muted },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary.ink,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  liveBtnText: { color: Colors.cream[50], fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: FontSize['2xs'] },
  crisisRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(176,74,62,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(176,74,62,0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  crisisText: { flex: 1, fontSize: FontSize.xs, color: Colors.danger },
  messagesList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['6xl'] },
  emptyText: { fontSize: FontSize.sm, color: Colors.ink.muted },
  groupRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, maxWidth: '100%' },
  alignEnd: { justifyContent: 'flex-end', alignSelf: 'flex-end' },
  alignStart: { justifyContent: 'flex-start', alignSelf: 'flex-start' },
  bubbleAvatar: { alignSelf: 'flex-end' },
  avatarImg: { width: 28, height: 28, borderRadius: 14 },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: Colors.cream[50], fontSize: 10, fontWeight: FontWeight.semibold },
  bubbleCol: { maxWidth: '82%', gap: 3 },
  senderName: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  bubble: { borderRadius: 18, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  bubbleOwn: { backgroundColor: Colors.primary.ink },
  bubbleOther: { backgroundColor: Colors.cream[50], borderWidth: 1, borderColor: Colors.border },
  bubbleCrisis: { borderWidth: 2, borderColor: 'rgba(176,74,62,0.4)' },
  messageText: { fontSize: FontSize.sm, color: Colors.ink.DEFAULT, lineHeight: 20 },
  messageTextOwn: { color: Colors.cream[50] },
  attachment: { fontSize: FontSize.xs, color: Colors.ink.soft, marginTop: 4, textDecorationLine: 'underline' },
  attachmentOwn: { color: Colors.cream[200] },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  timeText: { fontSize: 10, color: Colors.ink.muted },
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
    backgroundColor: Colors.terracotta[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4, backgroundColor: Colors.ink[20] },
  closedFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cream[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  closedText: { textAlign: 'center', fontSize: FontSize.sm, fontStyle: 'italic', color: Colors.ink.muted },
});
