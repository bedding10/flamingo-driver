import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PendingApprovalScreen } from "../screens/onboarding/PendingApprovalScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { VehicleScreen } from "../screens/onboarding/VehicleScreen";
import { strings } from "../i18n/strings";
import { usePalette } from "../theme";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * What a driver who is not APPROVED can reach.
 *
 * Only the file under review: status, profile, documents, vehicle. No map, no
 * availability, no trips - the server would refuse those anyway, and offering
 * them would be a promise the backend does not keep.
 *
 * The screens are declared in the order sections 13 and 62 mandate:
 * BASIC PROFILE -> DOCUMENTS -> VEHICLE INFORMATION. Vehicle was the second
 * half of the Profile form until PHASE 2, which put vehicle information BEFORE
 * documents and contradicted both sections.
 *
 * Headers are shown here (unlike the rest of the app) because these are pushed
 * detail screens and the driver needs a way back that does not depend on the
 * Android hardware button alone.
 *
 * PHASE 2: the header was painted with the legacy flat `colors` bag, so it
 * stayed dark in light mode even after the screens beneath it stopped doing
 * that. It reads the palette now. The Stitch header treatment - surface at 80%
 * with a blur, brand wordmark centred, back chevron in brand pink - is not
 * applied here: that is a geometry change and belongs to the visual rebuild of
 * this flow, not to a colour migration.
 *
 * STILL OUTSTANDING: the titles below come from the legacy `strings` bag. The
 * PHASE 1 locales have no `profile` slice, so migrating them means adding keys
 * to three locale files; tracked as debt rather than half-migrated here.
 */
export function OnboardingNavigator() {
  const palette = usePalette();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.primaryText,
        headerTitleStyle: { color: palette.textPrimary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
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
      <Stack.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={{
          title: strings.profile.vehicleSection,
          headerBackTitle: strings.common.back,
        }}
      />
    </Stack.Navigator>
  );
}
