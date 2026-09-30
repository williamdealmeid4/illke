import {readApi} from '$lib/api.js';
export async function load({fetch}){try{return {summary:await readApi(fetch,'/summary'),error:null};}catch(e){return {summary:null,error:e.message};}}
