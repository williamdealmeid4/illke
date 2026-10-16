<script>
  import { onMount, untrack } from "svelte";
  import { FileDown, Send } from "@lucide/svelte";
  import { mutate } from "$lib/api.js";
  let { build, analysis = null } = $props();
  let pdfBusy = $state(false);
  let discordBusy = $state(false);
  let discordAvailable = $state(false);
  let message = $state("");
  let result = $state(null);
  let requestKey = "";
  let polling;
  let previousSignature = "";
  let choose = $state(false);
  let connected = $state(false);
  let guilds = $state([]);
  let guildId = $state("");
  let channelId = $state("");
  let inviteUrl = $state(null);
  let channels = $derived(guilds.find((g) => g.id === guildId)?.channels || []);
  onMount(() => {
    fetch("/api/v1/session", { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((s) => {
        discordAvailable = s.discord_available;
        inviteUrl = s.discord_invite_url;
      })
      .catch(() => {});
    return () => clearTimeout(polling);
  });
  $effect(() => {
    const signature = JSON.stringify(build);
    untrack(() => {
      if (signature === previousSignature) return;
      previousSignature = signature;
      message = "";
      requestKey = "";
      result = null;
      clearTimeout(polling);
      discordBusy = false;
    });
  });
  async function pdf() {
    pdfBusy = true;
    message = "Preparando seu PDF…";
    try {
      const { buildPdf } = await import("$lib/pdf.js");
      await buildPdf(build, { analysis });
      message = "PDF gerado. Confira o arquivo nos downloads.";
    } catch (e) {
      message = e.message;
    } finally {
      pdfBusy = false;
    }
  }
  async function openDiscord() {
    choose = true;
    try {
      const res = await fetch("/api/v1/discord/destinations", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok)
        throw Error(
          "Não foi possível consultar seus servidores. Tente reconectar o Discord.",
        );
      const data = await res.json();
      connected = data.connected;
      guilds = data.guilds;
      inviteUrl = data.invite_url;
      guildId = guilds[0]?.id || "";
      channelId = guilds[0]?.channels[0]?.id || "";
    } catch (e) {
      message = e.message;
    }
  }
  async function discord() {
    discordBusy = true;
    message = "";
    try {
      requestKey ||= crypto.randomUUID();
      result = await mutate("/discord/builds", {
        request_key: requestKey,
        configuration: build,
        guild_id: guildId,
        channel_id: channelId,
      });
      poll();
    } catch (e) {
      message = e.message;
      discordBusy = false;
    }
  }
  function poll() {
    if (!result) return;
    if (["sent", "unconfirmed"].includes(result.status)) {
      discordBusy = false;
      message =
        result.status === "sent"
          ? "Build publicada pelo bot no Discord."
          : result.error;
      return;
    }
    polling = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/discord/builds/" + result.public_id, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok)
          throw Error(
            "Não foi possível consultar o envio. Confira o canal antes de tentar novamente.",
          );
        result = await res.json();
        poll();
      } catch (e) {
        discordBusy = false;
        message = e.message;
      }
    }, 2000);
  }
</script>

<div class="actions">
  <button
    class="button"
    onclick={pdf}
    disabled={pdfBusy || !build.moves?.filter(Boolean).length}
    ><FileDown size={17} />{pdfBusy ? "Gerando PDF…" : "Salvar PDF"}</button
  ><button
    class="button secondary"
    onclick={openDiscord}
    disabled={discordBusy || !discordAvailable || result?.status === "sent"}
    ><Send size={16} />{discordBusy
      ? "Enviando…"
      : result?.status === "sent"
        ? "Enviado ao Discord"
        : "Enviar para Discord"}</button
  >
</div>
<p class="help">
  {#if !build.moves?.filter(Boolean).length}Selecione pelo menos um golpe para
    salvar o PDF.
  {/if}
  Sem cadastro. O PDF é gerado no seu navegador.{#if discordAvailable}
    Escolha um servidor seu e um canal para publicar pelo bot do illke.{:else}
    A integração Discord ainda não foi configurada neste site.{/if}
</p>
{#if result && ["queued", "sending"].includes(result.status)}<p
    class="help"
    role="status"
  >
    Envio {result.status === "queued" ? "na fila" : "em andamento"}…
  </p>{/if}{#if message}<p class="notice" role="status">
    {message}
  </p>{/if}{#if result?.message_url}<a
    class="text-link"
    href={result.message_url}
    rel="noreferrer">Abrir mensagem no Discord</a
  >{/if}

{#if choose}<section class="content-panel">
    <h3>Enviar para o seu Discord</h3>
    <p class="help">
      Adicione o bot ao seu servidor. Depois conecte o Discord para escolher
      onde publicar. Não é criada uma conta no illke.
    </p>
    <div class="actions">
      {#if inviteUrl}<a
          class="button secondary small"
          href={inviteUrl}
          rel="noreferrer">Adicionar bot ao servidor</a
        >{/if}{#if !connected}<a
          class="button small"
          href="/api/v1/discord/connect">Conectar Discord</a
        >{/if}
    </div>
    {#if connected}{#if !guilds.length}<p class="help">
          Não encontramos servidores em que você seja proprietário ou
          administrador e o bot esteja presente. Adicione o bot e atualize esta
          lista.
        </p>{:else}<div class="form-grid" style="margin-top:18px">
          <label
            >Seu servidor<select
              bind:value={guildId}
              onchange={() => (channelId = channels[0]?.id || "")}
              >{#each guilds as guild}<option value={guild.id}
                  >{guild.name}</option
                >{/each}</select
            ></label
          ><label
            >Canal<select bind:value={channelId}
              >{#each channels as channel}<option value={channel.id}
                  >#{channel.name}</option
                >{/each}</select
            ></label
          >
        </div>
        <p class="help">
          A publicação aparecerá como mensagem do bot neste canal.
        </p>
        <button
          class="button"
          onclick={discord}
          disabled={discordBusy || !channelId}>Publicar build no canal</button
        >{/if}<button
        class="text-link"
        style="border:0;background:none;padding:12px"
        onclick={openDiscord}>Atualizar servidores</button
      >{/if}
  </section>{/if}
