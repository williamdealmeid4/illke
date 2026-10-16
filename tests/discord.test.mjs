import test from "node:test";
import assert from "node:assert/strict";
import { canPublish } from "../apps/discord-bot/src/permissions.js";
import { buildMessage } from "../apps/discord-bot/src/payload.js";
const roles = [{ id: "guild", permissions: "19456" }];
const member = { user: { id: "bot" }, roles: [] };
test("Discord channel permissions respect view, send, embed and overwrites", () => {
  assert.equal(
    canPublish({ permission_overwrites: [] }, roles, member, "guild"),
    true,
  );
  assert.equal(
    canPublish(
      { permission_overwrites: [{ id: "guild", deny: "2048", allow: "0" }] },
      roles,
      member,
      "guild",
    ),
    false,
  );
  assert.equal(
    canPublish(
      { permission_overwrites: [{ id: "bot", deny: "1024", allow: "0" }] },
      roles,
      member,
      "guild",
    ),
    false,
  );
  assert.equal(
    canPublish(
      { permission_overwrites: [] },
      [{ id: "guild", permissions: "8" }],
      member,
      "guild",
    ),
    true,
  );
});
test("shared builds cannot ping roles or everyone and use a stable delivery nonce", () => {
  const message = buildMessage({
    id: "12345678-1234-1234-1234-123456789012",
    configuration: {
      pokemon: "Blastoise",
      name: "Tank",
      context_id: "gen9ou",
      level: 100,
      nature: "Bold",
      ability: "Torrent",
      item: "Leftovers",
      moves: ["Surf"],
      evs: { hp: 252 },
      ivs: { hp: 31 },
      strategy: "@everyone",
    },
  });
  assert.deepEqual(message.allowed_mentions, { parse: [] });
  assert.equal(message.enforce_nonce, true);
  assert.ok(message.nonce.length <= 25);
  assert.equal(message.embeds[0].title, "Blastoise | Tank");
});
