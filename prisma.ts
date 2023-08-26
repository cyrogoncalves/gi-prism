// @ts-ignore
import {rgb24} from "https://deno.land/std@0.190.0/fmt/colors.ts";

type PrismaUnit = {
  hp: number,
  data: UnitData,
  equips?: Equip[],
  skills: Skill[],
  auras: { [name in string]: any }
}
type UnitData = {
  vitality: number,
  name: string,
  skills: Skill[],
  auras?: { [name in string]: any },
  on?: Triggers
}
type Skill = {
  type?: "normal" | "elemental" | "burst"
  desc?: string
  hits: {
    dice: number[],
    element?: Element
  }[]
}
type Equip = {
  desc?: string, name?: string,
  skills?: Skill[],
  on?: { atk?: (dice: number[]) => number },
}
const elements = ["風", "炎", "水", "岩", "氷", "電", "草"] as const
type Element = typeof elements[number];

const triggers = ["start", "hit", "defeated"] as const
type Trigger = typeof triggers[number];
type Triggers = { [t in Trigger]: (any: any) => any }

const hilichurlData: UnitData = {
  vitality: 10,
  name: "Hilixú",
  skills: [{type: "normal", hits:[{dice: [10]}]}]
}
const hydroSlimeData: UnitData = {
  vitality: 8,
  name: "Geleco Hydro",
  skills: [{type: "normal", desc: "1d8水", hits:[{dice: [8], element:"水"}]}],
  on: { start: _=>{ auras["水"] = true } }
}
const lumineAnemo: UnitData = {
  vitality: 10, name:"Lumine", skills: [{
    type: "elemental",
    desc: "e:3*1d6風",
    hits: [{dice: [6], element:"風"}, {dice: [6]}, {dice: [6]}]
  }]
}
const amber: UnitData = {
  vitality: 10, name:"Amber", skills: [{
    type: "elemental",
    desc: "summon(dur4, vit2, taunt, on-defeat:3d10炎)",
    summon: {
      name: "Baron Bunny", vitality:4, auras:["taunt"], duration:4,
      on: {
        defeated: kombat => attack(this, kombat.enemies, {
          hits: [{ dice: [10, 10, 10], element: "炎" }]
        })
      }
    }
  },{
    type: "burst", /*cost:60,*/ hits: [{dice: [10]}, {dice: [10]}, {dice: [10]}]
  }]
}
const barbara: UnitData = {
  vitality: 10, name:"Barbara", skills: [], auras: { infusion:"水" }
}
const dullbladeData: Equip = { skills: [{ desc:"1d10", hits: [{ dice: [10] }]}] }
// const huntersBowData: Equip = { skills: [{ desc:"1d8", hits:[{dice:[8]}]}] }
const pyroHuntersBowData: Equip = { skills: [{ desc:"1d8炎", hits:[{dice:[8], element:"炎"}]}] }
const apprenticesNotesData: Equip = { skills: [{ desc:"1d8素", hits:[{dice:[8]}]}] }

const createUnit = (data: UnitData, equips: any[] = []): PrismaUnit => ({
  hp: data.vitality,
  data,
  equips,
  auras: { ...data.auras },
  get skills() { return [...data.skills, ...equips.flatMap(e=>e.skills)] }
})

type Artifact = Equip & {
  piece: string,
  set: string,
  flavor: string
}

// 生の花 死の羽 時の砂 空の杯 理の冠
const gladiatorsFinaleSands: Artifact = {
  desc: "atk+1d6",
  name: "Gladiator's Longing",
  piece: "Sands of Eon",
  set: "Gladiator's Finale",
  on: { atk: (dice: number[]) => dice.push(6) },
  flavor: "A timepiece that recorded the gladiator's days in the bloodstained Colosseum. To him, it counted down the days on his long road to freedom."
}

// type Attack = { damage: number, rolls: { roll:number, die:number }[] }
const roll = (die: number) => ({die, roll:Math.floor(Math.random() * die) + 1})

const x = (times:number, die:number): number[] => Array(times).fill(die)

const attack = (source: PrismaUnit, target: PrismaUnit, skill: Skill) => {
  for (let hit of skill.hits) {
    const dice = [...hit.dice]
    source.equips.forEach(e=>e.on?.atk?.(dice))
    const element = hit.element ?? source.auras["infusion"]
    if (element) target.auras[element] = true // TODO reaction power instead of 'true'

    if (target.auras["水"] && target.auras["炎"]) { // vaporize
      delete target.auras["炎"]
      delete target.auras["水"]
      dice.push(...x(dice.length + (source.auras["vaporizeBonus"] ?? 0), 4))
    }

    const rolls = dice.map(roll)
    const damage = rolls.reduce((a,b)=> a+b.roll, 0)
    console.log(`${target.data.name} tomou ${damage} de dano [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
    target.hp -= damage

    if (target.auras["風"] && target.auras["炎"]) { // pyro swirl
      const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
      const damage = rolls.reduce((a,b)=> a+b.roll, 0)
      console.log(`  mais ${damage} de redemoinho pyro [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
      target.hp -= damage
      delete target.auras["炎"]
      delete target.auras["風"]
      kombat.enemies.filter(e=>e!==target).forEach(e=> { // e.auras["swirled炎"] = true
        const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
        e.auras["炎"] = true
        const damage = rolls.reduce((a,b)=> a+b.roll, 0)
        console.log(`  ${e.data.name} tomou ${damage} de redemoinho pyro [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
        e.hp -= damage
      })
    }
  }
}

const atkCommands = { e: "elemental", b: "burst", n: "normal" }

const statusStr = (u: PrismaUnit) => `${u.data.name}[${u.hp}/${u.data.vitality}]${Object.keys(u.auras).filter(a=>elements.includes(a as Element))}`

const kombat = {
  enemies: [...Array(3)].map(_=>createUnit(hilichurlData)),
  team: [
    createUnit(lumineAnemo, [dullbladeData, gladiatorsFinaleSands]),
    createUnit(amber, [pyroHuntersBowData]),
    createUnit(barbara, [apprenticesNotesData]),
  ],
  cur: 0
}
console.log("Você achou 3 Hilixús!")

while (kombat.enemies.length > 0) {
  console.log(`${kombat.team.map(statusStr).join(" ")}   ${kombat.enemies.map(statusStr).join(" ")}`
    .replace("炎", rgb24("炎", 0xef7a35)))
  const command = prompt("O que você vai fazer?", "normal")

  const charIdx = kombat.team.findIndex(c=>c.data.name===command)
  if (charIdx !== -1) {
    kombat.cur = charIdx
    continue
  }

  console.log("\x1B[2J\x1B[0;0H")

  const source = kombat.team[kombat.cur]
  const target = kombat.enemies[0]
  const atkName = atkCommands[command] ?? command
  const skill = source.skills.find(s => (s.type ?? "normal") === atkName)
  attack(source, target, skill)
  if (target.hp < 1) {
    console.log(`O ${target.data.name} caiu!`)
    kombat.enemies.shift()
  } else {
    attack(target, source, target.skills[0])
  }
}

// deno run prisma.ts