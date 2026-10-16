<script>
  let { data } = $props();
</script>

<svelte:head><title>Bot do Discord — illke</title></svelte:head>
<div class="page-header">
  <h1>Seu servidor. Suas estratégias.</h1>
  <p>Leve as builds do illke para o Discord da sua comunidade.</p>
</div>
<div class="prose">
  <h2>Como funciona</h2>
  <ol>
    <li>Adicione o bot do illke ao seu servidor.</li>
    <li>Monte uma build ou abra uma build de referência.</li>
    <li>Escolha “Enviar para Discord” e conecte seu Discord.</li>
    <li>Escolha seu servidor e o canal e confirme a publicação.</li>
  </ol>
  <p>
    A conexão é temporária e não cria conta no site. Nesta versão, a publicação
    está disponível em servidores em que você seja proprietário ou
    administrador. O bot precisa poder ver o canal, enviar mensagens e
    incorporar links.
  </p>
  {#if data.discordInviteUrl}<a
      class="button"
      href={data.discordInviteUrl}
      target="_blank"
      rel="noreferrer">Adicionar bot ao meu servidor</a
    >{:else}<div class="notice">
      O bot ainda não está disponível para instalação. Enquanto isso, você pode
      salvar qualquer build em PDF, sem cadastro.
    </div>{/if}
  <div class="actions">
    <a class="button secondary" href="/builder">Abrir builder</a>
  </div>
</div>
