<script>
  import { onMount } from 'svelte';
  let visible = $state(true);
  let skip = $state();
  let restore = () => {};
  function finish() {
    visible = false;
    restore();
  }
  onMount(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const app = document.querySelector('.app');
    const previousInert = app?.inert || false;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    if (app) app.inert = true;
    document.body.style.overflow = 'hidden';
    let restored = false;
    restore = () => {
      if (restored) return;
      restored = true;
      if (app) app.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
      else {
        const content = document.getElementById('content');
        content?.setAttribute('tabindex','-1');
        content?.focus({preventScroll:true});
      }
    };
    skip?.focus({preventScroll:true});
    const timer = setTimeout(finish, 2850);
    return () => { clearTimeout(timer); restore(); };
  });
</script>

<svelte:window onkeydown={event => { if (visible && event.key === 'Escape') finish(); }}/>
{#if visible}
  <dialog open class="opening" aria-modal="true" aria-label="Abertura do illke">
    <div class="opening-scene" aria-hidden="true">
      <div class="opening-halo"></div>
      <svg class="opening-ball" viewBox="0 0 120 120" fill="none">
        <circle class="opening-light" cx="60" cy="60" r="31" fill="#ff6971"/>
        <g class="shell-top">
          <path d="M12 60a48 48 0 0 1 96 0H12Z" fill="#ff6971" stroke="#17191f" stroke-width="5.5" stroke-linejoin="round"/>
        </g>
        <g class="shell-bottom">
          <path d="M108 60a48 48 0 0 1-96 0h96Z" fill="#f1f3f8" stroke="#17191f" stroke-width="5.5" stroke-linejoin="round"/>
        </g>
        <g class="opening-latch"><circle cx="60" cy="60" r="14" fill="#f1f3f8" stroke="#17191f" stroke-width="5"/><circle cx="60" cy="60" r="5" fill="#ff6971"/></g>
      </svg>
      <strong class="opening-wordmark">illke</strong>
      
    </div>
    <button bind:this={skip} class="opening-skip" onclick={finish}>Pular abertura <span aria-hidden="true">↗</span></button>
  </dialog>
{/if}

<style>
  .opening {width:100%;height:100%;max-width:none;max-height:none;border:0;margin:0;padding:0;position:fixed;inset:0;z-index:1000;background:#17191f;color:#f1f3f8;display:grid;place-items:center;overflow:hidden;animation:opening-away .35s ease 2.5s forwards;}
  .opening-scene {position:relative;text-align:center;display:flex;align-items:center;flex-direction:column;padding:28px;}
  .opening-ball {width:clamp(110px,23vw,175px);overflow:visible;animation:ball-turn 2.5s cubic-bezier(.45,0,.2,1) both;position:relative;z-index:1;}
  .shell-top,.shell-bottom,.opening-latch {transform-origin:60px 60px;}
  .shell-top {animation:shell-open-top 2.5s ease-in-out both;}
  .shell-bottom {animation:shell-open-bottom 2.5s ease-in-out both;}
  .opening-latch {animation:latch-open 2.5s ease-in-out both;}
  .opening-light {filter:blur(9px);animation:light-open 2.5s ease-in-out both;transform-origin:60px 60px;}
  .opening-halo {position:absolute;top:-40px;left:50%;width:340px;height:270px;transform:translateX(-50%);background:radial-gradient(ellipse,#ff697124,transparent 65%);}
  .opening-wordmark {font-family:Barlow,system-ui,sans-serif;font-size:56px;letter-spacing:-3px;line-height:1;margin-top:32px;animation:wordmark-arrive .6s ease .25s both;}
  .opening-skip {position:absolute;right:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:16px;padding:12px 16px;border:1px solid #383e4a;border-radius:8px;background:#20232b;color:#f1f3f8;font-size:13px;cursor:pointer;}
  .opening-skip:focus-visible {outline:3px solid #ff6971;outline-offset:4px;}
  @keyframes ball-turn {0%{transform:rotate(-85deg) scale(.6);opacity:0}18%{opacity:1;transform:rotate(155deg) scale(1)}32%,65%{transform:rotate(335deg) scale(1)}90%,100%{transform:rotate(695deg) scale(1)}}
  @keyframes shell-open-top {0%,30%,70%,100%{transform:translateY(0) rotate(0)}44%,57%{transform:translateY(-18px) rotate(-12deg)}}
  @keyframes shell-open-bottom {0%,30%,70%,100%{transform:translateY(0) rotate(0)}44%,57%{transform:translateY(18px) rotate(12deg)}}
  @keyframes latch-open {0%,30%,70%,100%{opacity:1;transform:scale(1)}43%,57%{opacity:.15;transform:scale(.5)}}
  @keyframes light-open {0%,28%,75%,100%{opacity:0;transform:scale(.4)}45%,57%{opacity:.6;transform:scale(1)}}
  @keyframes wordmark-arrive {from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
  @keyframes opening-away {to{opacity:0;visibility:hidden;pointer-events:none}}
  @media(prefers-reduced-motion:reduce){.opening{display:none}.opening *{animation:none!important}}
</style>
