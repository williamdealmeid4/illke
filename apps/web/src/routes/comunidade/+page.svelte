<script>
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { MessageSquare, Plus } from "@lucide/svelte";
  import { mutate } from "$lib/api.js";
  import Pagination from "$lib/components/Pagination.svelte";
  let { data } = $props();
  let compose = $state(false);
  let title = $state("");
  let body = $state("");
  let category = $state("estrategia");
  let context = $state("gen9ou");
  let message = $state("");
  let busy = $state(false);
  let authorName = $state("");
  onMount(() => {
    authorName = localStorage.getItem("illke-nickname") || "";
  });
  const categories = {
    estrategia: "Estratégia",
    equipes: "Equipes",
    campanha: "Campanha",
    duvidas: "Dúvidas",
    geral: "Geral",
  };
  async function post() {
    busy = true;
    try {
      const result = await mutate("/topics", {
        title,
        body,
        category,
        author_name: authorName,
        context_id: context,
        ...(data.query.build ? { build_id: Number(data.query.build) } : {}),
      });
      localStorage.setItem("illke-nickname", authorName);
      window.location.href = "/comunidade/" + result.id;
    } catch (e) {
      message = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Comunidade — illke</title></svelte:head>
<div class="page-header split">
  <div>
    <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Comunidade</div>
    <h1>O próximo movimento vem da conversa.</h1>
    <p>
      Equipes para discutir, dúvidas para resolver e estratégias para
      compartilhar.
    </p>
  </div>
  <button class="button" onclick={() => (compose = !compose)}
    ><Plus size={17} /> Novo tópico</button
  >
</div>
{#if compose}<section class="content-panel">
    <h2>Comece uma conversa</h2>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        post();
      }}
      class="form-grid"
    >
      <label class="wide"
        >Seu apelido<input
          bind:value={authorName}
          required
          minlength="2"
          maxlength="60"
          autocomplete="nickname"
        /></label
      ><label class="wide"
        >Título<input
          bind:value={title}
          required
          minlength="5"
          maxlength="160"
        /></label
      ><label
        >Categoria<select bind:value={category}
          >{#each Object.entries(categories) as [key, label]}<option value={key}
              >{label}</option
            >{/each}</select
        ></label
      ><label
        >Formato<select bind:value={context}
          ><option value="">Sem formato específico</option
          >{#each data.contexts as c}<option value={c.id}>{c.label}</option
            >{/each}</select
        ></label
      ><label class="wide"
        >Sua mensagem<textarea
          bind:value={body}
          required
          minlength="10"
          maxlength="20000"></textarea></label
      >
      <div class="wide">
        <button class="button" disabled={busy}>Publicar tópico</button>
      </div>
    </form>
    {#if message}<p class="notice" role="status">{message}</p>{/if}
  </section>{/if}
<form class="toolbar">
  <label class="sr-only" for="category">Categoria</label><select
    name="category"
    id="category"
    value={data.query.category || ""}
    ><option value="">Todas as conversas</option
    >{#each Object.entries(categories) as [key, label]}<option value={key}
        >{label}</option
      >{/each}</select
  ><label class="sr-only" for="forum-context">Formato</label><select
    name="context_id"
    id="forum-context"
    value={data.query.context_id || ""}
    ><option value="">Todos os formatos</option
    >{#each data.contexts as c}<option value={c.id}>{c.label}</option
      >{/each}</select
  ><button class="button secondary">Filtrar</button>
</form>
{#if data.error}<p class="notice error">
    {data.error}
  </p>{:else if !data.topics?.data?.length}<div class="empty-panel">
    <MessageSquare size={26} />
    <h3 style="margin-top:15px">A primeira conversa pode ser sua.</h3>
    <p>
      Compartilhe uma equipe que você está testando ou uma dúvida sobre seu
      jogo.
    </p>
    <button class="button secondary" onclick={() => (compose = true)}
      >Criar tópico</button
    >
  </div>{:else}<div class="topic-list">
    {#each data.topics.data as topic}<article class="topic-row">
        <span class="topic-avatar">{topic.author_name?.slice(0, 1) || "T"}</span
        >
        <div>
          <h3>
            <a href={"/comunidade/" + topic.id}>{topic.title}</a
            >{#if topic.locked}
              <span class="chip">Fechado</span>{/if}
          </h3>
          <p>
            {topic.author_name} · {categories[topic.category]}{topic.context_id
              ? " · " + topic.context_id
              : ""} · {new Date(topic.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div class="topic-count">
          <MessageSquare size={14} />
          {topic.replies_count}
        </div>
      </article>{/each}
  </div>
  <Pagination pagination={data.topics} />{/if}
