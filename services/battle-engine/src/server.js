import { Worker } from "node:worker_threads";
import { analyzeTeam } from './team-analysis.js';
import { finishEvaluation, makeBenchmark } from './simulation.js';
import { readFile, stat } from 'node:fs/promises';
import http from "node:http";
import {
  context,
  versions,
  options,
  evaluate,
  damage,
  legal,
  stats,
  importTeam,
  exportTeam,
  validateTeam,
  speciesData,
  contexts,
} from "./domain.js";
let simulationRunning = false;
let activeSimulation = null;
let readinessCache = { modified: null, contexts: null };
async function availableContexts() {
  const path = new URL('../../../.data/catalog.json',import.meta.url);
  try {
    const modified = (await stat(path)).mtimeMs;
    if(readinessCache.modified===modified) return readinessCache.contexts;
    const catalog=JSON.parse(await readFile(path,'utf8'));
    const result=contexts.map(c=>{try{const teams=makeBenchmark(catalog.builds,c.id);return {...c,snapshot_id:catalog.snapshot_id,availability:{builder:true,validation:true,simulation:true,reference_teams:teams.length}};}catch(error){return {...c,snapshot_id:catalog.snapshot_id,availability:{builder:true,validation:true,simulation:false,reason:error.message}};}});
    readinessCache={modified,contexts:result};return result;
  } catch {return contexts.map(c=>({...c,availability:{builder:true,validation:true,simulation:false,reason:'O catálogo de referência ainda não está disponível.'}}));}
}
const port = Number(process.env.ENGINE_PORT || 8081);
const token = process.env.ENGINE_TOKEN;
if (!token) {
  console.error("ENGINE_TOKEN ausente. Configure o segredo interno.");
  process.exit(1);
}
const send = (res, status, data) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/health")
        return send(res, 200, { status: "ok", versions });
      if (req.headers.authorization !== "Bearer " + token)
        return send(res, 401, { error: { code: "UNAUTHENTICATED" } });
      if (req.method === "GET" && url.pathname === "/contexts")
        return send(res, 200, await availableContexts());
      if (req.method === "GET" && url.pathname === "/context")
        return send(res, 200, context);
      if (req.method === "GET" && url.pathname === "/species")
        return send(res, 200, speciesData());
      if (req.method === "GET" && url.pathname === "/options")
        return send(
          res,
          200,
          options(
            url.searchParams.get("pokemon") || "",
            url.searchParams.get("context_id") || "gen9ou",
          ),
        );
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 2 * 1024 * 1024) {
          send(res, 413, { error: { code: "PAYLOAD_TOO_LARGE" } });
          req.destroy();
          return;
        }
      }
      const body = JSON.parse(raw || "{}");
      if (req.method === 'POST' && url.pathname === '/simulate/finalize') return send(res,200,finishEvaluation(body));
      if (req.method === 'POST' && url.pathname === '/simulate/cancel') {
        if(activeSimulation?.id === body.evaluation_id) { activeSimulation.worker.terminate(); activeSimulation.cancel(); }
        return send(res,200,{cancelled:true});
      }
      if (req.method === "POST" && url.pathname === "/simulate") {
        if (simulationRunning)
          return send(res, 429, {
            error: {
              code: "BUSY",
              message: "O motor está avaliando outra equipe.",
            },
          });
        simulationRunning = true;
        const worker = new Worker(
          new URL("./simulation-worker.js", import.meta.url),
          { workerData: body },
        );
        const timer = setTimeout(() => {
          worker.terminate();
          simulationRunning = false;
          if (!res.writableEnded)
            send(res, 504, {
              error: { message: "A avaliação excedeu o tempo limite." },
            });
        }, 540000);
        const done = () => {
          clearTimeout(timer);
          simulationRunning = false;
          activeSimulation = null;
        };
        activeSimulation={id:body.evaluation_id,worker,cancel:()=>{done();if(!res.writableEnded)send(res,409,{error:{message:'Avaliação cancelada.'}});}};
        worker.once("message", (message) => {
          done();
          if (res.writableEnded) return;
          send(
            res,
            message.error ? 422 : 200,
            message.error
              ? { error: { message: message.error } }
              : message.result,
          );
        });
        worker.once("error", (error) => {
          done();
          if (!res.writableEnded)
            send(res, 500, { error: { message: error.message } });
        });
        return;
      }

      const actions = {
        "/evaluate": evaluate,
        "/validate": legal,
        "/stats": stats,
        "/damage": damage,
        "/import": (x) => importTeam(x.text),
        "/export": exportTeam,
        "/team/validate": (x) => validateTeam(x.builds),
        '/team/analyze': analyzeTeam,
      };
      if (req.method !== "POST" || !actions[url.pathname])
        return send(res, 404, { error: { code: "NOT_FOUND" } });
      send(res, 200, actions[url.pathname](body));
    } catch (error) {
      send(res, 422, {
        error: { code: "ENGINE_INPUT_INVALID", message: error.message },
      });
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("illke battle engine http://127.0.0.1:" + port),
  );
