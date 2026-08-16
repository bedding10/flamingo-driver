import React from "react";
import { StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DriverHomeScreen } from "../screens/home/DriverHomeScreen";
import { MenuScreen } from "../screens/menu/MenuScreen";
import { WalletScreen } from "../screens/wallet/WalletScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { SupportScreen } from "../screens/support/SupportScreen";
import { TicketScreen } from "../screens/support/TicketScreen";
import { SafetyScreen } from "../screens/safety/SafetyScreen";
import { LegalScreen } from "../screens/legal/LegalScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { RequestsScreen } from "../screens/requests/RequestsScreen";
import { TripChatScreen } from "../screens/trip/TripChatScreen";
import { ApprovalGate } from "./ApprovalGate";
import { ToastHost } from "../components/Toast";
import { strings } from "../i18n/strings";
import { requestStrings } from "../i18n/strings.requests";
import { menuStrings, walletStrings } from "../i18n/strings.menu";
import {
  notificationStrings,
  safetyStrings,
  supportStrings,
} from "../i18n/strings.support";
import { legalStrings } from "../i18n/strings.phase7";
import { colors, typography } from "../theme";
import type { DriverStackParamList } from "./types";

const Stack = createNativeStackNavigator<DriverStackParamList>();

/**
 * The signed-in stack, behind the approval gate.
 *
 * The gate wraps the navigator rather than living inside a screen, so no
 * signed-in route can be reached by a driver who is not APPROVED - including
 * routes added in later phases.
 *
 * Profile and Documents are reachable here too: an approved driver still needs to
 * replace an expiring insurance paper or fix a plate, and the same two screens
 * serve both cases instead of being duplicated.
 *
 * PHASE 7: one header style for every pushed screen (ink background, gold back
 * arrow, white centred-weight title), and the toast host is mounted ONCE here,
 * above the navigator, so a toast survives a navigation and never belongs to a
 * single screen.
 */
export function DriverNavigator() {
  return (
    <ApprovalGate>
      <View style={styles.root}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: colors.ink },
            headerTintColor: colors.gold,
            headerTitleStyle: {
              color: colors.textOnDark,
              fontSize: typography.title.fontSize,
              fontWeight: typography.title.fontWeight,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.ink },
          }}
        >
          <Stack.Screen name="Home" component={DriverHomeScreen} />
          {/*
            PHASE 5: the menu and the wallet. Both are pushed screens for the same
            reason as Requests - the map stays the driver's default view.
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
            PHASE 6: notifications, support and safety. All three read server
            state that existed long before any screen could show it.
          */}
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
          {/* PHASE 7: terms, privacy and build identity. */}
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
            PHASE 3: the bidding requests list. It is a pushed screen rather than a
            tab because the driver's default view must stay the map: a driver who
            loses sight of the map loses the road.
          */}
          <Stack.Screen
            name="Requests"
            component={RequestsScreen}
            options={{ headerShown: true, title: requestStrings.title }}
          />
          {/*
            Trip chat. It sits behind the same approval gate as everything else:
            a driver who is not APPROVED has no trip, so has nobody to message.
          */}
          <Stack.Screen
            name="TripChat"
            component={TripChatScreen}
            options={{ headerShown: true, title: strings.chat.title }}
          />
        </Stack.Navigator>

        <ToastHost />
      </View>
    </ApprovalGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
});
