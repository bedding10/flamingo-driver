import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DriverHomeScreen } from "../screens/home/DriverHomeScreen";
import { MenuScreen } from "../screens/menu/MenuScreen";
import { WalletScreen } from "../screens/wallet/WalletScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { SupportScreen } from "../screens/support/SupportScreen";
import { TicketScreen } from "../screens/support/TicketScreen";
import { LegalScreen } from "../screens/legal/LegalScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { VehicleScreen } from "../screens/onboarding/VehicleScreen";
import { RequestsScreen } from "../screens/requests/RequestsScreen";
import { TripChatScreen } from "../screens/trip/TripChatScreen";
import { ApprovalGate } from "./ApprovalGate";
import { navigationRef, navigateWhenReady } from "./navigation-ref";
import { requestRecenter } from "./map-recenter";
import { ToastHost } from "../components/Toast";
import {
  DriverTabBar,
  navSpace,
  type DriverTab,
} from "../components/DriverTabBar";
import { useUnreadNotificationCount } from "../hooks/useNotifications";
import { useTranslation } from "../i18n";
import { strings } from "../i18n/strings";
import { requestStrings } from "../i18n/strings.requests";
import { menuStrings, walletStrings } from "../i18n/strings.menu";
import {
  notificationStrings,
  supportStrings,
} from "../i18n/strings.support";
import { legalStrings } from "../i18n/strings.phase7";
import { typography, usePalette } from "../theme";
import type { DriverStackParamList } from "./types";

const Stack = createNativeStackNavigator<DriverStackParamList>();

/**
 * The three sections of the driver app, in Stitch's order.
 *
 * These are the only routes that show the bottom navigation. Everything else
 * (wallet, profile, documents, vehicle, support, a ticket, a chat) is reached
 * THROUGH one of these three and is a detail view - so the bar would be
 * covering content those screens do not reserve space for.
 */
const SECTION_ROUTES = ["Home", "Requests", "Menu"] as const;

type SectionRoute = (typeof SECTION_ROUTES)[number];

function tabForRoute(routeName: string | undefined): DriverTab {
  if (routeName === "Requests") return "requests";
  if (routeName === "Menu") return "menu";
  return "map";
}

function isSectionRoute(routeName: string | undefined): boolean {
  return SECTION_ROUTES.includes(routeName as SectionRoute);
}

/**
 * The signed-in stack, behind the approval gate.
 *
 * The gate wraps the navigator rather than living inside a screen, so no
 * signed-in route can be reached by a driver who is not APPROVED - including
 * routes added later.
 *
 * Profile, Documents and Vehicle are reachable here too: an approved driver
 * still needs to replace an expiring insurance paper or fix a plate, and the
 * same screens serve both cases instead of being duplicated.
 *
 * SOS REMOVED: the `Safety` screen is gone from this stack with the rest of the
 * SOS system, and so is its title string import.
 *
 * The toast host is mounted ONCE here, above the navigator, so a toast survives
 * a navigation and never belongs to a single screen.
 *
 * WHY THE TAB BAR IS HERE AND NOT IN A SCREEN: it used to be rendered inside
 * DriverHomeScreen with `active="map"` hardcoded, so it appeared on one of its
 * own three sections and disappeared the moment the driver opened Requests or
 * Menu. Mounted here, as a sibling of the stack exactly like ToastHost, it
 * persists across all three and the active item is derived from the live route.
 *
 * It is still NOT a tab navigator, for the original and still-valid reason: the
 * home screen owns the GPS subscription, the socket listeners and the trip
 * lifecycle, and has to stay mounted for an entire shift. A native stack keeps
 * it mounted underneath a pushed screen; a tab navigator would unmount or
 * freeze it - and it would do so precisely when an offer arrives.
 */
export function DriverNavigator() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Unread notifications for the bar's badge. Reads the same react-query cache
  // the inbox fills, so showing the badge costs no extra request.
  const unreadNotifications = useUnreadNotificationCount();

  // The active route, tracked from the container ref. The bar sits outside the
  // navigator, so it cannot read route state through a screen prop.
  const [routeName, setRouteName] = useState<string | undefined>(() =>
    navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : "Home",
  );

  useEffect(() => {
    const sync = () => setRouteName(navigationRef.getCurrentRoute()?.name);
    sync();
    return navigationRef.addListener("state", sync);
  }, []);

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

  /**
   * Space the two list sections must leave free so their last row is not stuck
   * under the floating bar. Applied through the navigator's contentStyle rather
   * than inside the screens.
   */
  const sectionContentStyle = useMemo(
    () => ({
      backgroundColor: palette.background,
      paddingBottom: navSpace(insets.bottom),
    }),
    [palette, insets.bottom],
  );

  /**
   * The centre item is not a link to itself: on the map it recentres the
   * camera, everywhere else it returns to the map.
   */
  const onSelectTab = useCallback((tab: DriverTab) => {
    if (tab === "requests") {
      navigateWhenReady("Requests");
      return;
    }
    if (tab === "menu") {
      navigateWhenReady("Menu");
      return;
    }
    if (navigationRef.getCurrentRoute()?.name === "Home") {
      requestRecenter();
      return;
    }
    navigateWhenReady("Home");
  }, []);

  const labels = useMemo(
    () => ({
      requests: t("nav.requests"),
      map: t("nav.map"),
      menu: t("nav.menu"),
    }),
    [t],
  );

  return (
    <ApprovalGate>
      <View style={styles.root}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Home" component={DriverHomeScreen} />
          {/*
            Menu and Requests are the other two SECTIONS. They stay pushed
            stack screens so the map underneath is never unmounted, but they
            keep the bottom navigation visible and reserve room for it.
          */}
          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={{
              headerShown: true,
              title: menuStrings.title,
              contentStyle: sectionContentStyle,
            }}
          />
          <Stack.Screen
            name="Requests"
            component={RequestsScreen}
            options={{
              headerShown: true,
              title: requestStrings.title,
              contentStyle: sectionContentStyle,
            }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{ headerShown: true, title: walletStrings.title }}
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
            The active vehicle, split out of the profile form. The driver reaches
            it from the Menu's vehicle row; the onboarding stack has its own copy
            of the route for a driver still under review.
          */}
          <Stack.Screen
            name="Vehicle"
            component={VehicleScreen}
            options={{ headerShown: true, title: strings.profile.vehicleSection }}
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
        </Stack.Navigator>

        {isSectionRoute(routeName) ? (
          <DriverTabBar
            active={tabForRoute(routeName)}
            bottomInset={insets.bottom}
            labels={labels}
            badge={unreadNotifications}
            onSelect={onSelectTab}
          />
        ) : null}

        <ToastHost />
      </View>
    </ApprovalGate>
  );
}
