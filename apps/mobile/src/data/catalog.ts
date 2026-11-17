import type { ExtraRules } from '@windcheck/engine';
import type { SpeedUnit } from '@/format';

export type ActivityId = 'crane' | 'roofing' | 'boating' | 'golf' | 'drone';

export interface ActivityDef {
  id: ActivityId;
  name: string;
  /** Short name for the top-right pill. */
  short: string;
  description: string;
  /** "Clear to <verb> until 2 PM". */
  verb: string;
  unit: SpeedUnit;
  /** Machine or setup name shown under the limits title. */
  machine: string | null;
  /** Label for working height on the limits screen, or null when height does not apply. */
  heightLabel: string | null;
  workStart: number;
  workEnd: number;
  /**
   * Starting values only. The user's own limit always replaces these
   * (PRODUCT.md: per-machine limits entered by the user, not trade defaults).
   */
  defaults: { limitMph: number; heightFt: number; rules: ExtraRules };
}

/** Activities on the "Pick your work" board. Crane and roofing are the proposed launch pair. */
export const ACTIVITIES: ActivityDef[] = [
  {
    id: 'crane',
    name: 'Crane and lifting',
    short: 'Crane',
    description: 'Gusts at boom height against your limit',
    verb: 'lift',
    unit: 'mph',
    machine: 'Knuckle boom',
    heightLabel: 'boom',
    workStart: 7,
    workEnd: 16,
    defaults: { limitMph: 25, heightFt: 60, rules: { lightning: true, rain: false, freezing: false } },
  },
  {
    id: 'roofing',
    name: 'Roofing',
    short: 'Roofing',
    description: 'Gusts, rain and temperature',
    verb: 'work',
    unit: 'mph',
    machine: null,
    heightLabel: 'roof',
    workStart: 7,
    workEnd: 16,
    defaults: { limitMph: 20, heightFt: 30, rules: { lightning: true, rain: true, freezing: true } },
  },
  {
    id: 'boating',
    name: 'Boating',
    short: 'Boating',
    description: 'Wind, direction, waves, marine alerts',
    verb: 'go out',
    unit: 'kn',
    machine: null,
    heightLabel: null,
    workStart: 6,
    workEnd: 18,
    defaults: { limitMph: 23, heightFt: 0, rules: { lightning: true, rain: false, freezing: false } },
  },
  {
    id: 'golf',
    name: 'Golf',
    short: 'Golf',
    description: 'Wind, rain and lightning',
    verb: 'play',
    unit: 'mph',
    machine: null,
    heightLabel: null,
    workStart: 7,
    workEnd: 17,
    defaults: { limitMph: 25, heightFt: 0, rules: { lightning: true, rain: true, freezing: false } },
  },
  {
    id: 'drone',
    name: 'Drone flying',
    short: 'Drone',
    description: 'Gusts aloft and visibility',
    verb: 'fly',
    unit: 'mph',
    machine: null,
    heightLabel: 'flight',
    workStart: 8,
    workEnd: 17,
    defaults: { limitMph: 20, heightFt: 200, rules: { lightning: true, rain: true, freezing: false } },
  },
];

/** Every activity on the onboarding board, including ones without a rule set yet. */
export const ONBOARDING_ACTIVITIES = [
  'Crane and lifting',
  'Roofing',
  'Boating',
  'Golf',
  'Drone flying',
  'Tree work',
  'Painting',
  'Concrete',
  'Fishing',
  'Outdoor events',
] as const;

export function activity(id: ActivityId): ActivityDef {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[0]!;
}
