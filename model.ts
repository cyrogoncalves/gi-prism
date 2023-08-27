export type PrismaUnit = {
  hp: number,
  data: UnitData,
  equips?: Equip[],
  skills: Skill[],
  auras: { [name in string]: any },
  on?: Triggers
}
export type UnitData = {
  vitality: number,
  name: string,
  skills?: Skill[],
  auras?: { [name in string]: any },
  on?: Triggers
}
export type Summon = UnitData & {
  duration: number
}
export type Skill = {
  type: "normal" | "elemental" | "burst"
  desc?: string
  cooldown?: number
  hits?: {
    dice: number[],
    element?: Element
  }[],
  summon?: Summon
}
export type Equip = {
  desc?: string, name?: string,
  skills?: Skill[],
  on?: Triggers
}
export const elements = ["風", "炎", "水", "岩", "氷", "電", "草"] as const
export type Element = typeof elements[number];

const triggers = ["start", "atk", "hit", "defeated"] as const
type Trigger = typeof triggers[number];
export type Triggers = { [t in Trigger]?: any }

export type Artifact = Equip & {
  piece: string,
  set: string,
  flavor: string
}

export type Kombat = {
  team: PrismaUnit[], enemies: PrismaUnit[], cur: number, summons: PrismaUnit[]
}

// type Attack = { damage: number, rolls: { roll:number, die:number }[] }