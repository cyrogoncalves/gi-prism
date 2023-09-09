import {Artifact, ArtifactPiece, elements, Equip, pieces, UnitData} from "./model.ts";

export const hilichurl: UnitData = {
  vitality: 10,
  name: "Hilixú",
  skills: [{type: "normal", hits:[{dice: [10]}]}]
}
export const hydroSlime: UnitData = {
  vitality: 8,
  name: "Geleco Hydro",
  skills: [{type: "normal", desc: "1d8水", hits:[{dice: [8], element:"水"}]}],
  on: { start: { aura:"水", target:"self" } }
}

export const lumineAnemo: UnitData = {
  vitality: 10, name:"Lumine", skills: [{
    type: "elemental",
    desc: "e:3*1d6風",
    hits: [{dice: [6], element:"風"}, {dice: [6]}, {dice: [6]}]
  }]
}
export const amber: UnitData = {
  vitality: 10, name:"Amber", skills: [{
    type: "elemental",
    desc: "e[cd5]summon(dur4, vit2, taunt, on-defeated:3d10炎)",
    cooldown: 5,
    summon: {
      name: "Baron Bunny", vitality:8, auras: { "taunt": true }, duration:4,
      on: { defeated: {
          target: "all", hits: [{ dice: [10, 10], element: "炎" }]
      }}
    }
  },{
    type: "burst", /*cost:60,*/ hits: [{dice: [10]}, {dice: [10]}, {dice: [10]}]
  }]
}
export const barbara: UnitData = {
  vitality: 10, name:"Barbara", skills: [{
    desc: "e:aura(cd4, dur4, on:hit:heal-all:1, on:start:heal-self:1)",
    cooldown: 4,
    type: "elemental",
    aura: {
      duration: 4, on: { hit: { heal: { target: "all", value: 1}}, start: { heal: {value: 1}}}
    }
  }, {
    type: "burst", desc: "b:heal-all:[vit]", heal: { target: "all", $value: k=>k.char.data.vitality}
  }], auras: { infusion:"水" }
}
export const dullblade: Equip = { skills: [{ desc:"1d10", type: "normal", hits: [{ dice: [10] }]}] }
// const huntersBow: Equip = { skills: [{ desc:"1d8", hits:[{dice:[8]}]}] }
export const pyroHuntersBow: Equip = { skills: [{ desc:"1d8炎", type: "normal", hits:[{dice:[8], element:"炎"}]}] }
export const apprenticesNotes: Equip = { skills: [{ desc:"1d8素", type: "normal", hits:[{dice:[8]}]}] }

export const sets = {
  0x01: { name: "Adventurer", bonus: "" },
  0x02: { name: "Lucky Dog", bonus: "" },
  0x03: { name: "Traveling Doctor", bonus: "" },
  0x04: { name: "Resolution of Sojourner", bonus: "" },
  0x05: { name: "Tiny Miracle", bonus: "" },
  0x06: { name: "Berserker", bonus: "" },
  0x07: { name: "Instructor", bonus: "" },
  0x08: { name: "The Exile", bonus: "" },
  0x09: { name: "Defender's Will", bonus: "" },
  0x0a: { name: "Brave Heart", bonus: "" },
  0x0b: { name: "Martial Artist", bonus: "" },
  0x0c: { name: "Gambler", bonus: "" },
  0x0d: { name: "Scholar", bonus: "" },
  0x0e: { name: "Prayers", bonus: "" },
  0x10: { name: "Gladiator's Finale", bonus: "meleeWeapon+2d6" },
  0x11: { name: "Wanderer's Troupe", bonus: "ranged+2d6" },
  0x12: { name: "Noblesse Oblige", bonus: "on-burst:all.+1d6 dur8" },
  0x13: { name: "Bloodstained Chivalry", bonus: "on-slay:physical+2d10" },
  0x14: { name: "Maiden Beloved", bonus: "all.healing+2" },
  0x15: { name: "Viridescent Venerer", bonus: "on-swirl:swirledElement+6[6] dur4 (*or +1 per die)" },
  0x16: { name: "Archaic Petra", bonus: "on-[e]-cristalize-pick:[e]+2d8" },
  0x17: { name: "Retracing Bolide", bonus: "while-shielded:wpnAtk+3d6" },
  0x18: { name: "Thundersoother", bonus: "on-electro-aura-hit:e+5d4" },
  0x19: { name: "Thundering Fury", bonus: "electro-reaction+2, skill-(1 to 2)-roll:3" },
  0x1a: { name: "Lavawalker", bonus: "on-pyro-aura-hit:e+5d4" },
  0x1b: { name: "Crimson Witch of Flames", bonus: "pyro-transf-reaction+2, pyro+1d6[dur4][max3]" },
  0x1c: { name: "Blizzard Strayer", bonus: "on-cryo-aura-hit:reroll+2, on-frozen-hit:reroll+2" },
  0x1d: { name: "Heart of Depth", bonus: "on-skill:hydro+1d12[dur6]" },
  0x1e: { name: "Tenacity of Millelith", bonus: "shield+1, on-skill-hit:all+1d6[dur2]" },
  0x1f: { name: "Pale Flame", bonus: "on-skill:+1d8[max2][dur7s], on-2:physycal+4d6" },
  0x20: { name: "Shimenawa's Reminiscence", bonus: "on-e:energy-30&wpnAtk+3d6" },
  0x21: { name: "Emblem of Severed Fate", bonus: "b+[er]d6" },
  0x22: { name: "Husk of Opulent Dreams", bonus: "on-geo:$+2, on-off-field:$+1, on-on-field:$-1 [max$=4] def+$/2, geo+[$/2]d6" },
  0x23: { name: "Ocean-Hued Clam", bonus: "on[heal]:$1+=[max(hp + heal - vit, 0)/5]&$2=$2??3, on[end]:if(--$2=0)hit(($1=0)d4)" },
  0x24: { name: "Vermillion Hereafter" },
  0x25: { name: "Echoes of an Offering" },
  0x26: { name: "Deepwood Memories" },
  0x27: { name: "Gilded Dreams" },
  0x28: { name: "Desert Pavilion Chronicle" },
  0x29: { name: "Flower of Paradise Lost" },
  0x2a: { name: "Nymph's Dream" },
  0x2b: { name: "Vourukasha's Glow" },
  0x2c: { name: "Marechaussee Hunter" },
  0x2d: { name: "Golden Troupe" },
}

const sandsD6 = {desc:"atk+1d6 ●●●", slots:3, on:{atk:{bonus:[6]}}}
const sandsReaction = {desc:"reaction+1 ●●●", slots:3, on:{reaction:{bonus:1}}}
const elementalGoblets = elements.map(e=>({desc:`${e}+1d8 ●●●●`, slots:4, on:{atk:{bonus:[8], when:{element:e}}}}))
const rerollCirclet = {desc:"reroll+2 ●●●●", slots:4, on:{roll:{reroll:2}}}
export const mainStats = {
  "生の花": [{desc:"vit+3 ●●", slots:2, on:{equip:{vit:3}}}],
  "死の羽": [{desc:"atk+1d4 ●●", slots:2, on:{atk:{bonus:[4]}}}],
  "時の砂": [sandsD6, sandsReaction],
  "空の杯": elementalGoblets,
  "理の冠": [rerollCirclet],
}
