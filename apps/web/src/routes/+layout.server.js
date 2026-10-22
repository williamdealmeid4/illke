import { readApi } from "$lib/api.js";
import { getGame } from "$lib/games.js";
export async function load({ fetch, url, cookies, isDataRequest }) {
  const showIntro = !isDataRequest;
  const requested = url.searchParams.get("game");
  const selectedGame = getGame(requested ?? cookies.get("illke-game"));
  if (requested !== null && selectedGame) cookies.set("illke-game", selectedGame.id, {path:"/", httpOnly:true, sameSite:"lax", secure:url.protocol==="https:", maxAge:31536000});
  try {
    const [contexts, session] = await Promise.all([
      readApi(fetch, "/contexts"),
      readApi(fetch, "/session"),
    ]);
    return { contexts, discordInviteUrl: session.discord_invite_url, selectedGame, showIntro };
  } catch {
    return { contexts: [], selectedGame, showIntro };
  }
}
