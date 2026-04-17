/**
 * Converts hex color to RGB format for CSS variables
 * @param hex - Hex color string (e.g., "#ff5733" or "ff5733")
 * @returns RGB string in format "r g b" (e.g., "255 87 51")
 */
export function hexToRgb(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Validate hex format (must be 6 characters)
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid hex color format: ${hex}`);
  }

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `${r} ${g} ${b}`;
}

/**
 * Validates if a string is a valid hex color
 * @param hex - String to validate
 * @returns true if valid hex color
 */
export function isValidHex(hex: string): boolean {
  const cleanHex = hex.replace(/^#/, "");
  return /^[0-9A-Fa-f]{6}$/.test(cleanHex);
}
