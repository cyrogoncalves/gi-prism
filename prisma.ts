import {rgb24} from "https://deno.land/std@0.190.0/fmt/colors.ts";
import {elements, Kombat, PrismaUnit, Skill, UnitData} from "./model.ts";
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
  on: { ...data.on },
  get skills() { return [...data.skills, ...equips.flatMap(e=>e.skills)] }
})

const roll = (die: number) => ({die, roll:Math.floor(Math.random() * die) + 1})

const x = (times:number, die:number): number[] => Array(times).fill(die)

const attack = (source: PrismaUnit, target: PrismaUnit, skill: Skill, kombat: Kombat) => {
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
    console.log(`${target.data.name} tomou ${damage} de dano ${element ?? ""} [${(rolls.map(r => `d${r.die}(${r.roll})`))}]`)
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

  if (skill.summon) {
    kombat.summons.push(createUnit(skill.summon))
  }

  if (skill.cooldown) {
    source.auras[`cooldown-${skill.type}`] = { duration: skill.cooldown }// TODO charges
  }
}

const atkCommands = { e: "elemental", b: "burst", n: "normal" }

const statusStr = (u: PrismaUnit) =>
  `${u.data.name}[${u.hp}/${u.data.vitality}]${Object.keys(u.auras)
    .filter(a=>elements.includes(a as any))}`

const team = [
  createUnit(lumineAnemo, [dullblade, gladiatorsFinaleSands]),
  createUnit(amber, [pyroHuntersBow]),
  createUnit(barbara, [apprenticesNotes]),
];
const chamberEnemies = [
  [...Array(3)].map(_=>createUnit(hilichurl)),
  [...Array(5)].map(_=>createUnit(hilichurl)),
  [...Array(8)].map(_=>createUnit(hilichurl)),
]

for (let enemies of chamberEnemies) {
  const kombat: Kombat = {enemies, team, cur: 0, summons: []}
  console.log(`Você achou ${kombat.enemies.length} Hilixús!`)

  do {
    console.log([kombat.team, kombat.summons, kombat.enemies]
      .map(t=>t.map(statusStr)).join("   ")
      .replace("炎", rgb24("炎", 0xef7a35)))
    const command = prompt("O que você vai fazer?", "normal")
    console.log("\x1B[2J\x1B[0;0H")

    const charIdx = kombat.team.findIndex(c=>c.data.name===command)
    if (charIdx !== -1) {
      kombat.cur = charIdx
      continue
    }

    const source = kombat.team[kombat.cur]
    const atkName = atkCommands[command] ?? command
    const skill = source.skills.find(s => (s.type ?? "normal") === atkName)
    if (source.auras[`cooldown-${skill.type}`]?.duration > 0) {
      console.log("Habilidade em cooldown")
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

    kombat.enemies.filter(e=>e.hp <= 0)
      .forEach(e=>console.log(`O ${e.data.name} caiu!`))
    kombat.enemies = kombat.enemies.filter(e=>e.hp > 0)

    kombat.summons.filter(e=>e.hp <= 0)
      .forEach(e=>console.log(`O ${e.data.name} caiu!`))
    kombat.summons = kombat.summons.filter(e=>e.hp > 0)
  } while (kombat.enemies.length > 0)
}
console.log("Parabéns, você chegou ao fim do abismo")

// deno run prisma.ts