export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 16,
  sheet: 20,
  pill: 999,
} as const;

/**
 * Driver-sized hit targets. A driver taps one-handed, often with the car
 * moving, so the floor is larger than the passenger app's 52pt: 56pt for
 * ordinary controls, 72pt for the accept / decline pair.
 */
export const touchTarget = {
  normal: 56,
  critical: 72,
} as const;

export const iconSize = { sm: 16, md: 20, lg: 24, xl: 28 } as const;
