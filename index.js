import "react-native-gesture-handler";
import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { registerRootComponent } from "expo";
import App from "./src/App";

// Layout direction is never forced (same decision as the passenger app):
// text alignment follows the language at render time, layout stays explicit.
//
// The no-op background handler keeps data-only FCM messages from crashing the
// headless task while the app is backgrounded.
setBackgroundMessageHandler(getMessaging(), async () => undefined);

registerRootComponent(App);
