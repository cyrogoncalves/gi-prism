// @ts-ignore
import {bold, gray, rgb24} from "https://deno.land/std@0.190.0/fmt/colors.ts";
// @ts-ignore
import { readKeypress } from "https://deno.land/x/keypress@0.0.11/mod.ts";
// @ts-ignore
import {Artifact, ArtifactPiece, Element, elements, Kombat, pieces, PrismaUnit, Skill, Team, UnitData} from "./model.ts";
// @ts-ignore
import {
  amber,
  apprenticesNotes,
  barbara,
  dullblade,
  hilichurl,
  kaeya,
  lumineAnemo,
  mainStats,
  pyroHuntersBow,
  sets
} from "./data.ts";
// @ts-ignore
import * as txt from "./artifacts.en.map.json" assert { type: "json" };

const createUnit = (data: UnitData, equips: any[] = []): PrismaUnit => ({
  hp: data.vitality,
  data,
  equips,
  auras: { ...data.auras },
  on: { ...data.on },
  get skills() { return [...data.skills, ...equips.flatMap(e=>e.skills)] }
})

const roll = (die: number) => ({die, roll:Math.floor(Math.random() * die) + 1})

const x = (times:number, die:number): number[] => Array(times).fill(die)

const rng = <T>(a:T[]): T => a[Math.floor(Math.random() * a.length)]

const createRandomArtifact = (): Artifact => {
  const set = rng(Object.values(sets))
  const piece: ArtifactPiece = rng(pieces)
  const mainStat: { desc: string, slots:number, on:any} = rng(mainStats[piece])
  return {
    ...mainStat, set: set.name, piece
  }
}

const getTargets = {
  enemy: (kombat: Kombat) => [kombat.enemies.units[0]],
  all: (kombat: Kombat) => kombat.enemies.units,
  self: (kombat: Kombat) => [kombat.team.cur],
  // team: (kombat: Kombat) => [kombat.team],
  allies: (kombat: Kombat) => kombat.team.units,
}

const useSkill = (kombat: Kombat, atkName: string) => {
  const source = kombat.cur
  const skill = source.skills.find(s => (s.type ?? "normal") === atkName)
  if (source.auras[`cooldown-${skill.type}`]?.duration > 0) {
    kombat.log = "Habilidade em cooldown"
    return
  }

  const targets = getTargets[skill.target ?? "enemy"](kombat)
  console.debug({targets})
  attack(source, targets, skill, kombat)
  const activeEnemy = kombat.enemies.units[0];
  if (activeEnemy.hp > 0) {
    const retaliateTarget = [...kombat.summons, ...kombat.team.units]
      .find(u => u.auras["taunt"]) ?? source
    attack(activeEnemy, [retaliateTarget], activeEnemy.skills[0], kombat)

    if (retaliateTarget.hp < 1 && retaliateTarget.on?.defeated) {
      console.log(`O ${retaliateTarget.data.name} fez uma coisa quando caiu...`)
      const targets = getTargets[skill.target ?? "enemy"](kombat)
      attack(retaliateTarget, targets, retaliateTarget.on.defeated, kombat)
    }
  }

  kombat.log += kombat.enemies.units.filter(e=>e.hp <= 0)
    .map(e=>`\nO ${e.data.name} caiu!`).join("")
  kombat.enemies.units = kombat.enemies.units.filter(e=>e.hp > 0)

  kombat.log += kombat.summons.filter(e=>e.hp <= 0)
    .map(e=>`\nO ${e.data.name} caiu!`).join("")
  kombat.summons = kombat.summons.filter(e=>e.hp > 0)

  if (kombat.enemies.units.length === 0) {
    const loot = createRandomArtifact()
    // console.log("\x1B[2J\x1B[0;0H")
    console.log("Você completou a câmara e encontrou um prêmio")
    console.log(`"${txt[loot.set]?.[loot.piece].flavor}"`)
    confirm("Seguir para a próxima câmara?")
    kombat = kombatFor(team, chamberEnemies[floorId++])
  }
}

const damageDisplay = (roll: {die: number, roll:number}, element: Element) => ({
"4":"▲", 6:"◼", 8:"◆", 10:"◈",20:"⯃"

})

const attack = (source: PrismaUnit, targets: PrismaUnit[], skill: Skill, kombat: Kombat) => {
  const target = targets[0]
  const logs = []
  for (let hit of skill.hits ?? []) {
    const dice = hit.dice
      .concat(...source.equips.flatMap(e=>e.on?.atk?.bonus ?? []))

    const element = hit.element ?? source.auras["infusion"]
    if (element) target.auras[element] = true // TODO reaction power instead of 'true'

    if (target.auras["水"] && target.auras["炎"]) { // vaporize
      delete target.auras["炎"]
      delete target.auras["水"]
      dice.push(...x(dice.length + (source.auras["vaporizeBonus"] ?? 0), 4))
    }

    const rolls = dice.map(roll)
    const damage = rolls.reduce((a,b)=> a+b.roll, 0)
    logs.push(`${target.data.name} tomou ${damage} de dano ${element ?? ""} [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
    target.hp -= damage

    if (target.auras["風"] && target.auras["炎"]) {
      const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
      const damage = rolls.reduce((a,b)=> a+b.roll, 0)
      logs.push(`  mais ${damage} de redemoinho pyro [${rolls.map(r => `d${r.die}(${r.roll})`)}]`)
      target.hp -= damage
      delete target.auras["炎"]
      delete target.auras["風"]
      kombat.enemies.units.filter(e=>e!==target).forEach(e=> { // e.auras["swirled炎"] = true
        const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
        e.auras["炎"] = true
        const damage = rolls.reduce((a,b)=> a+b.roll, 0)
        logs.push(`  ${e.data.name} tomou ${damage} de redemoinho pyro [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
        e.hp -= damage
      })
    } // pyro swirl
  }

  if (skill.summon) {
    kombat.summons.push(createUnit(skill.summon))
  }

  if (skill.cooldown) {
    source.auras[`cooldown-${skill.type}`] = { duration: skill.cooldown }// TODO charges
  }

  if (skill.heal) {
    const value = skill.heal.value ?? skill.heal.$value(kombat)
    const targetStr = skill.heal.target ?? "self"
    const target = {
      self: [source],
      all: kombat.team
    }[targetStr]
    console.debug({value, targetStr, target})
    target.forEach(c=>c.hp = Math.min(c.hp+value, c.data.vitality))
  }

  if (skill.aura) {
    const targets = skill.aura.target === "team" ? [kombat.team.auras]
      : (getTargets[skill.aura.target ?? "enemy"](kombat)).map(e=>e.auras)
  } // aura

  kombat.log += logs.join("\n")
}

const teamFor = (units: PrismaUnit[]): Team => ({
  units, curIdx: 0, auras: {},
  get cur() { return this.units[this.curIdx] },
})
const kombatFor = (team: Team, enemies: Team): Kombat => ({
  enemies, team, summons: [],
  log: `Você achou ${enemies.units.length} Hilixús!`,
  get cur() { return this.team.cur },
})

const elementColorMap = {
  "炎": { hex: 0xef7a35, text: "#ef7a35" },
  "水": { hex: 0x1b8cea, text: "#1b8cea" },
  "氷": { hex: 0xa0d7e4, text: "#a0d7e4" },
  "電": { hex: 0xb08fc2, text: "#b08fc2" },
  "風": { hex: 0x75c2aa, text: "#75c2aa" },
  "岩": { hex: 0xcc9f2d, text: "#cc9f2d" },
  "草": { hex: 0xa6c938, text: "#a6c938" }
}
const charColor = (d: UnitData) => d.element
  ? rgb24(d.name, elementColorMap[d.element].hex) : d.name
const hp = (c: PrismaUnit) => "♥".repeat(Math.max(0, c.hp))
  + "♡".repeat(Math.min(c.data.vitality - c.hp, c.data.vitality))
const printStatus = (kombat: Kombat) => {
  console.log("\x1B[2J\x1B[0;0H")
  console.log(kombat.team.units.map((c, i) =>
    i===kombat.team.curIdx ? gray(c.data.name) : charColor(c.data)).join("  "))
  console.log(`${bold(charColor(kombat.cur.data))} ${hp(kombat.cur)} `)
  for (let summon of kombat.summons)
    console.log(` ${charColor(summon.data)} ${hp(summon)} `)
  console.log("")
  for (let enemy of kombat.enemies.units) {
    const elementalAuras = Object.keys(enemy.auras)
      .filter(a=>elements.includes(a as any))
      .map(e=>rgb24(e, elementColorMap[e].hex));
    console.log(`${charColor(enemy.data)}${elementalAuras} ${hp(enemy)} `)
  }
  console.log(kombat.log)
  kombat.log = ""
}

const team: Team = teamFor([
  createUnit(lumineAnemo, [dullblade]),
  createUnit(amber, [pyroHuntersBow]),
  createUnit(barbara, [apprenticesNotes]),
  createUnit(kaeya, []),
])
let floorId = 0
const chamberEnemies = [
  teamFor([...Array(3)].map(_=>createUnit(hilichurl))),
  teamFor([...Array(5)].map(_=>createUnit(hilichurl))),
  teamFor([...Array(8)].map(_=>createUnit(hilichurl))),
]
let kombat: Kombat = kombatFor(team, chamberEnemies[floorId++])
printStatus(kombat)

for await (const keypress of readKeypress()) {
  // console.debug({keypress});
  if (keypress.ctrlKey && keypress.key === 'c') Deno.exit(0);

  if (["1", "2", "3", "4", "5"].slice(0, kombat.team.units.length).includes(keypress.key)) {
    kombat.team.curIdx = Number(keypress.key) - 1
    // trigger on:change
  } else if (["q", "w", "e", "r"].includes(keypress.key)) {
    const atkName = {e: "elemental", r: "burst", q: "normal"}[keypress.key] ?? keypress.key
    useSkill(kombat, atkName)
  }
  printStatus(kombat)
}

// deno run prisma.ts