import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { config } from "../config";
import { colors, withAlpha } from "../theme";
import type { DriverFix } from "../stores/location.store";

/**
 * PHASE 2 - the driver's own vehicle on the map.
 *
 * Four deliberate decisions:
 *
 * 1. The artwork comes from R2, by object key, and the app picks between exactly
 *    two files: a motorbike for the BIKE ride class, a car for everything else.
 *    The class is whatever the backend approved on the vehicle; this component
 *    never guesses it from make or model.
 * 2. `tracksViewChanges` starts TRUE and is switched off as soon as the image
 *    reports it has loaded. This is the whole reason the marker is its own
 *    component: react-native-maps snapshots a custom marker view once, so a
 *    marker left at `false` while a remote image is still downloading renders
 *    permanently blank - and a driver with no marker cannot tell where they are.
 *    Leaving it at `true` forever is the opposite mistake: it re-snapshots on
 *    every single fix, for hours, which is the classic battery and frame-rate
 *    killer on this screen.
 * 3. A failed download falls back to the previous gold puck rather than to
 *    nothing. The map must always show the driver's position even when the CDN
 *    is unreachable or the object key is wrong.
 * 4. `flat` + `rotation` keeps the vehicle lying on the road surface and turned
 *    towards the heading the GPS reported. When the fix carries no heading, the
 *    rotation is 0 instead of a guessed bearing: a marker pointing confidently
 *    the wrong way is worse than one pointing north.
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

export type VehicleMarkerProps = {
  fix: DriverFix;
  /** The vehicle's approved ride class, as returned by GET /driver/me. */
  rideClass?: string | null;
};

export function VehicleMarker({ fix, rideClass }: VehicleMarkerProps) {
  const uri = vehicleMarkerUrl(rideClass);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // A ride class change (staff re-classified the vehicle) swaps the URL, so the
  // load state has to start over or the new image would never be snapshotted.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [uri]);

  return (
    <Marker
      coordinate={{ latitude: fix.lat, longitude: fix.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={fix.heading ?? 0}
      tracksViewChanges={!loaded && !failed}
    >
      {failed ? (
        <View style={styles.puckHalo}>
          <View style={styles.puck} />
        </View>
      ) : (
        <Image
          source={{ uri }}
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
    backgroundColor: withAlpha(colors.gold, 0.22),
    alignItems: "center",
    justifyContent: "center",
  },
  puck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.ink,
  },
});
