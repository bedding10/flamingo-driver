import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * PHASE 2. Welcome is declared FIRST, which is what makes it the initial route:
 * section 12 puts Welcome at step 1 of onboarding, before the app asks for a
 * phone number. Until this commit the stack had exactly one screen and the app
 * opened straight onto the phone form.
 *
 * Login stays a separate route rather than a mode of Welcome, so the Android
 * back button and the iOS back gesture return to Welcome instead of dropping
 * out of the auth stack entirely.
 *
 * Headers stay hidden: both screens draw their own Stitch header.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
