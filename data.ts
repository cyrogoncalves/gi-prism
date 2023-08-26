import {Artifact, Equip, UnitData} from "./model.ts";

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
    desc: "summon(dur4, vit2, taunt, on-defeat:3d10炎)",
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
  vitality: 10, name:"Barbara", skills: [], auras: { infusion:"水" }
}
export const dullblade: Equip = { skills: [{ desc:"1d10", hits: [{ dice: [10] }]}] }
// const huntersBow: Equip = { skills: [{ desc:"1d8", hits:[{dice:[8]}]}] }
export const pyroHuntersBow: Equip = { skills: [{ desc:"1d8炎", hits:[{dice:[8], element:"炎"}]}] }
export const apprenticesNotes: Equip = { skills: [{ desc:"1d8素", hits:[{dice:[8]}]}] }

// 生の花 死の羽 時の砂 空の杯 理の冠
export const gladiatorsFinaleSands: Artifact = {
  desc: "atk+1d6",
  name: "Gladiator's Longing",
  piece: "Sands of Eon",
  set: "Gladiator's Finale",
  on: { atk: { bonus: [6] } },
  flavor: "A timepiece that recorded the gladiator's days in the bloodstained Colosseum. To him, it counted down the days on his long road to freedom."
}