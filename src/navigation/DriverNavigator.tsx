import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DriverHomeScreen } from "../screens/home/DriverHomeScreen";
import { MenuScreen } from "../screens/menu/MenuScreen";
import { WalletScreen } from "../screens/wallet/WalletScreen";
import { EarningsScreen } from "../screens/wallet/EarningsScreen";
import { ProfileHubScreen } from "../screens/profile/ProfileHubScreen";
import { VehicleScreen } from "../screens/profile/VehicleScreen";
import { LevelsScreen } from "../screens/rewards/LevelsScreen";
import { DailyGoalsScreen } from "../screens/rewards/DailyGoalsScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { SupportScreen } from "../screens/support/SupportScreen";
import { TicketScreen } from "../screens/support/TicketScreen";
import { SafetyScreen } from "../screens/safety/SafetyScreen";
import { LegalScreen } from "../screens/legal/LegalScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { RequestsScreen } from "../screens/requests/RequestsScreen";
import { TripChatScreen } from "../screens/trip/TripChatScreen";
import { TripCompletedScreen } from "../screens/trip/TripCompletedScreen";
import { ApprovalGate } from "./ApprovalGate";
import { ToastHost } from "../components/Toast";
import { strings } from "../i18n/strings";
import { requestStrings } from "../i18n/strings.requests";
import { menuStrings, walletStrings } from "../i18n/strings.menu";
import { earningsStrings } from "../i18n/strings.earnings";
import { hubStrings } from "../i18n/strings.profile.hub";
import { rewardsStrings } from "../i18n/strings.rewards";
import { tripSummaryStrings } from "../i18n/strings.trip.summary";
import {
  notificationStrings,
  safetyStrings,
  supportStrings,
} from "../i18n/strings.support";
import { legalStrings } from "../i18n/strings.phase7";
import { typography, usePalette } from "../theme";
import type { DriverStackParamList } from "./types";

const Stack = createNativeStackNavigator<DriverStackParamList>();

/**
 * The signed-in stack, behind the approval gate.
 *
 * The gate wraps the navigator rather than living inside a screen, so no
 * signed-in route can be reached by a driver who is not APPROVED - including
 * routes added in later phases.
 *
 * Profile and Documents are reachable here too: an approved driver still needs
 * to replace an expiring insurance paper or fix a plate, and the same two
 * screens serve both cases instead of being duplicated.
 *
 * The toast host is mounted ONCE here, above the navigator, so a toast survives
 * a navigation and never belongs to a single screen.
 *
 * PHASE 1 (Stitch): the header was hardcoded to the old charcoal with a gold
 * tint, which meant every pushed screen kept a dark header in light mode and
 * kept a banned gold accent. Header, tint and content background now come from
 * the palette, and the tint is the brand pink.
 */
export function DriverNavigator() {
  const palette = usePalette();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: palette.background },
      }),
    [palette],
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      headerStyle: { backgroundColor: palette.background },
      headerTintColor: palette.primaryText,
      headerTitleStyle: {
        color: palette.textPrimary,
        fontSize: typography.title.fontSize,
        fontWeight: typography.title.fontWeight,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: palette.background },
    }),
    [palette],
  );

  return (
    <ApprovalGate>
      <View style={styles.root}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Home" component={DriverHomeScreen} />
          {/*
            The menu and the wallet are pushed screens for the same reason as
            Requests - the map stays the driver's default view.
          */}
          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={{ headerShown: true, title: menuStrings.title }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{ headerShown: true, title: walletStrings.title }}
          />
          {/*
            Earnings is separate from the wallet on purpose: the wallet is the
            ledger the server owns, earnings is the driver's own performance
            read. They come from two different endpoints and answer two
            different questions.
          */}
          <Stack.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{ headerShown: true, title: earningsStrings.title }}
          />
          {/*
            ProfileHub is the READ view of the account; Profile below is the
            editable form. Keeping them apart is what lets the hub show the tier
            frame and the counters without turning the form into a dashboard.
          */}
          <Stack.Screen
            name="ProfileHub"
            component={ProfileHubScreen}
            options={{ headerShown: true, title: hubStrings.hubTitle }}
          />
          <Stack.Screen
            name="Vehicle"
            component={VehicleScreen}
            options={{ headerShown: true, title: hubStrings.vehicleTitle }}
          />
          <Stack.Screen
            name="Levels"
            component={LevelsScreen}
            options={{ headerShown: true, title: hubStrings.levelsTitle }}
          />
          <Stack.Screen
            name="DailyGoals"
            component={DailyGoalsScreen}
            options={{ headerShown: true, title: rewardsStrings.goalsTitle }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: true, title: notificationStrings.title }}
          />
          <Stack.Screen
            name="Support"
            component={SupportScreen}
            options={{ headerShown: true, title: supportStrings.title }}
          />
          <Stack.Screen
            name="Ticket"
            component={TicketScreen}
            options={{ headerShown: true, title: supportStrings.threadTitle }}
          />
          <Stack.Screen
            name="Safety"
            component={SafetyScreen}
            options={{ headerShown: true, title: safetyStrings.title }}
          />
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{ headerShown: true, title: legalStrings.title }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true, title: strings.profile.title }}
          />
          <Stack.Screen
            name="Documents"
            component={DocumentsScreen}
            options={{ headerShown: true, title: strings.documents.title }}
          />
          {/*
            The bidding requests list is a pushed screen rather than a tab
            because the driver's default view must stay the map: a driver who
            loses sight of the map loses the road.
          */}
          <Stack.Screen
            name="Requests"
            component={RequestsScreen}
            options={{ headerShown: true, title: requestStrings.title }}
          />
          {/*
            Trip chat sits behind the same approval gate as everything else: a
            driver who is not APPROVED has no trip, so has nobody to message.
          */}
          <Stack.Screen
            name="TripChat"
            component={TripChatScreen}
            options={{ headerShown: true, title: strings.chat.title }}
          />
          {/*
            The per-trip summary. Reached from the earnings list today; it is
            NOT pushed automatically when a trip completes, because the trip
            store clears the trip on any terminal status and wiring that is a
            lifecycle change rather than a navigation one.
          */}
          <Stack.Screen
            name="TripSummary"
            component={TripCompletedScreen}
            options={{ headerShown: true, title: tripSummaryStrings.title }}
          />
        </Stack.Navigator>

        <ToastHost />
      </View>
    </ApprovalGate>
  );
}
