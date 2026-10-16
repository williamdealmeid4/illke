import http from "node:http";
import { REST, Routes } from "discord.js";
import { buildMessage } from "./payload.js";
import { canPublish } from "./permissions.js";
const { DISCORD_TOKEN, DISCORD_APPLICATION_ID, BOT_SERVICE_TOKEN } =
  process.env;
if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID || !BOT_SERVICE_TOKEN) {
  console.error(
    "Configure DISCORD_TOKEN, DISCORD_APPLICATION_ID e BOT_SERVICE_TOKEN.",
  );
  process.exit(1);
}
const rest = new REST({ version: "10", timeout: 15000, retries: 0 }).setToken(
  DISCORD_TOKEN,
);
const send = (res, status, data) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
};
async function destinations(guilds) {
  const result = [];
  for (const guild of guilds) {
    try {
      const [channels, roles, member] = await Promise.all([
        rest.get(Routes.guildChannels(guild.id)),
        rest.get(Routes.guildRoles(guild.id)),
        rest.get(Routes.guildMember(guild.id, DISCORD_APPLICATION_ID)),
      ]);
      result.push({
        ...guild,
        channels: channels
          .filter(
            (c) =>
              [0, 5].includes(c.type) && canPublish(c, roles, member, guild.id),
          )
          .map((c) => ({ id: c.id, name: c.name })),
      });
    } catch (error) {
      if (![403, 404].includes(error.status)) throw error;
    }
  }
  return result;
}
http
  .createServer(async (req, res) => {
    if (req.url === "/health") return send(res, 200, { status: "ok" });
    if (req.headers.authorization !== "Bearer " + BOT_SERVICE_TOKEN)
      return send(res, 401, { message: "Não autorizado." });
    if (
      req.method !== "POST" ||
      !["/dispatch", "/destinations"].includes(req.url)
    )
      return send(res, 404, { message: "Não encontrado." });
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 40000)
          return send(res, 413, { message: "Conteúdo excede o limite." });
      }
      const input = JSON.parse(raw);
      if (req.url === "/destinations") {
        if (!Array.isArray(input.guilds) || input.guilds.length > 100)
          return send(res, 422, { message: "Lista de servidores inválida." });
        return send(res, 200, { guilds: await destinations(input.guilds) });
      }
      if (
        !input.id ||
        !input.configuration?.pokemon ||
        !Array.isArray(input.configuration.moves) ||
        !/^\d{1,24}$/.test(input.guild_id) ||
        !/^\d{1,24}$/.test(input.channel_id)
      )
        return send(res, 422, { message: "Build ou destino inválido." });
      const allowed = await destinations([{ id: input.guild_id }]);
      if (!allowed[0]?.channels.some((c) => c.id === input.channel_id))
        return send(res, 403, {
          message: "O bot não pode publicar neste canal.",
        });
      const result = await rest.post(Routes.channelMessages(input.channel_id), {
        body: buildMessage(input),
      });
      send(res, 200, {
        message_url: `https://discord.com/channels/${input.guild_id}/${input.channel_id}/${result.id}`,
      });
    } catch (error) {
      console.error("Operação Discord falhou:", error.message);
      send(res, 502, { message: "Não foi possível confirmar a operação." });
    }
  })
  .listen(Number(process.env.BOT_PORT || 8082), "127.0.0.1", () =>
    console.log(
      "illke Discord bridge ativo em 127.0.0.1:" +
        (process.env.BOT_PORT || 8082),
    ),
  );
