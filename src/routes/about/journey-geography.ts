type Coordinates = { longitude: number; latitude: number };
type Vector = [number, number, number];

export const mapWidth = 1000;
export const mapHeight = 510;

// The North Atlantic view shares these bounds with the bundled coastline paths.
const west = -100;
const east = 33;
const south = 20;
const north = 69;
const radians = Math.PI / 180;

export function project({ longitude, latitude }: Coordinates) {
  return {
    x: ((longitude - west) / (east - west)) * mapWidth,
    y: ((north - latitude) / (north - south)) * mapHeight,
  };
}

// GeoNames place records 3182351 and 4930956, respectively.
export const cities = [
  { name: 'Bari', region: 'Italy', longitude: 16.86982, latitude: 41.12066 },
  { name: 'Boston', region: 'Massachusetts', longitude: -71.05977, latitude: 42.35843 },
] as const;

function toUnitVector({ longitude, latitude }: Coordinates): Vector {
  const theta = longitude * radians;
  const phi = latitude * radians;
  return [Math.cos(phi) * Math.cos(theta), Math.cos(phi) * Math.sin(theta), Math.sin(phi)];
}

function greatCircle(from: Coordinates, to: Coordinates) {
  const start = toUnitVector(from);
  const end = toUnitVector(to);
  const angle = Math.acos(start.reduce((product, value, index) => product + value * end[index], 0));
  const divisor = Math.sin(angle);

  return Array.from({ length: 81 }, (_, index) => {
    const progress = index / 80;
    const a = Math.sin((1 - progress) * angle) / divisor;
    const b = Math.sin(progress * angle) / divisor;
    const [x, y, z] = start.map((value, axis) => a * value + b * end[axis]);
    const point = project({
      longitude: Math.atan2(y, x) / radians,
      latitude: Math.atan2(z, Math.hypot(x, y)) / radians,
    });
    return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join('');
}

export const routePath = greatCircle(cities[0], cities[1]);

export const meridians = [-90, -75, -60, -45, -30, -15, 0, 15, 30].map((longitude) =>
  project({ longitude, latitude: 0 }).x,
);
export const parallels = [25, 35, 45, 55, 65].map((latitude) =>
  project({ longitude: 0, latitude }).y,
);
