import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { catalogApi } from "../api";
import type {
  CatalogVehicleCategory,
  CatalogVehicleType,
} from "../api/catalog.api";
import { textAlignStart } from "../i18n";
import { alpha, RADIUS, SPACING, TOUCH_TARGET, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";
import { PillButton } from "../ui";

/**
 * Vehicle kind + type picker, entirely dashboard-driven.
 *
 * GET /catalog/vehicles?audience=driver returns VehicleCategory rows (car,
 * motorcycle, ...) each holding VehicleType rows (economy, confort, women-only,
 * bike ...). Both levels are dashboard data: nothing here hardcodes "car" or
 * "motorcycle", so a category created tonight in the dashboard appears on the
 * next fetch with its own icon, colour and types.
 *
 * WHY IT LIVES ON THE DOCUMENTS STEP: each type declares requiredDocuments /
 * requiredPhotos, so the type must be known before the driver is told which
 * papers to upload. A motorcycle rider should never be blocked on a car-only
 * document.
 *
 * WHAT IT CANNOT DO YET - stated on the card, not hidden: the driver's choice
 * is not persisted. UpdateDriverProfileDto has no vehicleTypeId and the server
 * runs ValidationPipe with forbidNonWhitelisted, so sending it returns 400, not
 * a silent ignore. Today only an operator writes the type
 * (PATCH /vehicles/:id/reclassify, PATCH /vehicles/:id/verify). The selection is
 * therefore local: it tailors the document checklist and is repeated back to
 * the reviewer as the driver's declared type. See SERVER_TODO.md section 1 for
 * the exact endpoint change needed.
 */

const COPY = {
  title:
    "\u0646\u0648\u0639 \u0627\u0644\u0645\u0631\u0643\u0628\u0629",
  subtitle:
    "\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0626\u0629 \u0648\u0627\u0644\u0646\u0648\u0639 \u0627\u0644\u0630\u064a \u062a\u0639\u0645\u0644 \u0628\u0647 \u0644\u0643\u064a \u062a\u0635\u0644\u0643 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0647 \u0641\u0642\u0637.",
  loading:
    "\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0641\u0626\u0627\u062a...",
  error:
    "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0641\u0626\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a.",
  retry: "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629",
  empty:
    "\u0644\u0645 \u062a\u064f\u0646\u0634\u0631 \u0623\u064a \u0641\u0626\u0629 \u0645\u0631\u0643\u0628\u0627\u062a \u0645\u0646 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 \u0628\u0639\u062f.",
  seats: "\u0645\u0642\u0627\u0639\u062f",
  negotiable:
    "\u064a\u0642\u0628\u0644 \u0627\u0644\u062a\u0641\u0627\u0648\u0636 \u0639\u0644\u0649 \u0627\u0644\u0633\u0639\u0631",
  fixed:
    "\u0633\u0639\u0631 \u062b\u0627\u0628\u062a \u0628\u0644\u0627 \u062a\u0641\u0627\u0648\u0636",
  minYear: "\u0645\u0648\u062f\u064a\u0644 ",
  minYearSuffix: " \u0623\u0648 \u0623\u062d\u062f\u062b",
  confirmedBy:
    "\u064a\u064f\u0639\u062a\u0645\u062f \u0627\u0644\u0646\u0648\u0639 \u0646\u0647\u0627\u0626\u064a\u064b\u0627 \u0645\u0646 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 \u0639\u0646\u062f \u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u062b\u0627\u0626\u0642\u0643.",
  serverType:
    "\u0627\u0644\u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062c\u0644 \u062d\u0627\u0644\u064a\u064b\u0627 \u0641\u064a \u0627\u0644\u062e\u0627\u062f\u0645",
} as const;

/** Fallback glyphs when the dashboard has no icon for a category. */
const CATEGORY_GLYPHS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  BIKE: "two-wheeler",
  MOTORCYCLE: "two-wheeler",
  MOTO: "two-wheeler",
  CAR: "directions-car",
  VAN: "airport-shuttle",
  XL: "airport-shuttle",
};

function glyphFor(
  entity: { name: string; iconValue: string | null },
  fallbackFrom?: string,
): keyof typeof MaterialIcons.glyphMap {
  const keys = [entity.iconValue, entity.name, fallbackFrom]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toUpperCase());
  for (const key of keys) {
    const direct = CATEGORY_GLYPHS[key];
    if (direct) return direct;
    if (key.includes("BIKE") || key.includes("MOTO")) return "two-wheeler";
    if (key.includes("VAN") || key.includes("XL")) return "airport-shuttle";
  }
  return "directions-car";
}

export type VehicleTypePickerProps = {
  /** vehicleTypeId already stored on the driver's vehicle, if any. */
  serverTypeId?: string | null;
  /** Currently selected type id (owned by the parent screen). */
  value?: string | null;
  onChange: (type: CatalogVehicleType | null) => void;
  /** Narrows the catalog to the driver's city when known. */
  cityId?: string | null;
};

export function VehicleTypePicker({
  serverTypeId,
  value,
  onChange,
  cityId,
}: VehicleTypePickerProps) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [categories, setCategories] = useState<CatalogVehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const catalog = await catalogApi.fetchVehicleCatalog({
        audience: "driver",
        cityId: cityId ?? undefined,
      });
      // Empty categories would render a tab that leads nowhere.
      const usable = (catalog.categories ?? []).filter(
        (category) => (category.types ?? []).length > 0,
      );
      setCategories(usable);
      return usable;
    } catch {
      setFailed(true);
      return [] as CatalogVehicleCategory[];
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    let mounted = true;
    void load().then((usable) => {
      if (!mounted || usable.length === 0) return;
      // Preselect whatever the server already knows, else the first category.
      const owning =
        usable.find((category) =>
          (category.types ?? []).some(
            (type) => type.id === (value ?? serverTypeId),
          ),
        ) ?? usable[0];
      setCategoryId(owning.id);
    });
    return () => {
      mounted = false;
    };
  }, [load, serverTypeId, value]);

  const category =
    categories.find((item) => item.id === categoryId) ?? categories[0] ?? null;
  const types = useMemo(
    () =>
      [...(category?.types ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
    [category],
  );

  return (
    <View style={[styles.card, t.shadowCard]}>
      <Text style={styles.title}>{COPY.title}</Text>
      <Text style={styles.subtitle}>{COPY.subtitle}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.colors.primary} />
          <Text style={styles.muted}>{COPY.loading}</Text>
        </View>
      ) : failed ? (
        <View style={styles.center}>
          <Text style={styles.error}>{COPY.error}</Text>
          <PillButton
            label={COPY.retry}
            variant="secondary"
            onPress={() => {
              void load();
            }}
          />
        </View>
      ) : categories.length === 0 ? (
        <Text style={styles.muted}>{COPY.empty}</Text>
      ) : (
        <>
          {/* Category segment: car / motorcycle / whatever else exists. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segment}
          >
            {categories.map((item) => {
              const active = item.id === category?.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setCategoryId(item.id);
                    // Switching kind invalidates a type from the other kind.
                    const keeps = (item.types ?? []).some(
                      (type) => type.id === value,
                    );
                    if (!keeps) onChange(null);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <MaterialIcons
                    name={glyphFor(item, item.usageType)}
                    size={t.iconSize.md}
                    color={active ? t.colors.onPrimary : t.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {catalogApi.catalogLabel(item)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Types inside the chosen kind. */}
          <View style={styles.types}>
            {types.map((type) => {
              const selected = type.id === value;
              const isServerType = type.id === serverTypeId;
              return (
                <Pressable
                  key={type.id}
                  onPress={() => onChange(selected ? null : type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.type, selected && styles.typeSelected]}
                >
                  <View style={styles.typeIcon}>
                    <MaterialIcons
                      name={glyphFor(type, type.rideClass)}
                      size={t.iconSize.lg}
                      color={type.color ?? t.colors.primary}
                    />
                  </View>

                  <View style={styles.typeBody}>
                    <Text style={styles.typeName}>
                      {catalogApi.catalogLabel(type)}
                      {type.badgeText ? "  " + type.badgeText : ""}
                    </Text>
                    <Text style={styles.typeMeta}>
                      {type.capacity + " " + COPY.seats}
                      {"  \u00b7  "}
                      {type.allowsNegotiation ? COPY.negotiable : COPY.fixed}
                      {type.minVehicleYear
                        ? "  \u00b7  " +
                          COPY.minYear +
                          type.minVehicleYear +
                          COPY.minYearSuffix
                        : ""}
                    </Text>
                    {isServerType ? (
                      <Text style={styles.serverTag}>{COPY.serverType}</Text>
                    ) : null}
                  </View>

                  <MaterialIcons
                    name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                    size={t.iconSize.lg}
                    color={selected ? t.colors.primary : t.colors.outline}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* The honest part: the operator has the last word for now. */}
          <Text style={styles.footnote}>{COPY.confirmedBy}</Text>
        </>
      )}
    </View>
  );
}

function makeStyles(t: Tokens) {
  const light = t.mode === "light";

  return StyleSheet.create({
    card: {
      borderRadius: RADIUS.card,
      backgroundColor: t.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: light
        ? t.colors.outlineVariant
        : alpha(t.colors.surfaceVariant, 0.6),
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    title: {
      ...typo("titleMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    subtitle: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
    },
    center: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.lg },
    muted: {
      ...typo("bodyMd"),
      color: t.colors.onSurfaceVariant,
      textAlign: "center",
    },
    error: { ...typo("bodyMd"), color: t.colors.error, textAlign: "center" },
    segment: { gap: SPACING.sm, paddingVertical: SPACING.xs },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      minHeight: TOUCH_TARGET,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: "transparent",
    },
    tabActive: {
      backgroundColor: t.colors.primaryContainer,
      borderColor: t.colors.primary,
    },
    tabText: { ...typo("labelMd"), color: t.colors.onSurfaceVariant },
    tabTextActive: { color: t.colors.onPrimary },
    types: { gap: SPACING.sm },
    type: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      minHeight: TOUCH_TARGET + SPACING.md,
      padding: SPACING.md,
      borderRadius: RADIUS.xl,
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    typeSelected: {
      borderColor: t.colors.primary,
      backgroundColor: alpha(t.colors.primary, light ? 0.08 : 0.12),
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.surfaceContainerHighest,
    },
    typeBody: { flex: 1, gap: 2 },
    typeName: {
      ...typo("labelMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    typeMeta: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
    },
    serverTag: {
      ...typo("labelSm"),
      color: t.semantic.success,
      textAlign: textAlignStart(),
    },
    footnote: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
    },
  });
}
