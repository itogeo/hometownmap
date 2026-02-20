/**
 * City configuration helpers for multi-tenant HometownMap.
 *
 * The active city is set via the NEXT_PUBLIC_CITY environment variable.
 * Defaults to 'three-forks' for backward compatibility.
 */

/** Get the current city slug from the environment variable. */
export function getCitySlug(): string {
  return process.env.NEXT_PUBLIC_CITY || 'three-forks'
}

/** Path to the city's configuration JSON (served from /public). */
export function getCityConfigPath(): string {
  return `/data/config/${getCitySlug()}.json`
}

/** Path to a GeoJSON layer file for the current city. */
export function getCityLayerPath(filename: string): string {
  return `/data/layers/${getCitySlug()}/${filename}`
}
