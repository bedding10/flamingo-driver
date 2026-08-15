import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { colors, withAlpha } from "../theme";
import type { DriverFix } from "../stores/location.store";
import type { ActiveRoute } from "../hooks/useTripRoute";

/**
 * The map behind the whole home screen.
 *
 * Memoized on purpose: a fix arrives every few seconds for the entire shift, and
 * the home screen re-renders with it. Without React.memo the map would be part
 * of every one of those renders, which is the single most expensive component
 * in the app.
 *
 * The camera is driven imperatively through `animateCamera` rather than by a
 * controlled `region` prop. A controlled region fights the driver's own
 * panning: every incoming fix would yank the view back mid-gesture. Here the
 * map stays uncontrolled and only follows while `follow` is true.
 */

type Props = {
  fix: DriverFix | null;
  /** False once the driver pans away, until they press recenter. */
  follow: boolean;
  onPanByUser?: () => void;
  /**
   * The active navigation leg, or null when there is no trip. Supplied by
   * useTripRoute, which gets it from the backend - the app never routes.
   */
  route?: ActiveRoute | null;
};

const DEFAULT_ZOOM = 16;

/** Algiers. Only ever seen for the second before the first fix arrives. */
const FALLBACK_REGION = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function DriverMapComponent({ fix, follow, onPanByUser, route }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const fittedLegRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fix || !follow) return;
    mapRef.current?.animateCamera(
      {
        center: { latitude: fix.lat, longitude: fix.lng },
        zoom: DEFAULT_ZOOM,
      },
      { duration: 600 },
    );
  }, [fix, follow]);

  /**
   * Fit the whole leg into view once, the moment it changes.
   *
   * Only once per leg: refitting on every refresh would fight the follow
   * camera above and yank the view while the driver is moving. The single fit
   * on ACCEPTED and again on IN_PROGRESS is what makes the switch from
   * "driver -> passenger" to "driver -> destination" visible.
   */
  useEffect(() => {
    if (!route || route.coords.length < 2) return;
    if (fittedLegRef.current === route.leg) return;
    fittedLegRef.current = route.leg;
    mapRef.current?.fitToCoordinates(route.coords, {
      edgePadding: { top: 120, right: 80, bottom: 320, left: 80 },
      animated: true,
    });
  }, [route]);

  useEffect(() => {
    if (!route) fittedLegRef.current = null;
  }, [route]);

  const toPickup = route?.leg === "to_pickup";

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      // Google on both platforms so the night styling below applies to iOS too;
      // Apple Maps ignores customMapStyle.
      provider={PROVIDER_GOOGLE}
      customMapStyle={NIGHT_MAP_STYLE}
      initialRegion={FALLBACK_REGION}
      // The blue OS dot is off: the driver's own vehicle marker is drawn below
      // and two dots for one car is confusing at a glance.
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
      showsTraffic={false}
      toolbarEnabled={false}
      rotateEnabled
      pitchEnabled={false}
      // onPanDrag is the only gesture signal that is not also fired by our own
      // animateCamera call, so following stops on a real drag and not on a
      // programmatic recenter.
      onPanDrag={onPanByUser}
    >
      {/* The route line. Gold to the passenger, teal once carrying them, so
          the driver can tell the two legs apart without reading anything. */}
      {route && route.coords.length > 1 ? (
        <Polyline
          coordinates={route.coords}
          strokeWidth={5}
          strokeColor={toPickup ? colors.gold : ROUTE_ACTIVE_COLOR}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}

      {/* End of the current leg: the passenger while heading to pickup, the
          drop-off point once the trip is running. */}
      {route?.destination ? (
        <Marker
          coordinate={route.destination}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View
            style={[
              styles.target,
              {
                borderColor: toPickup ? colors.gold : ROUTE_ACTIVE_COLOR,
              },
            ]}
          >
            <Text style={styles.targetGlyph}>{toPickup ? "●" : "■"}</Text>
          </View>
        </Marker>
      ) : null}

      {fix ? (
        <Marker
          coordinate={{ latitude: fix.lat, longitude: fix.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={fix.heading ?? 0}
          tracksViewChanges={false}
        >
          <View style={styles.puckHalo}>
            <View style={styles.puck} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}

export const DriverMap = React.memo(DriverMapComponent);

const styles = StyleSheet.create({
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
  target: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  targetGlyph: {
    color: colors.gold,
    fontSize: 10,
    lineHeight: 12,
  },
});

/** Teal for the in-progress leg: clearly not the gold "go fetch" colour. */
const ROUTE_ACTIVE_COLOR = colors.routeActive;

/**
 * Night styling matched to the app's charcoal surfaces.
 *
 * Road shields and business POIs are hidden: they add clutter that a driver
 * never uses while the only thing that matters is the road geometry.
 */
const NIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1B1B1D" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A8ADB6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111111" }] },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#26262A" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#2E2E33" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3A3A40" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0E1013" }],
  },
];
