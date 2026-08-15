import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PendingApprovalScreen } from "../screens/onboarding/PendingApprovalScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { strings } from "../i18n/strings";
import { colors } from "../theme";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * What a driver who is not APPROVED can reach.
 *
 * Only the file under review: status, profile, documents. No map, no
 * availability, no trips - the server would refuse those anyway, and offering
 * them would be a promise the backend does not keep.
 *
 * Headers are shown here (unlike the rest of the app) because these are pushed
 * detail screens and the driver needs a way back that does not depend on the
 * Android hardware button alone.
 */
export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.textOnDark },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.ink },
      }}
    >
      <Stack.Screen
        name="Pending"
        component={PendingApprovalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: strings.profile.title, headerBackTitle: strings.common.back }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: strings.documents.title, headerBackTitle: strings.common.back }}
      />
    </Stack.Navigator>
  );
}
