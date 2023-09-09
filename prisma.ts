// @ts-ignore
import {rgb24, gray} from "https://deno.land/std@0.190.0/fmt/colors.ts";
// @ts-ignore
import { readKeypress } from "https://deno.land/x/keypress@0.0.11/mod.ts";
// @ts-ignore
import {Artifact, ArtifactPiece, elements, Kombat, pieces, PrismaUnit, Skill, UnitData} from "./model.ts";
// @ts-ignore
import {
  amber,
  apprenticesNotes,
  barbara,
  dullblade,
  hilichurl,
  lumineAnemo, mainStats,
  pyroHuntersBow, sets
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

const attack = (source: PrismaUnit, target: PrismaUnit, skill: Skill, kombat: Kombat) => {
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

    if (target.auras["風"] && target.auras["炎"]) { // pyro swirl
      const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
      const damage = rolls.reduce((a,b)=> a+b.roll, 0)
      logs.push(`  mais ${damage} de redemoinho pyro [${rolls.map(r => `d${r.die}(${r.roll})`)}]`)
      target.hp -= damage
      delete target.auras["炎"]
      delete target.auras["風"]
      kombat.enemies.filter(e=>e!==target).forEach(e=> { // e.auras["swirled炎"] = true
        const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
        e.auras["炎"] = true
        const damage = rolls.reduce((a,b)=> a+b.roll, 0)
        logs.push(`  ${e.data.name} tomou ${damage} de redemoinho pyro [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
        e.hp -= damage
      })
    }
  }

  if (skill.summon) {
    kombat.summons.push(createUnit(skill.summon))
  }

  if (skill.cooldown) {
    source.auras[`cooldown-${skill.type}`] = { duration: skill.cooldown }// TODO charges
  }

  kombat.log += logs.join("\n")
}

const atkCommands = { e: "elemental", r: "burst", q: "normal" }

const statusStr = (u: PrismaUnit) =>
  `${u.data.name}[${u.hp}/${u.data.vitality}]${Object.keys(u.auras)
    .filter(a=>elements.includes(a as any))}`

const team = [
  createUnit(lumineAnemo, [dullblade]),
  createUnit(amber, [pyroHuntersBow]),
  createUnit(barbara, [apprenticesNotes]),
];
let floorId = 0
const chamberEnemies = [
  [...Array(3)].map(_=>createUnit(hilichurl)),
  [...Array(5)].map(_=>createUnit(hilichurl)),
  [...Array(8)].map(_=>createUnit(hilichurl)),
]

const printStatus = (kombat: Kombat) => {
  console.log("\x1B[2J\x1B[0;0H")
  console.log([kombat.team, kombat.summons, kombat.enemies]
    .map(t=>t.map(statusStr)).join("   ")
    .replace("炎", rgb24("炎", 0xef7a35)))
  console.log(kombat.log)
  kombat.log = ""
}

const enemies = chamberEnemies[floorId++];
let kombat: Kombat = {enemies, team, cur: 0, summons: [],
  log: `Você achou ${enemies.length} Hilixús!`}
printStatus(kombat)

for await (const keypress of readKeypress()) {
  // console.debug({keypress});
  if (keypress.ctrlKey && keypress.key === 'c') Deno.exit(0);

  if (["1", "2", "3", "4"].includes(keypress.key)) {
    kombat.cur = Number(keypress.key)
    continue
  } else if (["q", "w", "e", "r"].includes(keypress.key)) {
    const source = kombat.team[kombat.cur]
    const atkName = atkCommands[keypress.key] ?? keypress.key
    const skill = source.skills.find(s => (s.type ?? "normal") === atkName)
    if (source.auras[`cooldown-${skill.type}`]?.duration > 0) {
      kombat.log = "Habilidade em cooldown"
      continue
    }

    const target = kombat.enemies[0]
    attack(source, target, skill, kombat)
    if (target.hp > 0) {
      const retaliateTarget = [...kombat.summons, ...kombat.team]
        .find(u => u.auras["taunt"]) ?? source
      attack(target, retaliateTarget, target.skills[0], kombat)

      if (retaliateTarget.hp < 1 && retaliateTarget.on?.defeated) {
        console.log(`O ${retaliateTarget.data.name} fez uma coisa quando caiu...`)
        attack(retaliateTarget, target, retaliateTarget.on.defeated, kombat)
      }
    }

    kombat.log += kombat.enemies.filter(e=>e.hp <= 0)
      .map(e=>`\nO ${e.data.name} caiu!`).join("")
    kombat.enemies = kombat.enemies.filter(e=>e.hp > 0)

    kombat.log += kombat.summons.filter(e=>e.hp <= 0)
      .map(e=>`\nO ${e.data.name} caiu!`).join("")
    kombat.summons = kombat.summons.filter(e=>e.hp > 0)

    if (kombat.enemies.length === 0) {
      const loot = createRandomArtifact()
      // console.log("\x1B[2J\x1B[0;0H")
      console.log("Você completou a câmara e encontrou um prêmio")
      console.log(`"${txt[loot.set]?.[loot.piece].flavor}"`)
      confirm("Seguir para a próxima câmara?")

      const enemies = chamberEnemies[floorId++];
      kombat = {enemies, team, cur: 0, summons: [],
        log: `Você achou ${enemies.length} Hilixús!`}
    }
  }
  printStatus(kombat)
}

// deno run prisma.ts