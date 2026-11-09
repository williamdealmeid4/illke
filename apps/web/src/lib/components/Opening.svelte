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
    <div class="opening-grid-bg" aria-hidden="true"></div>
    <div class="opening-hud-corners" aria-hidden="true">
      <span class="hud-tl">SYS.DEX // 01–09</span>
      <span class="hud-tr">SYNC // 1351 ESPÉCIES</span>
      <span class="hud-bl">ENGINE // SHOWDOWN OU</span>
    </div>
    <div class="opening-scene" aria-hidden="true">
      <div class="opening-halo"></div>
      <div class="opening-stage">
        <svg class="opening-orbit" viewBox="0 0 220 220" fill="none">
          <circle cx="110" cy="110" r="96" stroke="#ff4738" stroke-opacity=".22" stroke-width="1" stroke-dasharray="6 8"/>
          <circle cx="110" cy="110" r="82" stroke="#f5b82e" stroke-opacity=".18" stroke-width="1.2" stroke-dasharray="28 14 4 14"/>
          <path d="M110 6v14M110 200v14M6 110h14M200 110h14" stroke="#f4f6fb" stroke-opacity=".28" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <svg class="opening-ball" viewBox="0 0 120 120" fill="none">
          <defs>
            <radialGradient id="core-flare" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fffdf5"/>
              <stop offset="38%" stop-color="#ffb830"/>
              <stop offset="72%" stop-color="#ff4738"/>
              <stop offset="100%" stop-color="#ff4738" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="shell-upper" x1="12" y1="12" x2="108" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ff5a47"/>
              <stop offset="100%" stop-color="#b81d13"/>
            </linearGradient>
            <linearGradient id="shell-lower" x1="12" y1="60" x2="108" y2="108" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#232838"/>
              <stop offset="100%" stop-color="#0d1018"/>
            </linearGradient>
          </defs>
          <circle class="opening-light" cx="60" cy="60" r="38" fill="url(#core-flare)"/>
          <circle class="opening-shockwave" cx="60" cy="60" r="24" stroke="#ffb830" stroke-width="2"/>
          <g class="shell-top">
            <path d="M12 60a48 48 0 0 1 96 0H12Z" fill="url(#shell-upper)" stroke="#f6f7fb" stroke-width="4.5" stroke-linejoin="round"/>
            <path d="M26 42A38 38 0 0 1 78 22" stroke="#ffffff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
          </g>
          <g class="shell-bottom">
            <path d="M108 60a48 48 0 0 1-96 0h96Z" fill="url(#shell-lower)" stroke="#f6f7fb" stroke-width="4.5" stroke-linejoin="round"/>
            <path d="M36 92a36 36 0 0 0 48 0" stroke="#38bdf8" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
          </g>
          <g class="opening-latch">
            <circle cx="60" cy="60" r="15" fill="#08090d" stroke="#f6f7fb" stroke-width="4.5"/>
            <circle cx="60" cy="60" r="6.5" fill="#ff4738"/>
            <circle cx="58" cy="58" r="2" fill="#fff"/>
          </g>
        </svg>
      </div>
      <div class="opening-brand-lockup">
        <strong class="opening-wordmark">illke</strong>
        <span class="opening-tagline">ATLAS &amp; LABORATÓRIO COMPETITIVO</span>
      </div>
    </div>
    <button bind:this={skip} class="opening-skip" onclick={finish}>
      <span>Pular abertura</span>
      <kbd aria-hidden="true">ESC ↗</kbd>
      <span class="opening-progress" aria-hidden="true"></span>
    </button>
  </dialog>
{/if}

<style>
  .opening {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border: 0;
    margin: 0;
    padding: 0;
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: radial-gradient(circle at 50% 45%, #171826 0%, #07080c 72%);
    color: #f4f6fb;
    display: grid;
    place-items: center;
    overflow: hidden;
    animation: opening-away .38s cubic-bezier(.4, 0, .2, 1) 2.48s forwards;
  }
  .opening-grid-bg {
    position: absolute;
    inset: -20%;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(circle at 50% 50%, #000 25%, transparent 75%);
    animation: grid-drift 3s ease-out both;
    pointer-events: none;
  }
  .opening-hud-corners {
    position: absolute;
    inset: max(20px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
    pointer-events: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    color: rgba(244, 246, 251, 0.42);
  }
  .hud-tl { position: absolute; top: 0; left: 0; }
  .hud-tr { position: absolute; top: 0; right: 0; }
  .hud-bl { position: absolute; bottom: 0; left: 0; }
  .opening-scene {
    position: relative;
    text-align: center;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 28px;
  }
  .opening-stage {
    position: relative;
    width: clamp(160px, 28vw, 230px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
  }
  .opening-orbit {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    animation: orbit-spin 2.6s cubic-bezier(.22, 1, .36, 1) both;
  }
  .opening-ball {
    width: 68%;
    overflow: visible;
    animation: ball-turn 2.5s cubic-bezier(.45, 0, .2, 1) both;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 18px 40px rgba(255, 71, 56, 0.28));
  }
  .shell-top, .shell-bottom, .opening-latch { transform-origin: 60px 60px; }
  .shell-top { animation: shell-open-top 2.5s ease-in-out both; }
  .shell-bottom { animation: shell-open-bottom 2.5s ease-in-out both; }
  .opening-latch { animation: latch-open 2.5s ease-in-out both; }
  .opening-light {
    filter: blur(6px);
    animation: light-open 2.5s ease-in-out both;
    transform-origin: 60px 60px;
  }
  .opening-shockwave {
    transform-origin: 60px 60px;
    animation: shockwave-pulse 2.5s ease-out both;
  }
  .opening-halo {
    position: absolute;
    top: -30px;
    left: 50%;
    width: 420px;
    height: 320px;
    transform: translateX(-50%);
    background: radial-gradient(ellipse, rgba(255, 71, 56, 0.22), rgba(245, 184, 46, 0.08) 45%, transparent 70%);
    filter: blur(18px);
    pointer-events: none;
  }
  .opening-brand-lockup {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }
  .opening-wordmark {
    font-family: Barlow, system-ui, sans-serif;
    font-size: clamp(52px, 8vw, 68px);
    font-weight: 800;
    letter-spacing: -0.06em;
    line-height: 0.95;
    background: linear-gradient(135deg, #ffffff 30%, #ffd6a5 70%, #ff5a47 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: wordmark-arrive .65s cubic-bezier(.16, 1, .3, 1) .2s both;
  }
  .opening-tagline {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    letter-spacing: 0.22em;
    color: rgba(244, 246, 251, 0.62);
    animation: wordmark-arrive .7s cubic-bezier(.16, 1, .3, 1) .36s both;
  }
  .opening-skip {
    position: absolute;
    right: max(24px, env(safe-area-inset-right));
    bottom: max(24px, env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(18, 20, 30, 0.82);
    backdrop-filter: blur(12px);
    color: #f4f6fb;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    transition: border-color .2s, transform .2s;
  }
  .opening-skip:hover {
    border-color: #ff4738;
    transform: translateY(-2px);
  }
  .opening-skip kbd {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(244, 246, 251, 0.72);
  }
  .opening-progress {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    background: linear-gradient(90deg, #ff4738, #f5b82e);
    animation: skip-progress 2.5s linear both;
  }
  .opening-skip:focus-visible { outline: 3px solid #ff4738; outline-offset: 4px; }
  @keyframes grid-drift { from { transform: scale(1.12); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes orbit-spin { 0% { transform: rotate(-120deg) scale(.72); opacity: 0; } 25% { opacity: 1; } 100% { transform: rotate(90deg) scale(1); opacity: .85; } }
  @keyframes ball-turn { 0% { transform: rotate(-85deg) scale(.6); opacity: 0; } 18% { opacity: 1; transform: rotate(155deg) scale(1); } 32%, 65% { transform: rotate(335deg) scale(1); } 90%, 100% { transform: rotate(695deg) scale(1); } }
  @keyframes shell-open-top { 0%, 30%, 70%, 100% { transform: translateY(0) rotate(0); } 44%, 57% { transform: translateY(-20px) rotate(-14deg); } }
  @keyframes shell-open-bottom { 0%, 30%, 70%, 100% { transform: translateY(0) rotate(0); } 44%, 57% { transform: translateY(20px) rotate(14deg); } }
  @keyframes latch-open { 0%, 30%, 70%, 100% { opacity: 1; transform: scale(1); } 43%, 57% { opacity: .2; transform: scale(.45); } }
  @keyframes light-open { 0%, 28%, 75%, 100% { opacity: 0; transform: scale(.35); } 45%, 57% { opacity: .95; transform: scale(1.25); } }
  @keyframes shockwave-pulse { 0%, 36% { opacity: 0; transform: scale(.4); } 46% { opacity: .9; transform: scale(1.45); } 68%, 100% { opacity: 0; transform: scale(2.1); } }
  @keyframes wordmark-arrive { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes skip-progress { from { width: 0%; } to { width: 100%; } }
  @keyframes opening-away { to { opacity: 0; visibility: hidden; pointer-events: none; } }
  @media (prefers-reduced-motion: reduce) { .opening { display: none; } .opening * { animation: none !important; } }
</style>
