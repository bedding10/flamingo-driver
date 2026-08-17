import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { STITCH_DARK, STITCH_LIGHT, usePalette } from "../theme";
import { Icon } from "./Icon";
import { VehicleMarker } from "./VehicleMarker";
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
 *
 * PHASE 1 (Stitch): the map styling is no longer a hand-written set of charcoal
 * hexes. Both styles below are built from the Stitch surface tokens, and the map
 * follows the theme - the previous version rendered a night map even in light
 * mode, which was the single most visible place light mode was not finished.
 * Reading the palette here is cheap: the palette object only changes when the
 * driver switches theme, so the memoised map is not re-rendered by a GPS fix.
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
  /** Approved ride class of the driver's vehicle; picks the marker artwork. */
  rideClass?: string | null;
};

const DEFAULT_ZOOM = 16;

/** Algiers. Only ever seen for the second before the first fix arrives. */
const FALLBACK_REGION = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Leg colours.
 *
 * Pink is "go and fetch them", Stitch's success green is "they are on board".
 * Both are reference tokens, and the two are far enough apart in hue that the
 * switch at Start Trip is obvious at a glance on a moving map.
 */
const LEG_TO_PICKUP = STITCH_DARK.primaryContainer;
const LEG_IN_PROGRESS = STITCH_DARK.success;

function DriverMapComponent({
  fix,
  follow,
  onPanByUser,
  route,
  rideClass,
}: Props) {
  const palette = usePalette();
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
  const legColor = toPickup ? LEG_TO_PICKUP : LEG_IN_PROGRESS;

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      // Google on both platforms so the styling below applies to iOS too;
      // Apple Maps ignores customMapStyle.
      provider={PROVIDER_GOOGLE}
      customMapStyle={palette.mode === "light" ? DAY_MAP_STYLE : NIGHT_MAP_STYLE}
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
      {route && route.coords.length > 1 ? (
        <Polyline
          coordinates={route.coords}
          strokeWidth={5}
          strokeColor={legColor}
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
                backgroundColor: palette.background,
                borderColor: legColor,
              },
            ]}
          >
            <Icon name={toPickup ? "place" : "flag"} size={14} color={legColor} />
          </View>
        </Marker>
      ) : null}

      {fix ? <VehicleMarker fix={fix} rideClass={rideClass} /> : null}
    </MapView>
  );
}

export const DriverMap = React.memo(DriverMapComponent);

const styles = StyleSheet.create({
  target: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Dark map, built from the Stitch surfaces so the map reads as part of the same
 * surface stack as the cards floating on it: the canvas is `background`, roads
 * step up through `surface-container-high` / `-highest` / `surface-bright`, and
 * labels use `on-surface-variant` over an `on-surface` inverse stroke.
 *
 * Road shields and business POIs stay hidden: they are clutter a driver never
 * uses while the only thing that matters is the road geometry.
 */
const NIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: STITCH_DARK.background }] },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: STITCH_DARK.onSurfaceVariant }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: STITCH_DARK.surfaceContainerLowest }],
  },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: STITCH_DARK.surfaceContainerHigh }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: STITCH_DARK.surfaceContainerHighest }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: STITCH_DARK.surfaceBright }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: STITCH_DARK.surfaceContainerLowest }],
  },
];

/** The same construction against the light scheme. */
const DAY_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: STITCH_LIGHT.surfaceDim }] },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: STITCH_LIGHT.onSurfaceVariant }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: STITCH_LIGHT.surfaceContainerLowest }],
  },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: STITCH_LIGHT.surfaceContainerLowest }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: STITCH_LIGHT.surfaceContainerLowest }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: STITCH_LIGHT.surfaceVariant }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: STITCH_LIGHT.tertiaryContainer }],
  },
];
