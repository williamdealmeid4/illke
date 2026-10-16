import { readApi } from "$lib/api.js";
export async function load({ fetch }) {
  try {
    const [contexts, session] = await Promise.all([
      readApi(fetch, "/contexts"),
      readApi(fetch, "/session"),
    ]);
    return { contexts, discordInviteUrl: session.discord_invite_url };
  } catch {
    return { contexts: [] };
  }
}
