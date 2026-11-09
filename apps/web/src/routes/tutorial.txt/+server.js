import tutorial from '../../../../../docs/TUTORIAL.md?raw';
export function GET(){return new Response(tutorial,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="illke-tutorial.md"'}});}
