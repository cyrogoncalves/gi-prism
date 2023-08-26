import {rgb24} from "https://deno.land/std@0.190.0/fmt/colors.ts";
import {elements, PrismaUnit, Skill, UnitData} from "./model.ts";
import {
  amber,
  apprenticesNotes,
  barbara,
  dullblade,
  gladiatorsFinaleSands,
  hilichurl,
  lumineAnemo,
  pyroHuntersBow
} from "./data.ts";

const createUnit = (data: UnitData, equips: any[] = []): PrismaUnit => ({
  hp: data.vitality,
  data,
  equips,
  auras: { ...data.auras },
  get skills() { return [...data.skills, ...equips.flatMap(e=>e.skills)] }
})

// type Attack = { damage: number, rolls: { roll:number, die:number }[] }
const roll = (die: number) => ({die, roll:Math.floor(Math.random() * die) + 1})

const x = (times:number, die:number): number[] => Array(times).fill(die)

const attack = (source: PrismaUnit, target: PrismaUnit, skill: Skill) => {
  for (let hit of skill.hits) {
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
    console.log(`${target.data.name} tomou ${damage} de dano [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
    target.hp -= damage

    if (target.auras["風"] && target.auras["炎"]) { // pyro swirl
      const rolls = x(source.auras["swirlBonus"] ?? 1, 4).map(roll)
      const damage = rolls.reduce((a,b)=> a+b.roll, 0)
      console.log(`  mais ${damage} de redemoinho pyro [${rolls.map(r => `d${r.die}(${r.roll})`)}]`)
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
  enemies: [...Array(3)].map(_=>createUnit(hilichurl)),
  team: [
    createUnit(lumineAnemo, [dullblade, gladiatorsFinaleSands]),
    createUnit(amber, [pyroHuntersBow]),
    createUnit(barbara, [apprenticesNotes]),
  ],
  cur: 0,
  summons: []
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