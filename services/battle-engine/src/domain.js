import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { z } from 'zod';
const require = createRequire(import.meta.url);
const { Dex, TeamValidator, Teams } = require('pokemon-showdown');
const calc = require('@smogon/calc');
const psVersion = require('pokemon-showdown/package.json').version;
const calcVersion = require('@smogon/calc/package.json').version;
export const versions = {engine:'1.0.0',showdown:psVersion,calculator:calcVersion,evaluator:'1.0.0'};
export const context = {id:'sv-ou-r1',label:'Scarlet/Violet · Singles OU',game_versions:['scarlet','violet'],update:'4.0.0',dlcs:['the-teal-mask','the-indigo-disk'],format:'gen9ou',generation:9,default_level:100,status:'supported',authority:'Pokemon Showdown',rules_revision:psVersion,capabilities:{nature:true,evs:true,ivs:true,held_item:true,tera:true,mega:false,dynamax:false,max_moves:4,ev_max:252,ev_total:510,iv_max:31}};
const statNames=['hp','atk','def','spa','spd','spe'];
const statMap=(max)=>z.object(Object.fromEntries(statNames.map(s=>[s,z.number().int().min(0).max(max)])));
export const buildSchema=z.object({name:z.string().trim().min(1).max(100),context_id:z.literal('sv-ou-r1'),pokemon:z.string().min(1).max(80),level:z.number().int().min(1).max(100),nature:z.string().min(1).max(30),ability:z.string().min(1).max(80),item:z.string().max(80),moves:z.array(z.string().min(1).max(80)).min(1).max(4),evs:statMap(252),ivs:statMap(31),tera_type:z.string().max(30),role:z.enum(['physical-attacker','special-attacker','setup','wall','support','control']),strategy:z.string().max(20000).default(''),visibility:z.enum(['private','unlisted','public']).default('private')});
const id=s=>Dex.toID(s);
function toSet(b){return {name:b.name,species:b.pokemon,level:b.level,nature:b.nature,ability:b.ability,item:b.item,moves:b.moves,evs:b.evs,ivs:b.ivs,teraType:b.tera_type||undefined};}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export function hash(value){return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
export function options(name){
 const species=Dex.species.get(name);
 if(!species.exists)return {supported:false,reason:'Espécie ou forma ausente no snapshot do Showdown.'};
 const learnset=Dex.species.getLearnsetData(species.id).learnset||{};
 const moves=Object.keys(learnset).map(x=>Dex.moves.get(x)).filter(x=>x.exists&&x.gen<=9).map(x=>({id:x.id,name:x.name,type:x.type,category:x.category,power:x.basePower,accuracy:x.accuracy}));
 return {supported:true,pokemon:species.name,form:species.forme||'Base',types:species.types,stats:species.baseStats,abilities:Object.values(species.abilities),moves,natures:Dex.natures.all().map(x=>({name:x.name,plus:x.plus,minus:x.minus})),items:Dex.items.all().filter(x=>x.exists&&x.gen<=9&&!x.isNonstandard).map(x=>({id:x.id,name:x.name})),types:Dex.types.all().filter(x=>x.exists).map(x=>x.name),context};
}
export function legal(build){
 const parsed=buildSchema.safeParse(build);
 if(!parsed.success)return {status:'invalid',issues:parsed.error.issues.map(x=>({code:'SCHEMA_INVALID',path:x.path.join('.'),message:x.message}))};
 const b=parsed.data,issues=[];
 if(Object.values(b.evs).reduce((a,n)=>a+n,0)>510)issues.push({code:'EV_TOTAL_MAX',path:'evs',message:'O total de EVs excede 510.'});
 if(new Set(b.moves.map(id)).size!==b.moves.length)issues.push({code:'DUPLICATE_MOVE',path:'moves',message:'Golpes repetidos não são permitidos.'});
 if(!Dex.species.get(b.pokemon).exists)return {status:'unsupported',issues:[{code:'UNKNOWN_FORM',path:'pokemon',message:'Forma ausente no snapshot de cálculo.'}]};
 const set=toSet(b);
 const validator=new TeamValidator('gen9ou');
 const problems=validator.validateSet(structuredClone(set),{})||[];
 issues.push(...problems.map(message=>({code:'SHOWDOWN_SET_INVALID',path:'set',message})));
 return {status:issues.length?'illegal':'legal',scope:'Conjunto individual no formato Showdown gen9ou; equipe e obtenção no cartucho exigem análise própria.',issues};
}
export function stats(build){
 const gen=calc.Generations.get(9);
 const p=new calc.Pokemon(gen,build.pokemon,{level:build.level,nature:build.nature,ability:build.ability,item:build.item||undefined,evs:build.evs,ivs:build.ivs});
 return p.stats;
}
export function damage(input){
 const gen=calc.Generations.get(9);
 const make=b=>new calc.Pokemon(gen,b.pokemon,{level:b.level,nature:b.nature,ability:b.ability,item:b.item||undefined,evs:b.evs,ivs:b.ivs,teraType:b.tera_type||undefined,boosts:b.boosts||{},curHP:b.current_hp});
 const result=calc.calculate(gen,make(input.attacker),make(input.defender),new calc.Move(gen,input.move,{isCrit:input.critical===true}),new calc.Field({gameType:input.game_type||'Singles',weather:input.weather||undefined,terrain:input.terrain||undefined,attackerSide:input.attacker_side||{},defenderSide:input.defender_side||{}}));
 return {range:result.range(),description:result.desc(),rolls:result.damage,versions};
}
export function evaluate(build){
 const legality=legal(build);
 const result={legality,context,versions,input_hash:hash({build,versions,context}),score:null,confidence:'partial',evidence:[],limitations:['Não estima chance de vitória.','Sem benchmark editorial aprovado, adequação ao metagame e sinergia não recebem pontuação.','Validação individual não valida cláusulas de equipe nem comprova origem de um exemplar no cartucho.']};
 if(legality.status!=='legal')return result;
 result.stats=stats(build);
 const species=Dex.species.get(build.pokemon),nature=Dex.natures.get(build.nature),moveData=build.moves.map(x=>Dex.moves.get(x));
 const physical=moveData.filter(m=>m.category==='Physical'),special=moveData.filter(m=>m.category==='Special');
 if(build.role==='physical-attacker'&&nature.minus==='atk')result.evidence.push({code:'NATURE_REDUCES_ROLE_STAT',severity:'warning',message:'A nature reduz Attack, atributo principal da função física.',observed:nature.name});
 if(build.role==='special-attacker'&&nature.minus==='spa')result.evidence.push({code:'NATURE_REDUCES_ROLE_STAT',severity:'warning',message:'A nature reduz Special Attack, atributo principal da função especial.',observed:nature.name});
 if(build.role==='physical-attacker'&&!physical.length)result.evidence.push({code:'NO_PHYSICAL_ACTION',severity:'warning',message:'Nenhum golpe físico foi selecionado para a função declarada.'});
 if(build.role==='special-attacker'&&!special.length)result.evidence.push({code:'NO_SPECIAL_ACTION',severity:'warning',message:'Nenhum golpe especial foi selecionado para a função declarada.'});
 const unused=510-Object.values(build.evs).reduce((a,n)=>a+n,0);
 if(unused>6)result.evidence.push({code:'TRAINING_UNUSED',severity:'info',message:unused+' EVs ainda podem ser distribuídos.',observed:unused});
 if(id(build.item).startsWith('choice')&&moveData.some(m=>m.category==='Status'))result.evidence.push({code:'CHOICE_STATUS_TRADEOFF',severity:'info',message:'O item Choice trava a seleção de golpe; confira a intenção dos golpes de status.'});
 result.evidence.push({code:'STAT_CALCULATION',severity:'info',message:'Atributos calculados para nível, nature, EVs e IVs informados.',observed:result.stats});
 result.components={coherence:{status:'observed',warnings:result.evidence.filter(x=>x.severity==='warning').length},efficiency:{status:'requires_benchmarks'},context_fit:{status:'requires_benchmarks'},synergy:{status:'requires_team'},popularity:{status:'no_data'}};
 return result;
}
export function importTeam(text){if(typeof text!=='string'||text.length>20000)throw Error('Importação limitada a 20.000 caracteres.');return Teams.import(text)||[];}
export function exportTeam(build){return Teams.export([toSet(build)]);}
export function validateTeam(builds){return {issues:new TeamValidator('gen9ou').validateTeam(builds.map(toSet))||[],versions,context};}
export function speciesData(){return Dex.species.all().filter(s=>s.exists).map(s=>({id:s.id,name:s.name,num:s.num,forme:s.forme,baseSpecies:s.baseSpecies,types:s.types,stats:s.baseStats,abilities:s.abilities,gen:s.gen,nonstandard:s.isNonstandard||null}));}
