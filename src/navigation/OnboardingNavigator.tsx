import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PendingApprovalScreen } from "../screens/onboarding/PendingApprovalScreen";
import { ProfileScreen } from "../screens/onboarding/ProfileScreen";
import { DocumentsScreen } from "../screens/onboarding/DocumentsScreen";
import { VehicleScreen } from "../screens/onboarding/VehicleScreen";
import { BootScreen } from "../screens/BootScreen";
import { useDriverProfile } from "../hooks/useDriverProfile";
import { strings } from "../i18n/strings";
import { usePalette } from "../theme";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * What a driver who is not APPROVED can reach.
 *
 * Only the file under review: profile, documents, vehicle, status. No map, no
 * availability, no trips - the server would refuse those anyway, and offering
 * them would be a promise the backend does not keep.
 *
 * ENTRY POINT (this is the part that changed): a driver who has just verified an
 * OTP has an account and nothing else - no full name, no photo, no password. The
 * first thing they must see is "complete your profile", not a review screen that
 * says an empty application is being looked at. So the initial route is Profile
 * while the basic file is empty, and Pending once it is filled.
 *
 * WHY IT WAITS FOR THE PROFILE: `initialRouteName` is read once, when the
 * navigator mounts. Mounting before GET /driver/me has answered would decide the
 * entry point from `undefined` and always send an existing driver to the form.
 * The boot screen is shown for that one request instead - it is the same screen
 * the root navigator already uses while auth is resolving, so nothing new is
 * introduced.
 *
 * Screen order after that is the onboarding order: BASIC PROFILE -> DOCUMENTS ->
 * VEHICLE INFORMATION.
 *
 * Headers are shown here (unlike the rest of the app) because these are pushed
 * detail screens and the driver needs a way back that does not depend on the
 * Android hardware button alone. Both themes are honoured: the header reads the
 * palette rather than a hardcoded dark colour.
 */
export function OnboardingNavigator() {
  const palette = usePalette();
  const { data: profile, isPending } = useDriverProfile();

  /**
   * "Basic file empty" is deliberately judged on the two fields the profile
   * screen collects and the server actually returns - full name and photo. The
   * account password is NOT part of this test: /driver/me exposes no "has
   * password" flag, so a driver who set one would be sent back to the form on
   * every launch if we guessed.
   */
  const initialRouteName = useMemo<keyof OnboardingStackParamList>(() => {
    if (!profile) return "Profile";
    const hasName = !!profile.name && profile.name.trim().length > 0;
    const hasPhoto = !!profile.photoUrl;
    return hasName && hasPhoto ? "Pending" : "Profile";
  }, [profile]);

  // One request, then the stack mounts with a decided entry point.
  if (isPending && !profile) return <BootScreen />;

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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
      {/*
        Stitch `basic_info_setup`: photo, full name, account password. Its own
        header is drawn by the screen, so the stack header is hidden here - a
        driver arriving from the OTP has nothing to go back to anyway.
      */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: strings.documents.title,
          headerBackTitle: strings.common.back,
        }}
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
