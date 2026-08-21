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
import { missingRequiredDocuments } from "../types/driver";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * What a driver who is not APPROVED can reach.
 *
 * Only the file under review: profile, documents, vehicle, status. No map, no
 * availability, no trips - the server would refuse those anyway, and offering
 * them would be a promise the backend does not keep.
 *
 * REGISTRATION ORDER, and this is the part that matters:
 *
 *   phone -> OTP -> BASIC INFO (photo, full name, password, city)
 *         -> DOCUMENTS (licence, registration, insurance, ...)
 *         -> VEHICLE INFORMATION
 *         -> UNDER REVIEW
 *
 * "Under review" is the LAST step, never an interruption in the middle. A
 * driver who has just verified an OTP has an account and nothing else, so
 * telling them an empty application is being verified would be false.
 *
 * The entry point therefore walks the file and stops at the first incomplete
 * step. Each test uses only what GET /driver/me actually returns:
 *   - name + photo   -> the basic info step
 *   - required docs  -> missingRequiredDocuments(), the same helper the
 *                       documents screen uses, so the two can never disagree
 *   - model + plate  -> the fields the server itself requires on a vehicle
 *
 * The account password is deliberately NOT part of any test: /driver/me exposes
 * no "has password" flag, so guessing would bounce a returning driver back to
 * the form on every launch.
 *
 * WHY IT WAITS FOR THE PROFILE: `initialRouteName` is read once, when the
 * navigator mounts. Mounting before GET /driver/me has answered would decide
 * the entry point from `undefined` and always send an existing driver to the
 * form. The boot screen covers that one request - the same screen the root
 * navigator already uses while auth resolves.
 *
 * Headers are shown here (unlike the rest of the app) because these are pushed
 * detail screens and the driver needs a way back that does not depend on the
 * Android hardware button alone. Both themes are honoured: the header reads the
 * palette rather than a hardcoded dark colour.
 */
export function OnboardingNavigator() {
  const palette = usePalette();
  const { data: profile, isPending } = useDriverProfile();

  const initialRouteName = useMemo<keyof OnboardingStackParamList>(() => {
    if (!profile) return "Profile";

    const hasName = !!profile.name && profile.name.trim().length > 0;
    const hasPhoto = !!profile.photoUrl;
    if (!hasName || !hasPhoto) return "Profile";

    if (missingRequiredDocuments(profile.documents).length > 0) {
      return "Documents";
    }

    const vehicle = profile.vehicle;
    const hasVehicle = !!vehicle?.model && !!vehicle?.plate;
    if (!hasVehicle) return "Vehicle";

    // Everything submitted: now, and only now, there is something to review.
    return "Pending";
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
      {/*
        Declared FIRST so the flow reads in onboarding order. Stitch
        `basic_info_setup`: photo, full name, account password, city. Its own
        header is drawn by the screen, so the stack header is hidden - a driver
        arriving from the OTP has nothing to go back to anyway.
      */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={{
          title: strings.profile.vehicleSection,
          headerBackTitle: strings.common.back,
        }}
      />
      {/*
        LAST, on purpose: it is the end of the file, not a stop along the way.
        Being declared last also means it can never become the initial route by
        accident if `initialRouteName` ever resolves to undefined.
      */}
      <Stack.Screen
        name="Pending"
        component={PendingApprovalScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
