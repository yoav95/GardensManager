/**
 * Calculate the center point and bounds from a list of gardens
 * Returns bounds suitable for map fitting, or default Israel bounds if no gardens
 * 
 * @param {Array} gardens - Array of garden objects with lat/lng properties
 * @returns {Object} Object with center [lat, lng] and bounds [[minLat, minLng], [maxLat, maxLng]]
 */
export function calculateGardensCenterBounds(gardens) {
  // Default bounds for Israel if no gardens
  const defaultBounds = {
    center: [31.5, 34.85], // Center of Israel
    bounds: [
      [32.4, 34.7],   // north-west corner
      [32.0, 35.0],   // south-east corner
    ]
  };

  // Filter gardens with valid coordinates
  const validGardens = gardens?.filter(g => g?.lat != null && g?.lng != null) ?? [];

  if (validGardens.length === 0) {
    return defaultBounds;
  }

  if (validGardens.length === 1) {
    const garden = validGardens[0];
    return {
      center: [garden.lat, garden.lng],
      bounds: [
        [garden.lat + 0.05, garden.lng - 0.05],
        [garden.lat - 0.05, garden.lng + 0.05],
      ]
    };
  }

  // Calculate centroid (average of all coordinates)
  let minLat = validGardens[0].lat;
  let maxLat = validGardens[0].lat;
  let minLng = validGardens[0].lng;
  let maxLng = validGardens[0].lng;
  let sumLat = 0;
  let sumLng = 0;

  validGardens.forEach(garden => {
    sumLat += garden.lat;
    sumLng += garden.lng;
    
    minLat = Math.min(minLat, garden.lat);
    maxLat = Math.max(maxLat, garden.lat);
    minLng = Math.min(minLng, garden.lng);
    maxLng = Math.max(maxLng, garden.lng);
  });

  const center = [
    sumLat / validGardens.length,
    sumLng / validGardens.length
  ];

  // Add padding to bounds (5% padding)
  const latPadding = (maxLat - minLat) * 0.1;
  const lngPadding = (maxLng - minLng) * 0.1;

  const bounds = [
    [maxLat + latPadding, minLng - lngPadding], // north-west
    [minLat - latPadding, maxLng + lngPadding], // south-east
  ];

  return { center, bounds };
}
