import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../hooks/useNotifications";
import type { AppNotification } from "../../api/notifications.api";
import { notificationStrings } from "../../i18n/strings.support";
import { formatDateTime } from "../../utils/datetime";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../../theme";

/**
 * PHASE 6 - the notification inbox.
 *
 * The server has always stored notifications; the phone only ever showed the
 * transient OS banner. Tapping a row marks it read on the server rather than
 * locally, so the same state is seen from every device the driver signs into.
 */
export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    unreadCount,
    loading,
    failed,
    refetch,
    markRead,
    markAllRead,
    remove,
    mutating,
  } = useNotifications();

  const confirmRemove = useCallback(
    (id: string) => {
      Alert.alert(notificationStrings.deleteAction, notificationStrings.hiddenNote, [
        { text: notificationStrings.deleteAction, style: "destructive", onPress: () => remove(id) },
        { text: "\u2715", style: "cancel" },
      ]);
    },
    [remove],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={() => {
          if (!item.isRead) markRead(item.id);
        }}
        onLongPress={() => confirmRemove(item.id)}
        style={({ pressed }) => [
          styles.card,
          item.isRead ? null : styles.cardUnread,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.isRead ? null : (
            <Text style={styles.badge}>{notificationStrings.unreadBadge}</Text>
          )}
        </View>
        <Text style={styles.cardBody}>{item.body}</Text>
        <Text style={styles.when}>{formatDateTime(item.createdAt)}</Text>
      </Pressable>
    ),
    [confirmRemove, markRead],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {unreadCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={notificationStrings.markAll}
          disabled={mutating}
          onPress={markAllRead}
          style={styles.markAll}
        >
          <Text style={styles.markAllLabel}>
            {notificationStrings.markAll + " (" + unreadCount + ")"}
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
        refreshing={mutating}
        onRefresh={refetch}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {failed ? notificationStrings.loadFailed : notificationStrings.empty}
          </Text>
        }
        ListFooterComponent={
          items.length ? (
            <Text style={styles.footer}>{notificationStrings.hiddenNote}</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: spacing.xl, gap: spacing.md },
  markAll: {
    minHeight: touchTarget.normal,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.gold, 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  markAllLabel: { ...typography.subtitle, color: colors.gold },
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardUnread: { borderColor: withAlpha(colors.gold, 0.5) },
  pressed: { opacity: 0.85 },
  cardHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textOnDark,
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
  },
  badge: {
    ...typography.caption,
    color: colors.ink,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: "hidden",
  },
  cardBody: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  when: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "left",
    writingDirection: "ltr",
  },
  empty: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    marginTop: spacing["3xl"],
    writingDirection: "rtl",
  },
  footer: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    marginTop: spacing.md,
    writingDirection: "rtl",
  },
});
