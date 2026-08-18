import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "./Icon";
import { config } from "../config";
import { iconSize, radius, usePalette, withAlpha } from "../theme";
import type { DriverFix } from "../stores/location.store";

/**
 * The driver's own vehicle on the map.
 *
 * STITCH FIDELITY PASS - this is now the reference puck, not a photo of a car.
 * `main_driver_map` draws the driver as:
 *
 *   div  bg-primary-container rounded-full p-3 animate-pulse
 *        shadow-[0_0_24px_rgba(255,77,141,0.5)]
 *     span material-symbols-outlined text-on-primary-container -> directions_car
 *   div  w-1 h-8 bg-gradient-to-b from-primary-container to-transparent
 *        opacity-50                                            -> the trail
 *
 * So: a 48px pink disc holding a 24px car glyph, wrapped in a pink glow, with a
 * 4x32 gradient trail behind it. The previous version rendered a top-down car
 * sprite downloaded from R2, which is a different picture entirely - that is
 * what the owner meant by "it looks nothing like the images".
 *
 * THREE THINGS THE REFERENCE DOES THAT THIS CANNOT COPY LITERALLY:
 *
 *  1. `animate-pulse` is dropped ON PURPOSE. react-native-maps snapshots a
 *     custom marker view; an animation forces `tracksViewChanges` to stay true
 *     forever, which means re-snapshotting the marker every frame for a whole
 *     shift. That is the documented battery and frame-rate killer on this
 *     screen, and a pulsing dot is not worth it. The glow is static instead.
 *  2. `shadow-[0_0_24px_...]` is a coloured glow, and Android elevation cannot
 *     draw one. The glow is therefore a real 72px halo View filled with the same
 *     pink at 25% - visible on both platforms - plus the iOS shadow on top.
 *  3. The trail sits BEHIND the puck, which is what `rotation={heading}` plus a
 *     centre anchor gives: the anchor is placed on the disc's centre, not the
 *     centre of the whole view, so the trail sweeps around the vehicle rather
 *     than the vehicle orbiting its own trail.
 *
 * KEPT FROM THE PREVIOUS VERSION, because both were right:
 *
 *  - the last real bearing is remembered. `fix.heading` is null whenever the
 *    driver is stationary or the OS has no bearing yet, and snapping to north in
 *    that moment made a parked car visibly spin.
 *  - `tracksViewChanges` is true only briefly. The view is now entirely local
 *    (a shape and an icon font) so it no longer has to wait for a download, but
 *    it does have to be snapshotted at least once after the icon font is ready,
 *    otherwise the marker renders permanently blank and a driver cannot see
 *    where they are. Rotation is a native Marker prop and needs no re-snapshot.
 *
 * The BIKE ride class still gets its own glyph: the class is whatever staff
 * approved on the vehicle, and this component never guesses it from make or
 * model.
 */

/** Reference sizes: p-3 around a 24px glyph, w-1 h-8 trail. */
const PUCK = 48;
const HALO = 72;
const TAIL_WIDTH = 4;
const TAIL_HEIGHT = 32;
const TOTAL_HEIGHT = HALO + TAIL_HEIGHT;
/** Anchor on the DISC's centre, not the centre of the view with the trail. */
const ANCHOR_Y = HALO / 2 / TOTAL_HEIGHT;

/**
 * Public URL of the R2 marker artwork for a ride class.
 *
 * The map no longer uses it - the reference puck replaced the sprite - but it is
 * still exported because the artwork is real, it is configured server-side, and
 * removing a working helper is not part of a visual pass.
 */
export function vehicleMarkerUrl(rideClass?: string | null): string {
  const key =
    rideClass === "BIKE"
      ? config.media.vehicleMarkers.moto
      : config.media.vehicleMarkers.car;
  return `${config.media.publicBaseUrl}/${key}`;
}

export type VehicleMarkerProps = {
  fix: DriverFix;
  /** The vehicle's approved ride class, as returned by GET /driver/me. */
  rideClass?: string | null;
};

export function VehicleMarker({ fix, rideClass }: VehicleMarkerProps) {
  const palette = usePalette();

  // Snapshot once, shortly after mount, then stop tracking. Re-armed when the
  // glyph changes, which only happens if staff re-classify the vehicle.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, [rideClass]);

  // Last real bearing. Updated during render on purpose: it must be applied to
  // the very fix that carried it, and it is derived state, not a subscription.
  const headingRef = useRef(0);
  if (typeof fix.heading === "number" && Number.isFinite(fix.heading)) {
    headingRef.current = fix.heading;
  }

  return (
    <Marker
      coordinate={{ latitude: fix.lat, longitude: fix.lng }}
      anchor={{ x: 0.5, y: ANCHOR_Y }}
      flat
      rotation={headingRef.current}
      tracksViewChanges={!ready}
    >
      <View style={styles.stack}>
        <View
          style={[
            styles.halo,
            { backgroundColor: withAlpha(palette.primary, 0.25) },
          ]}
        >
          <View
            style={[
              styles.puck,
              { backgroundColor: palette.primary, shadowColor: palette.primary },
            ]}
          >
            <Icon
              name={rideClass === "BIKE" ? "bike" : "car"}
              size={iconSize.lg}
              color={palette.onPrimary}
            />
          </View>
        </View>

        <LinearGradient
          colors={[palette.primary, withAlpha(palette.primary, 0)]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.tail}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: "center", width: HALO, height: TOTAL_HEIGHT },
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  puck: {
    width: PUCK,
    height: PUCK,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  tail: {
    width: TAIL_WIDTH,
    height: TAIL_HEIGHT,
    opacity: 0.5,
  },
});
