// postalUtils.ts
import { postalRanges } from './postalRanges';
import { ZoneGroup, zoneMatrix } from './zoneMatrix';

// Function to find the group for a given postal code
export const findGroupForPostalCode = (postalCode: number): ZoneGroup | null => {
  const numericPostal = Number(postalCode);
  if (isNaN(numericPostal)) return null;

  const range = postalRanges.find(
    r => numericPostal >= r.cpostal_inicio && numericPostal <= r.cpostal_fin
  );
  
  return range ? range.grupo as ZoneGroup : null;
};

// Function to calculate zone between two postal codes
export const calculateZone = (originPostal: number, destPostal: number): number | null => {
  const originGroup = findGroupForPostalCode(originPostal);
  const destGroup = findGroupForPostalCode(destPostal);

  if (!originGroup || !destGroup) return null;

  // TypeScript now knows originGroup and destGroup are valid ZoneGroup values
  return zoneMatrix[originGroup][destGroup] || null;
};