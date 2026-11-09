/** Web-mercator helpers for OpenStreetMap raster tiles. */

export const OSM_TILE_SIZE = 256;
export const OSM_TILE_URL = 'https://tile.openstreetmap.org';
export const OSM_TILE_HEADERS = {
  Accept: 'image/png',
  'User-Agent': 'Ragly/1.1 (https://ragly.cloud; mobile map)',
};

export type MapLatLng = { latitude: number; longitude: number };
export type MapOrigin = { x: number; y: number };

export type OsmTile = {
  key: string;
  uri: string;
  left: number;
  top: number;
};

function wrapTile(value: number, max: number): number {
  return ((value % max) + max) % max;
}

export function worldPixel(point: MapLatLng, zoom: number): MapOrigin {
  const scale = OSM_TILE_SIZE * 2 ** zoom;
  const x = ((point.longitude + 180) / 360) * scale;
  const sin = Math.sin((point.latitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y: Math.min(scale, Math.max(0, y)) };
}

export function fitPins(
  pins: MapLatLng[],
  width: number,
  height: number,
  padding = 36,
): { zoom: number; origin: MapOrigin } {
  const fallback = { zoom: 12, origin: { x: 0, y: 0 } };
  if (!width || !height || !pins.length) return fallback;

  if (pins.length === 1) {
    const zoom = 15;
    const pixel = worldPixel(pins[0], zoom);
    return {
      zoom,
      origin: { x: pixel.x - width / 2, y: pixel.y - height / 2 },
    };
  }

  for (let zoom = 16; zoom >= 8; zoom -= 1) {
    const pixels = pins.map((pin) => worldPixel(pin, zoom));
    const minX = Math.min(...pixels.map((pixel) => pixel.x));
    const maxX = Math.max(...pixels.map((pixel) => pixel.x));
    const minY = Math.min(...pixels.map((pixel) => pixel.y));
    const maxY = Math.max(...pixels.map((pixel) => pixel.y));
    if (maxX - minX + padding * 2 > width) continue;
    if (maxY - minY + padding * 2 > height) continue;
    return {
      zoom,
      origin: {
        x: (minX + maxX) / 2 - width / 2,
        y: (minY + maxY) / 2 - height / 2,
      },
    };
  }

  const zoom = 8;
  const pixels = pins.map((pin) => worldPixel(pin, zoom));
  const minX = Math.min(...pixels.map((pixel) => pixel.x));
  const maxX = Math.max(...pixels.map((pixel) => pixel.x));
  const minY = Math.min(...pixels.map((pixel) => pixel.y));
  const maxY = Math.max(...pixels.map((pixel) => pixel.y));
  return {
    zoom,
    origin: {
      x: (minX + maxX) / 2 - width / 2,
      y: (minY + maxY) / 2 - height / 2,
    },
  };
}

export function tilesForView(
  origin: MapOrigin,
  width: number,
  height: number,
  zoom: number,
  extra = 1,
): OsmTile[] {
  if (!width || !height) return [];
  const max = 2 ** zoom;
  const x0 = Math.floor(origin.x / OSM_TILE_SIZE) - extra;
  const y0 = Math.floor(origin.y / OSM_TILE_SIZE) - extra;
  const x1 = Math.floor((origin.x + width) / OSM_TILE_SIZE) + extra;
  const y1 = Math.floor((origin.y + height) / OSM_TILE_SIZE) + extra;
  const tiles: OsmTile[] = [];
  for (let x = x0; x <= x1; x += 1) {
    for (let y = y0; y <= y1; y += 1) {
      if (y < 0 || y >= max) continue;
      const tx = wrapTile(x, max);
      tiles.push({
        key: `${zoom}/${tx}/${y}`,
        uri: `${OSM_TILE_URL}/${zoom}/${tx}/${y}.png`,
        left: x * OSM_TILE_SIZE - origin.x,
        top: y * OSM_TILE_SIZE - origin.y,
      });
    }
  }
  return tiles;
}
