/**
 * FRONTEND-ONLY image mapping for machine types.
 * This module is presentation-layer only — it does NOT interact with the backend.
 * Images are derived from equipment type/model labels, not from backend data.
 */

// Map equipment type names → machine image paths
const TYPE_IMAGES: Record<string, string> = {
  'Excavators':          '/machines/excavator_cat320.jpg',
  'Bulldozers':          '/machines/bulldozer_cat_d8.jpg',
  'Wheel Loaders':       '/machines/wheel_loader_cat.jpg',
  'Motor Graders':       '/machines/wheel_loader_cat.jpg',
  'Backhoe Loaders':     '/machines/excavator_cat320.jpg',
  'Skid Steer Loaders':  '/machines/wheel_loader_cat.jpg',
  'Cranes':              '/machines/fleet_hero_banner.jpg',
  'Forklifts':           '/machines/wheel_loader_cat.jpg',
  'Soil Compactors':     '/machines/bulldozer_cat_d8.jpg',
  'Asphalt Compactors':  '/machines/bulldozer_cat_d8.jpg',
  'Asphalt Pavers':      '/machines/wheel_loader_cat.jpg',
  'Cold Planers':        '/machines/bulldozer_cat_d8.jpg',
};

// Map asset type keyword → image (for Asset 360 and asset cards)
const ASSET_KEYWORD_IMAGES: Record<string, string> = {
  'EXCAVATOR':  '/machines/excavator_cat320.jpg',
  'BULLDOZER':  '/machines/bulldozer_cat_d8.jpg',
  'LOADER':     '/machines/wheel_loader_cat.jpg',
  'GRADER':     '/machines/wheel_loader_cat.jpg',
  'CRANE':      '/machines/fleet_hero_banner.jpg',
  'COMPACTOR':  '/machines/bulldozer_cat_d8.jpg',
  'PAVER':      '/machines/wheel_loader_cat.jpg',
};

/** Hero/banner image for Command Center */
export const FLEET_HERO_IMAGE = '/machines/fleet_hero_banner.jpg';

/** Fallback image when no mapping found */
export const MACHINE_FALLBACK_IMAGE = '/machines/excavator_cat320.jpg';

/**
 * Get an image path for a given equipment type name.
 * Returns the fallback if no mapping exists.
 */
export function getMachineImageByType(typeName: string): string {
  return TYPE_IMAGES[typeName] ?? MACHINE_FALLBACK_IMAGE;
}

/**
 * Get an image path by scanning an asset ID or description for known keywords.
 * Frontend-only heuristic — does not call the backend.
 */
export function getMachineImageByKeyword(text: string): string {
  const upper = text.toUpperCase();
  for (const [keyword, path] of Object.entries(ASSET_KEYWORD_IMAGES)) {
    if (upper.includes(keyword)) return path;
  }
  return MACHINE_FALLBACK_IMAGE;
}
