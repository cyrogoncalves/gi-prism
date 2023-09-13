export type PrismaUnit = {
  hp: number,
  data: UnitData,
  equips?: Equip[],
  skills: Skill[],
  auras: object,
  on?: Triggers
}
export type UnitData = {
  vitality: number,
  name: string,
  element?: Element,
  skills?: Skill[],
  auras?: { [name in string]: any },
  // on?: Triggers
}
export type Summon = UnitData & {
  duration: number
  on?: Triggers
}
export type Aura = {
  duration?: number
  stacks?: number
  target?: Target
  on?: Triggers
}
export type Skill = {
  type: "normal" | "elemental" | "burst"
  desc?: string
  cooldown?: number
  hits?: {
    dice?: number[],
    element?: Element,
    $dice?: (k: Kombat)=>number[]
  }[],
  summon?: Summon,
  aura?: Aura,
  heal?: {
    target: Target,
    value?: number,
    $value?: (k: Kombat) => number
  },
  target?: Target
}
export type Equip = {
  desc?: string,
  name?: string,
  skills?: Skill[],
  on?: Triggers
}
export const elements = ["炎", "水", "氷", "電", "風", "岩", "草"] as const
export type Element = typeof elements[number];

const triggers = ["start", "atk", "hit", "defeated", "roll", "equip", "change"] as const
type Trigger = typeof triggers[number];
export type Triggers = { [t in Trigger]?: any }

export const pieces = ["生の花", "死の羽", "時の砂", "空の杯", "理の冠"]
export type ArtifactPiece = typeof pieces[number];

export type Artifact = Equip & {
  slots: number,
  piece: ArtifactPiece,
  set: string,
  // flavor: string
}

export type Team = {
  units: PrismaUnit[],
  auras: object,
  curIdx: number,
  cur: PrismaUnit
}

export type Kombat = {
  team: Team,
  enemies: Team,
  summons: PrismaUnit[],
  cur: PrismaUnit,
  log: string,
}

// type Attack = { damage: number, rolls: { roll:number, die:number }[] }
export type Target = "self" | "team" | "enemy" | "all" | "allies";