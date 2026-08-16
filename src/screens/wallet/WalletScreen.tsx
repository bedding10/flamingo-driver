import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SectionCard } from "../../components/SectionCard";
import { toApiError } from "../../api/client";
import { useEarnings, useWallet, useWithdrawal } from "../../hooks/useWallet";
import { walletStrings } from "../../i18n/strings.menu";
import { strings } from "../../i18n/strings";
import {
  colors,
  radius,
  spacing,
  typography,
  withAlpha,
} from "../../theme";

/** Two decimals at most, no locale formatting: Hermes Intl is not guaranteed. */
function money(value: number, currency: string): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${currency}`;
}

function shortDate(value?: string): string {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

/**
 * PHASE 5 - wallet, earnings and withdrawal request.
 *
 * Every number here is server output. Three deliberate refusals:
 *
 * 1. No monthly figure. DriverSelfService.earnings() computes today / week /
 *    all only, and a month invented on the phone would disagree with the
 *    dashboard.
 * 2. No withdrawal history list. GET /withdrawals is STAFF-only, so the app
 *    says so instead of showing an empty list that looks like a bug.
 * 3. The withdrawable ceiling shown is `balance`, never balance +
 *    lockedBalance: locked credit is exactly the part that cannot be taken out.
 */
export function WalletScreen() {
  const insets = useSafeAreaInsets();
  const wallet = useWallet();
  const earnings = useEarnings();
  const withdrawal = useWithdrawal();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currency = wallet.data?.currency ?? walletStrings.currencyFallback;
  const balance = wallet.data?.balance ?? 0;
  const locked = wallet.data?.lockedBalance ?? 0;
  const totals = earnings.data?.totals;

  const refreshing = wallet.isFetching || earnings.isFetching;
  const refresh = useCallback(() => {
    void wallet.refetch();
    void earnings.refetch();
  }, [wallet, earnings]);

  const submit = useCallback(() => {
    setError(null);
    const parsed = Number(amount.trim());
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError(walletStrings.amountInvalid);
      return;
    }
    if (parsed > balance) {
      setError(walletStrings.amountTooBig);
      return;
    }
    withdrawal.mutate(
      { amount: parsed, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setAmount("");
          setNote("");
          Alert.alert(
            walletStrings.submittedTitle,
            walletStrings.submittedBody,
          );
        },
        onError: (mutationError) => {
          const apiError = toApiError(mutationError);
          setError(
            apiError.offline
              ? strings.errors.network
              : apiError.message || walletStrings.loadFailed,
          );
        },
      },
    );
  }, [amount, balance, note, withdrawal]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.gold}
        />
      }
    >
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{walletStrings.balanceLabel}</Text>
        {wallet.isLoading ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <Text style={styles.balanceValue}>{money(balance, currency)}</Text>
        )}
        {locked > 0 ? (
          <Text style={styles.locked}>
            {walletStrings.lockedLabel}: {money(locked, currency)}
          </Text>
        ) : null}
        <Text style={styles.hint}>{walletStrings.lockedHint}</Text>
        {wallet.isError ? (
          <Text style={styles.error}>{walletStrings.loadFailed}</Text>
        ) : null}
      </View>

      <SectionCard
        title={walletStrings.earningsTitle}
        hint={walletStrings.earningsHint}
      >
        <View style={styles.statsRow}>
          <Stat
            label={walletStrings.today}
            value={totals ? money(totals.today, currency) : "\u2014"}
          />
          <Stat
            label={walletStrings.week}
            value={totals ? money(totals.week, currency) : "\u2014"}
          />
        </View>
        <View style={styles.statsRow}>
          <Stat
            label={walletStrings.all}
            value={totals ? money(totals.all, currency) : "\u2014"}
          />
          <Stat
            label={walletStrings.trips}
            value={totals ? String(totals.trips) : "\u2014"}
          />
        </View>
      </SectionCard>

      <SectionCard title={walletStrings.recentTitle}>
        {(wallet.data?.transactions ?? []).length === 0 ? (
          <Text style={styles.hint}>{walletStrings.recentEmpty}</Text>
        ) : (
          (wallet.data?.transactions ?? []).slice(0, 10).map((entry) => {
            const credit = entry.direction === "CREDIT";
            return (
              <View key={entry.id} style={styles.entryRow}>
                <Text
                  style={[
                    styles.entryAmount,
                    credit ? styles.creditText : styles.debitText,
                  ]}
                >
                  {(credit ? "+" : "-") +
                    money(Number(entry.amount), currency)}
                </Text>
                <Text style={styles.entryMeta}>
                  {(credit ? walletStrings.credit : walletStrings.debit) +
                    " \u00b7 " +
                    shortDate(entry.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </SectionCard>

      <SectionCard
        title={walletStrings.withdrawTitle}
        hint={walletStrings.withdrawHint}
      >
        <InputField
          label={walletStrings.amountLabel}
          placeholder={walletStrings.amountPlaceholder}
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
          keyboardType="number-pad"
          maxLength={12}
        />
        <InputField
          label={walletStrings.noteLabel}
          placeholder={walletStrings.notePlaceholder}
          value={note}
          onChangeText={setNote}
          maxLength={140}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={walletStrings.submit}
          onPress={submit}
          loading={withdrawal.isPending}
          disabled={balance <= 0}
        />
        <Text style={styles.hint}>{walletStrings.historyUnavailable}</Text>
      </SectionCard>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing.xl, gap: spacing.md },
  balanceCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
    padding: spacing.lg,
    gap: spacing.xs,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  balanceValue: { ...typography.display, color: colors.gold, textAlign: "right" },
  locked: {
    ...typography.caption,
    color: colors.warning,
    textAlign: "right",
    writingDirection: "rtl",
  },
  statsRow: { flexDirection: "row-reverse", gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  statValue: { ...typography.numeric, color: colors.gold },
  statLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginTop: spacing.xs,
    writingDirection: "rtl",
  },
  entryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  entryAmount: { ...typography.numeric },
  creditText: { color: colors.online },
  debitText: { color: colors.danger },
  entryMeta: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
