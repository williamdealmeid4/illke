/** Laravel é a autoridade de persistência e sessões anônimas. */
export async function readApi(fetch, path, cookie = "") {
  const base =
    typeof process !== "undefined"
      ? process.env.API_INTERNAL_URL || "http://127.0.0.1:8000"
      : "";
  const res = await fetch(base + "/api/v1" + path, {
    headers: { Accept: "application/json", ...(cookie ? { cookie } : {}) },
  });
  if (!res.ok) {
    const details = await res.json().catch(() => ({}));
    throw new Error(
      res.status === 404
        ? "Registro não encontrado."
        : details.error?.message || details.message || "A consulta está indisponível. Tente novamente.",
    );
  }
  return res.json();
}
export async function mutate(path, body, method = "POST") {
  const session = await fetch("/api/v1/session", {
    headers: { Accept: "application/json" },
  }).then((r) => r.json());
  if (!session.csrf_token) throw new Error(session.error?.message || session.message || 'Não foi possível iniciar a sessão.');
  const res = await fetch("/api/v1" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": session.csrf_token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await res.json().catch(() => ({ message: 'O serviço retornou uma resposta inválida.' }));
  if (!res.ok)
    throw Object.assign(new Error(
      Object.values(result.errors || {})
        .flat()
        .join(" ") ||
        result.error?.message ||
        result.message ||
        "Não foi possível concluir a ação.",
    ), { fields: result.error?.fields || result.errors || {}, retryAfter: result.error?.retry_after || 0 });
  return result;
}
export const sprite = (pokemon) =>
  "/api/v1/sprite/" + encodeURIComponent(pokemon);
export const statLabels = {
  hp: "HP",
  atk: "Ataque",
  def: "Defesa",
  spa: "At. esp.",
  spd: "Def. esp.",
  spe: "Velocidade",
};
export const roles = {
  unclassified: 'Não classificada',
  "physical-attacker": "Ataque físico",
  "special-attacker": "Ataque especial",
  setup: "Preparação",
  wall: "Resistência",
  support: "Suporte",
  control: "Controle",
};
