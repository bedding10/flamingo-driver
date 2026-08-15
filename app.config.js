const read = (name) => process.env[name]?.trim();

// Opt-in strict mode. Turn it on (FLAMINGO_REQUIRE_NATIVE_CONFIG=1) only in a
// profile that actually carries the Maps keys, otherwise the config evaluation
// throws and the EAS build fails before it starts.
//
// It is deliberately NOT gated on EAS_BUILD: EAS Build exports EAS_BUILD="true",
// so an === "1" test silently disabled the whole guard on the very platform it
// was written for.
const requireNativeConfig =
  process.env.FLAMINGO_REQUIRE_NATIVE_CONFIG === "1";

module.exports = ({ config }) => {
  const androidMapsKey = read("GOOGLE_MAPS_ANDROID_API_KEY");
  const iosMapsKey = read("GOOGLE_MAPS_IOS_API_KEY");

  // Both files are committed at the project root, so the default path is the
  // one used on EAS. The env vars exist only to override them with an EAS
  // secret file if the account policy ever forbids committing them.
  const googleJson = read("GOOGLE_SERVICES_JSON") || "./google-services.json";
  const googlePlist =
    read("GOOGLE_SERVICES_PLIST") || "./GoogleService-Info.plist";

  const easProjectId =
    read("EAS_PROJECT_ID") || "4188ec50-c27c-4d53-b15e-3b8de5ab2a2a";

  if (requireNativeConfig) {
    const missing = [
      ["GOOGLE_MAPS_ANDROID_API_KEY", androidMapsKey],
      ["GOOGLE_MAPS_IOS_API_KEY", iosMapsKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length) {
      throw new Error(
        `Missing protected native configuration: ${missing.join(", ")}`,
      );
    }
  }

  return {
    ...config,

    android: {
      ...config.android,
      googleServicesFile: googleJson,
      config: {
        ...(config.android?.config || {}),
        googleMaps: { apiKey: androidMapsKey || "" },
      },
    },

    ios: {
      ...config.ios,
      googleServicesFile: googlePlist,
      config: {
        ...(config.ios?.config || {}),
        googleMapsApiKey: iosMapsKey || "",
      },
    },

    extra: {
      ...config.extra,
      eas: { projectId: easProjectId },
    },
  };
};
