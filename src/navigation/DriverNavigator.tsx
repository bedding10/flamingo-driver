import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DriverHomeScreen } from "../screens/home/DriverHomeScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { TripChatScreen } from "../screens/trip/TripChatScreen";
import { ApprovalGate } from "./ApprovalGate";
import { strings } from "../i18n/strings";
import { colors } from "../theme";
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
 */
export function DriverNavigator() {
  return (
    <ApprovalGate>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.textOnDark },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="Home" component={DriverHomeScreen} />
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
          Trip chat. It sits behind the same approval gate as everything else:
          a driver who is not APPROVED has no trip, so has nobody to message.
        */}
        <Stack.Screen
          name="TripChat"
          component={TripChatScreen}
          options={{ headerShown: true, title: strings.chat.title }}
        />
      </Stack.Navigator>
    </ApprovalGate>
  );
}
