import { resolveImport, type SourceFiles } from "./sourceIndex";

export type GraphNode = {
  group: string;
  id: string;
  importedBy: string[];
  imports: string[];
};

const IMPORT_SPECIFIER = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

export function getGroup(path: string) {
  const segments = path.split("/");

  if (segments[0] !== "src" || segments.length === 2) {
    return "core";
  }

  if ((segments[1] === "apps" || segments[1] === "components") && segments.length > 3) {
    return segments[2];
  }

  return segments[1];
}

export function buildImportGraph(files: SourceFiles) {
  const nodes = new Map<string, GraphNode>();
  const paths = Object.keys(files).filter((path) => path.startsWith("src/") && !path.endsWith(".d.ts"));

  paths.forEach((path) => nodes.set(path, { group: getGroup(path), id: path, importedBy: [], imports: [] }));

  paths.forEach((path) => {
    for (const match of files[path].matchAll(IMPORT_SPECIFIER)) {
      const target = resolveImport(path, match[1] ?? match[2] ?? match[3], files);
      const node = nodes.get(path)!;

      if (target && target !== path && nodes.has(target) && !node.imports.includes(target)) {
        node.imports.push(target);
        nodes.get(target)!.importedBy.push(path);
      }
    }
  });

  return [...nodes.values()];
}

export type Point = { x: number; y: number };

const MAX_SPEED = 12;

// A small deterministic force layout: same graph, same picture, no randomness between visits.
export function createLayout(nodes: GraphNode[]) {
  const groups = [...new Set(nodes.map((node) => node.group))].sort();
  const positions = new Map<string, Point>();
  const velocities = new Map<string, Point>();

  nodes.forEach((node, index) => {
    const groupAngle = (groups.indexOf(node.group) / groups.length) * Math.PI * 2;
    const jitter = (index * 2.399) % (Math.PI * 2);
    positions.set(node.id, {
      x: Math.cos(groupAngle) * 220 + Math.cos(jitter) * 40,
      y: Math.sin(groupAngle) * 220 + Math.sin(jitter) * 40,
    });
    velocities.set(node.id, { x: 0, y: 0 });
  });

  const step = () => {
    const forces = new Map(nodes.map((node) => [node.id, { x: 0, y: 0 }]));
    const groupCenters = new Map<string, Point & { count: number }>();

    nodes.forEach((node) => {
      const position = positions.get(node.id)!;
      const center = groupCenters.get(node.group) ?? { count: 0, x: 0, y: 0 };
      groupCenters.set(node.group, { count: center.count + 1, x: center.x + position.x, y: center.y + position.y });
    });

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = positions.get(nodes[left].id)!;
        const b = positions.get(nodes[right].id)!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.max(Math.hypot(dx, dy), 5);
        // Inverse-square repulsion keeps neighbours apart without pushing distant clusters off-screen.
        const strength = 1800 / (distance * distance * distance);
        const forceA = forces.get(nodes[left].id)!;
        const forceB = forces.get(nodes[right].id)!;
        forceA.x += dx * strength;
        forceA.y += dy * strength;
        forceB.x -= dx * strength;
        forceB.y -= dy * strength;
      }
    }

    nodes.forEach((node) => {
      const position = positions.get(node.id)!;
      const force = forces.get(node.id)!;

      node.imports.forEach((target) => {
        const other = positions.get(target)!;
        const dx = other.x - position.x;
        const dy = other.y - position.y;
        const distance = Math.hypot(dx, dy) || 1;
        const pull = (distance - 90) * 0.02;
        const targetForce = forces.get(target)!;
        force.x += (dx / distance) * pull;
        force.y += (dy / distance) * pull;
        targetForce.x -= (dx / distance) * pull;
        targetForce.y -= (dy / distance) * pull;
      });

      const center = groupCenters.get(node.group)!;
      force.x += (center.x / center.count - position.x) * 0.03 - position.x * 0.012;
      force.y += (center.y / center.count - position.y) * 0.03 - position.y * 0.012;
    });

    let movement = 0;

    nodes.forEach((node) => {
      const position = positions.get(node.id)!;
      const velocity = velocities.get(node.id)!;
      const force = forces.get(node.id)!;
      velocity.x = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (velocity.x + force.x) * 0.6));
      velocity.y = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (velocity.y + force.y) * 0.6));
      position.x += velocity.x;
      position.y += velocity.y;
      movement += Math.abs(velocity.x) + Math.abs(velocity.y);
    });

    return movement / Math.max(nodes.length, 1);
  };

  return { groups, positions, step };
}
