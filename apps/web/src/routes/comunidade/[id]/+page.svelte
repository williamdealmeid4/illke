<script>
  import { onMount } from "svelte";
  import { mutate } from "$lib/api.js";
  import { invalidateAll } from "$app/navigation";
  import Pagination from "$lib/components/Pagination.svelte";
  let { data } = $props();
  let body = $state("");
  let message = $state("");
  let busy = $state(false);
  let report = $state(false);
  let reason = $state("");
  let authorName = $state("");
  onMount(() => {
    authorName = localStorage.getItem("illke-nickname") || "";
  });
  async function reply() {
    busy = true;
    try {
      await mutate("/topics/" + data.topic.id + "/replies", {
        body,
        author_name: authorName,
      });
      localStorage.setItem("illke-nickname", authorName);
      body = "";
      await invalidateAll();
    } catch (e) {
      message = e.message;
    } finally {
      busy = false;
    }
  }
  async function reportTopic() {
    try {
      const result = await mutate("/topics/" + data.topic.id + "/reports", {
        reason,
      });
      message = result.message;
      report = false;
    } catch (e) {
      message = e.message;
    }
  }
</script>

<svelte:head><title>{data.topic.title} — Comunidade illke</title></svelte:head>
<div class="page-header">
  <div class="breadcrumbs">
    <a href="/comunidade">Comunidade</a><span>/</span>{data.topic.category}
  </div>
  <h1>{data.topic.title}</h1>
  <p>
    {data.topic.context_id || "Conversa geral"}{data.topic.locked
      ? " · Tópico fechado"
      : ""}
  </p>
</div>
<article class="post">
  <div class="post-author">
    <span class="topic-avatar">{data.topic.author_name?.slice(0, 1)}</span
    ><strong>{data.topic.author_name}</strong>
  </div>
  <div>
    <time datetime={data.topic.created_at}
      >{new Date(data.topic.created_at).toLocaleString("pt-BR")}</time
    >
    <div class="post-body">{data.topic.body}</div>
  </div>
</article>
{#each data.replies.data as reply}<article class="post">
    <div class="post-author">
      <span class="topic-avatar">{reply.author_name?.slice(0, 1)}</span><strong
        >{reply.author_name}</strong
      >
    </div>
    <div>
      <time datetime={reply.created_at}
        >{new Date(reply.created_at).toLocaleString("pt-BR")}</time
      >
      <div class="post-body">{reply.body}</div>
    </div>
  </article>{/each}<Pagination pagination={data.replies} />
{#if message}<p class="notice" role="status">
    {message}
  </p>{/if}{#if !data.topic.locked}<form
    class="content-panel"
    onsubmit={(e) => {
      e.preventDefault();
      reply();
    }}
  >
    <h2>Responder ao tópico</h2>
    <label for="reply-nickname">Seu apelido</label><input
      id="reply-nickname"
      style="display:block;margin:12px 0"
      bind:value={authorName}
      required
      minlength="2"
      maxlength="60"
    /><label for="reply" class="sr-only">Sua resposta</label><textarea
      id="reply"
      bind:value={body}
      style="width:100%"
      required
      minlength="2"
      maxlength="20000"
      placeholder="Escreva sua resposta."></textarea>
    <div class="actions">
      <button class="button" disabled={busy}>Publicar resposta</button>
    </div>
  </form>{/if}<button class="danger-link" onclick={() => (report = !report)}
  >Denunciar tópico</button
>{#if report}<form
    class="content-panel"
    onsubmit={(e) => {
      e.preventDefault();
      reportTopic();
    }}
  >
    <label for="reason">Descreva o problema</label><textarea
      id="reason"
      style="width:100%;margin:12px 0"
      bind:value={reason}
      required
      minlength="5"
      maxlength="1000"></textarea><button class="button secondary"
      >Enviar denúncia</button
    >
  </form>{/if}
