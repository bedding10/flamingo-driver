import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { config } from "../config";
import { usePalette, withAlpha } from "../theme";
import type { DriverFix } from "../stores/location.store";

/**
 * PHASE 2 - the driver's own vehicle on the map. PHASE 7 - caching and heading.
 *
 * Deliberate decisions:
 *
 * 1. The artwork comes from R2, by object key, and the app picks between exactly
 *    two files: a motorbike for the BIKE ride class, a car for everything else.
 *    The class is whatever the backend approved on the vehicle; this component
 *    never guesses it from make or model. The Google default pin is never used.
 * 2. `tracksViewChanges` starts TRUE and is switched off as soon as the image
 *    reports it has loaded. This is the whole reason the marker is its own
 *    component: react-native-maps snapshots a custom marker view once, so a
 *    marker left at `false` while a remote image is still downloading renders
 *    permanently blank - and a driver with no marker cannot tell where they are.
 *    Leaving it at `true` forever is the opposite mistake: it re-snapshots on
 *    every single fix, for hours, which is the classic battery and frame-rate
 *    killer on this screen.
 * 3. PHASE 7: the image is prefetched once per URL per app session
 *    (`Image.prefetch` + a module-level set), so it is served from the native
 *    image cache afterwards. A GPS fix every few seconds therefore re-renders a
 *    cached bitmap and never re-downloads it. The <Image> `source` object is
 *    also built once per URL instead of per render, so React does not see a new
 *    source identity on each fix.
 * 4. PHASE 7: the last known heading is remembered. `fix.heading` is null
 *    whenever the driver is stationary or the OS has no bearing yet, and the
 *    previous code snapped the car to north (0) in that moment - a parked car
 *    visibly spinning to face north on every other fix. Keeping the last real
 *    bearing is both calmer and more truthful; only the very first fix of a
 *    session can be unrotated.
 * 5. A failed download falls back to a BRAND PINK puck rather than to nothing.
 *    The map must always show the driver's position even when the CDN is
 *    unreachable or the object key is wrong.
 *
 *    PHASE 1: this puck used to be drawn in `colors.gold`. Gold is not a
 *    flaminGO identity colour (section 7), and this is the degraded state - the
 *    exact moment a driver is most likely to be staring at their own marker
 *    wondering what went wrong. It now reads the brand pink from the palette,
 *    which also makes it correct in light mode instead of a fixed dark-only
 *    pairing.
 * 6. `flat` keeps the vehicle lying on the road surface while the map rotates.
 *
 * RTL: nothing here mirrors. A map marker is positioned in world coordinates and
 * rotated by a compass bearing, neither of which has a reading direction.
 */

const MARKER_SIZE = 46;

/** Public URL of the marker artwork for a ride class. */
export function vehicleMarkerUrl(rideClass?: string | null): string {
  const key =
    rideClass === "BIKE"
      ? config.media.vehicleMarkers.moto
      : config.media.vehicleMarkers.car;
  return `${config.media.publicBaseUrl}/${key}`;
}

/** URLs already handed to the native image cache, once per app session. */
const prefetched = new Set<string>();
/** Stable `source` objects, so a re-render never changes the image identity. */
const sources = new Map<string, { uri: string }>();

function sourceFor(uri: string): { uri: string } {
  const existing = sources.get(uri);
  if (existing) return existing;
  const created = { uri };
  sources.set(uri, created);
  return created;
}

export type VehicleMarkerProps = {
  fix: DriverFix;
  /** The vehicle's approved ride class, as returned by GET /driver/me. */
  rideClass?: string | null;
};

export function VehicleMarker({ fix, rideClass }: VehicleMarkerProps) {
  const palette = usePalette();
  const uri = vehicleMarkerUrl(rideClass);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // A ride class change (staff re-classified the vehicle) swaps the URL, so the
  // load state has to start over or the new image would never be snapshotted.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [uri]);

  useEffect(() => {
    if (prefetched.has(uri)) return;
    prefetched.add(uri);
    void Image.prefetch(uri).catch(() => undefined);
  }, [uri]);

  // Last real bearing. Updated during render on purpose: it must be applied to
  // the very fix that carried it, and it is derived state, not a subscription.
  const headingRef = useRef(0);
  if (typeof fix.heading === "number" && Number.isFinite(fix.heading)) {
    headingRef.current = fix.heading;
  }

  return (
    <Marker
      coordinate={{ latitude: fix.lat, longitude: fix.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={headingRef.current}
      tracksViewChanges={!loaded && !failed}
    >
      {failed ? (
        <View
          style={[
            styles.puckHalo,
            { backgroundColor: withAlpha(palette.primary, 0.22) },
          ]}
        >
          <View
            style={[
              styles.puck,
              {
                backgroundColor: palette.primary,
                borderColor: palette.background,
              },
            ]}
          />
        </View>
      ) : (
        <Image
          source={sourceFor(uri)}
          style={styles.vehicle}
          resizeMode="contain"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </Marker>
  );
}

const styles = StyleSheet.create({
  vehicle: { width: MARKER_SIZE, height: MARKER_SIZE },
  puckHalo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  puck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
});
