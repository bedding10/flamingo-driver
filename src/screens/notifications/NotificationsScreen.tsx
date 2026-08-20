import React, { useCallback, useMemo } from "react";
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
import { textAlignEnd, textAlignStart } from "../../i18n";
import { notificationStrings } from "../../i18n/strings.support";
import { formatDateTime } from "../../utils/datetime";
import { Icon } from "../../components/Icon";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";

/**
 * PHASE 6 - the notification inbox.
 *
 * The server has always stored notifications; the phone only ever showed the
 * transient OS banner. Tapping a row marks it read on the server rather than
 * locally, so the same state is seen from every device the driver signs into.
 *
 * PHASE 7.5 CLOSURE: palette-driven, with an unread dot and a pink unread
 * badge instead of the old gold one.
 *
 * PHASE 1 (R-11): `cardHead` was `"row-reverse"` and five text styles carried
 * hardcoded direction. See the note on `when` for the one non-obvious call.
 */
export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
      Alert.alert(
        notificationStrings.deleteTitle,
        notificationStrings.hiddenNote,
        [
          { text: notificationStrings.cancel, style: "cancel" },
          {
            text: notificationStrings.deleteAction,
            style: "destructive",
            onPress: () => remove(id),
          },
        ],
      );
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
          <View style={styles.iconWrap}>
            <Icon
              name="bell"
              size={18}
              color={item.isRead ? palette.textSecondary : palette.primaryText}
            />
          </View>
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
    [confirmRemove, markRead, palette, styles],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
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

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    center: {
      flex: 1,
      backgroundColor: palette.background,
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
      borderColor: withAlpha(palette.primary, 0.35),
      backgroundColor: palette.primaryWash,
      alignItems: "center",
      justifyContent: "center",
    },
    markAllLabel: { ...typography.subtitle, color: palette.primaryText },
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardUnread: { borderColor: withAlpha(palette.primary, 0.5) },
    pressed: { opacity: 0.85 },
    // Plain "row": mirrored by React Native under RTL.
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: palette.surfaceSunken,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      ...typography.subtitle,
      color: palette.textPrimary,
      flex: 1,
      textAlign: textAlignStart(),
    },
    badge: {
      ...typography.caption,
      color: palette.onPrimary,
      backgroundColor: palette.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      overflow: "hidden",
    },
    cardBody: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    /**
     * Trailing edge, LTR content. This was a physical "left", which is the
     * trailing edge in Arabic but the LEADING edge in French and English - the
     * timestamp would have jumped from one side of the card to the other with
     * the language. textAlignEnd() keeps it trailing in both.
     *
     * writingDirection stays "ltr" on purpose: the value is a formatted date,
     * and its digits and separators must not be reordered by the bidi
     * algorithm. Same deliberate exception class as the version block in
     * LegalScreen and the plate in VehicleCard.
     */
    when: {
      ...typography.caption,
      color: palette.textMuted,
      textAlign: textAlignEnd(),
      writingDirection: "ltr",
    },
    // Centre does not mirror.
    empty: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: "center",
      marginTop: spacing["3xl"],
    },
    footer: {
      ...typography.caption,
      color: palette.textMuted,
      textAlign: "center",
      marginTop: spacing.md,
    },
  });
