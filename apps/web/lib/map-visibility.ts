export interface MapWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Point {
  x: number;
  y: number;
}

export interface MapRevealArea {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export type CoverLevel = "clear" | "half" | "three-quarters" | "blocked";

const EPSILON = 0.0001;

function clampPercent(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function parseMapWalls(value: unknown) {
  const source = asRecord(value);
  if (!source || !Array.isArray(source.walls)) return [] as MapWall[];

  return source.walls
    .map((entry) => {
      const wall = asRecord(entry);
      if (!wall) return null;
      return {
        id: String(wall.id || crypto.randomUUID()),
        x1: clampPercent(Number(wall.x1 ?? 0) || 0),
        y1: clampPercent(Number(wall.y1 ?? 0) || 0),
        x2: clampPercent(Number(wall.x2 ?? 100) || 100),
        y2: clampPercent(Number(wall.y2 ?? 100) || 100),
      } satisfies MapWall;
    })
    .filter((entry): entry is MapWall => Boolean(entry))
    .filter((entry) => Math.hypot(entry.x2 - entry.x1, entry.y2 - entry.y1) > 0.2);
}

export function parseMapRevealAreas(value: unknown) {
  const source = asRecord(value);
  if (!source || !Array.isArray(source.revealedAreas)) return [] as MapRevealArea[];

  return source.revealedAreas
    .map((entry) => {
      const area = asRecord(entry);
      if (!area) return null;
      return {
        id: String(area.id || crypto.randomUUID()),
        x: clampPercent(Number(area.x ?? 50) || 50),
        y: clampPercent(Number(area.y ?? 50) || 50),
        radius: Math.max(4, Math.min(40, Number(area.radius ?? 16) || 16)),
      } satisfies MapRevealArea;
    })
    .filter((entry): entry is MapRevealArea => Boolean(entry));
}

function buildBoundaryWalls(): MapWall[] {
  return [
    { id: "boundary-top", x1: 0, y1: 0, x2: 100, y2: 0 },
    { id: "boundary-right", x1: 100, y1: 0, x2: 100, y2: 100 },
    { id: "boundary-bottom", x1: 100, y1: 100, x2: 0, y2: 100 },
    { id: "boundary-left", x1: 0, y1: 100, x2: 0, y2: 0 },
  ];
}

function intersectRayWithSegment(origin: Point, angle: number, wall: MapWall, maxDistance: number) {
  const rayDx = Math.cos(angle);
  const rayDy = Math.sin(angle);
  const segDx = wall.x2 - wall.x1;
  const segDy = wall.y2 - wall.y1;
  const denom = rayDx * segDy - rayDy * segDx;

  if (Math.abs(denom) < 1e-9) return null;

  const diffX = wall.x1 - origin.x;
  const diffY = wall.y1 - origin.y;
  const t = (diffX * segDy - diffY * segDx) / denom;
  const u = (diffX * rayDy - diffY * rayDx) / denom;

  if (t < 0 || t > maxDistance || u < 0 || u > 1) {
    return null;
  }

  return {
    x: origin.x + rayDx * t,
    y: origin.y + rayDy * t,
    distance: t,
  };
}

function ccw(a: Point, b: Point, c: Point) {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

export function computeVisibilityPolygon(origin: Point, radius: number, walls: MapWall[]) {
  const maxDistance = Math.max(1, radius);
  const allWalls = [...walls, ...buildBoundaryWalls()];
  const angles = new Set<number>();

  for (const wall of allWalls) {
    for (const point of [
      { x: wall.x1, y: wall.y1 },
      { x: wall.x2, y: wall.y2 },
    ]) {
      const angle = Math.atan2(point.y - origin.y, point.x - origin.x);
      angles.add(angle - EPSILON);
      angles.add(angle);
      angles.add(angle + EPSILON);
    }
  }

  const points = [...angles]
    .map((angle) => {
      let closest = {
        x: origin.x + Math.cos(angle) * maxDistance,
        y: origin.y + Math.sin(angle) * maxDistance,
        distance: maxDistance,
      };

      for (const wall of allWalls) {
        const hit = intersectRayWithSegment(origin, angle, wall, maxDistance);
        if (hit && hit.distance < closest.distance) {
          closest = hit;
        }
      }

      return {
        x: clampPercent(closest.x),
        y: clampPercent(closest.y),
        angle,
      };
    })
    .sort((a, b) => a.angle - b.angle);

  const deduped: Point[] = [];
  for (const point of points) {
    const previous = deduped[deduped.length - 1];
    if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) > 0.15) {
      deduped.push({ x: point.x, y: point.y });
    }
  }

  return deduped;
}

export function toSvgPolygon(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function getCoverBetween(origin: Point, target: Point, walls: MapWall[]): CoverLevel {
  const intersections = walls.filter((wall) =>
    segmentsIntersect(origin, target, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 })
  ).length;

  if (intersections >= 3) return "blocked";
  if (intersections >= 2) return "three-quarters";
  if (intersections >= 1) return "half";
  return "clear";
}
