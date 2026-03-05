/**
 * Custom 2D Physics Engine for Florida Frenzy Platformer
 * All physics calculations are hand-coded - no Phaser Arcade Physics
 */

// AABB collision detection
export function rectIntersect(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

export interface PhysicsBody {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  gravity: number;
  onGround: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Apply gravity and update position for a physics body
 * Returns true if the body is on ground
 */
export function updateBody(
  body: PhysicsBody,
  deltaMs: number,
  platforms: Platform[]
): boolean {
  const dt = deltaMs / 1000; // convert to seconds

  // Apply gravity
  body.vy += body.gravity * dt;

  // Update position
  body.x += body.vx * dt;
  body.y += body.vy * dt;

  // Check platform collisions
  body.onGround = false;

  for (const plat of platforms) {
    const collision = checkPlatformCollision(body, plat);
    if (collision) {
      resolveCollision(body, plat, collision);
    }
  }

  return body.onGround;
}

/**
 * Check which side(s) a body collides with a platform
 */
type CollisionSide = 'top' | 'bottom' | 'left' | 'right';

function checkPlatformCollision(body: PhysicsBody, plat: Platform): CollisionSide[] {
  const sides: CollisionSide[] = [];

  // Check if there's any overlap
  if (!rectIntersect(
    body.x, body.y, body.width, body.height,
    plat.x, plat.y, plat.width, plat.height
  )) {
    return sides;
  }

  // Calculate overlaps on each axis
  const overlapLeft = (body.x + body.width) - plat.x;
  const overlapRight = (plat.x + plat.width) - body.x;
  const overlapTop = (body.y + body.height) - plat.y;
  const overlapBottom = (plat.y + plat.height) - body.y;

  // Find minimum overlap to determine collision side
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  // Determine primary collision side based on velocity and position
  if (minOverlap === overlapTop && body.vy >= 0) {
    sides.push('top');
  } else if (minOverlap === overlapBottom && body.vy < 0) {
    sides.push('bottom');
  } else if (minOverlap === overlapLeft) {
    sides.push('left');
  } else if (minOverlap === overlapRight) {
    sides.push('right');
  }

  return sides;
}

function resolveCollision(body: PhysicsBody, plat: Platform, sides: CollisionSide[]) {
  for (const side of sides) {
    switch (side) {
      case 'top':
        // Landing on top of platform
        body.y = plat.y - body.height;
        body.vy = 0;
        body.onGround = true;
        break;
      case 'bottom':
        // Hitting bottom of platform
        body.y = plat.y + plat.height;
        body.vy = 0;
        break;
      case 'left':
        // Hitting left side of platform
        body.x = plat.x - body.width;
        body.vx = 0;
        break;
      case 'right':
        // Hitting right side of platform
        body.x = plat.x + plat.width;
        body.vx = 0;
        break;
    }
  }
}

/**
 * Check if a point is within world bounds
 */
export function checkWorldBounds(
  body: PhysicsBody,
  worldWidth: number,
  worldHeight: number
): void {
  // Left bound
  if (body.x < 0) {
    body.x = 0;
    body.vx = 0;
  }
  // Right bound
  if (body.x + body.width > worldWidth) {
    body.x = worldWidth - body.width;
    body.vx = 0;
  }
  // Top bound
  if (body.y < 0) {
    body.y = 0;
    body.vy = 0;
  }
  // Bottom bound (death zone)
  // Return onGround = false to signal death
}
