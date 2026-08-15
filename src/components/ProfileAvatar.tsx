import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { colors, withAlpha } from "../theme";

/**
 * Phase 11 - the single avatar component of the driver app.
 *
 * Photo centred, level frame drawn on top. The photo always keeps 76% of the
 * box, so the frame never covers the face and never resizes the image, at any
 * size, for all five levels.
 *
 * `frameUrl` always comes from the backend (`profileFrameUrl`). This file holds
 * no R2 host, no object key, no thresholds: the driver app never computes a
 * level, it renders the one the server sent.
 *
 * Cache: the SVG markup is fetched once per URL per app session and stored in a
 * module-level map keyed by the URL. A level change produces a different URL, so
 * a stale frame can never survive a BRONZE -> SILVER transition, and re-renders
 * never hit the network.
 */

const frameCache = new Map<string, string>();
const failedFrames = new Set<string>();

export type ProfileAvatarProps = {
  avatarUrl?: string | null;
  frameUrl?: string | null;
  size?: number;
  fallback?: string | null;
  loading?: boolean;
  error?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ProfileAvatar({
  avatarUrl,
  frameUrl,
  size = 64,
  fallback,
  loading = false,
  error = false,
  style,
  accessibilityLabel,
}: ProfileAvatarProps) {
  const [markup, setMarkup] = useState<string | null>(() =>
    frameUrl ? frameCache.get(frameUrl) ?? null : null,
  );
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!frameUrl) {
      setMarkup(null);
      return;
    }
    const cached = frameCache.get(frameUrl);
    if (cached) {
      setMarkup(cached);
      return;
    }
    if (failedFrames.has(frameUrl)) {
      setMarkup(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const response = await fetch(frameUrl);
        if (!response.ok) throw new Error(String(response.status));
        const xml = await response.text();
        frameCache.set(frameUrl, xml);
        if (alive) setMarkup(xml);
      } catch {
        failedFrames.add(frameUrl);
        if (alive) setMarkup(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [frameUrl]);

  const inner = useMemo(() => Math.round(size * 0.76), [size]);
  const showImage = Boolean(avatarUrl) && !imageFailed && !error && !loading;

  return (
    <View
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: withAlpha(colors.gold, 0.14),
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : showImage ? (
          <Image
            source={{ uri: avatarUrl as string }}
            onError={() => setImageFailed(true)}
            style={{ width: inner, height: inner }}
          />
        ) : (
          <Text
            style={{
              color: colors.gold,
              fontSize: Math.round(inner * 0.42),
              fontWeight: "800",
            }}
          >
            {(fallback ?? "").trim().slice(0, 1).toUpperCase() || "\u2605"}
          </Text>
        )}
      </View>

      {markup ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SvgXml xml={markup} width="100%" height="100%" />
        </View>
      ) : null}
    </View>
  );
}
