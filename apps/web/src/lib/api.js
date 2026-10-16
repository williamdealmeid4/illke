/** Laravel é a autoridade de persistência e sessões anônimas. */
export async function readApi(fetch, path, cookie = "") {
  const base =
    typeof process !== "undefined"
      ? process.env.API_INTERNAL_URL || "http://127.0.0.1:8000"
      : "";
  const res = await fetch(base + "/api/v1" + path, {
    headers: { Accept: "application/json", ...(cookie ? { cookie } : {}) },
  });
  if (!res.ok)
    throw new Error(
      res.status === 404
        ? "Registro não encontrado."
        : "A consulta está indisponível. Tente novamente.",
    );
  return res.json();
}
export async function mutate(path, body, method = "POST") {
  const session = await fetch("/api/v1/session", {
    headers: { Accept: "application/json" },
  }).then((r) => r.json());
  const res = await fetch("/api/v1" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": session.csrf_token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok)
    throw new Error(
      Object.values(result.errors || {})
        .flat()
        .join(" ") ||
        result.error?.message ||
        result.message ||
        "Não foi possível concluir a ação.",
    );
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
  "physical-attacker": "Ataque físico",
  "special-attacker": "Ataque especial",
  setup: "Preparação",
  wall: "Resistência",
  support: "Suporte",
  control: "Controle",
};
