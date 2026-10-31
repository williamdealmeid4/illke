<script>
  import {
    LayoutGrid, Swords, Shield, CloudSun, Orbit, HeartPulse, Wind, Shapes,
    CloudRain, Sun, Waves, Snowflake, Zap, Leaf, Flame, LogOut, Timer, Droplets,
    Bug, HandFist, Crosshair, Scissors, CircleDot, AudioLines, Gem, CircleDashed,
    HeartCrack, Moon, ScanEye, Smile, ShieldCheck, Feather, Mountain, Layers,
    Droplet, EarOff, Anchor, ShieldPlus, Eye, Skull, Sprout, Link, Shuffle, Ban,
    Laugh, Apple, Sunrise, Users, Fingerprint, Copy, VenetianMask, Package,
    Weight, Lightbulb, Wand, RefreshCw, Heart, CircleOff, ListOrdered, Puzzle,
  } from '@lucide/svelte';
  import { abilityMeta } from '$lib/abilities.js';
  let { entry = null, icon = null, size = 24, strokeWidth = 1.6 } = $props();
  const symbols = { LayoutGrid, Swords, Shield, CloudSun, Orbit, HeartPulse, Wind,
    Shapes, CloudRain, Sun, Waves, Snowflake, Zap, Leaf, Flame, LogOut, Timer,
    Droplets, Bug, HandFist, Crosshair, Scissors, CircleDot, AudioLines, Gem,
    CircleDashed, HeartCrack, Moon, ScanEye, Smile, ShieldCheck, Feather,
    Mountain, Layers, Droplet, EarOff, Anchor, ShieldPlus, Eye, Skull, Sprout,
    Link, Shuffle, Ban, Laugh, Apple, Sunrise, Users, Fingerprint, Copy,
    VenetianMask, Package, Weight, Lightbulb, Wand, RefreshCw, Heart, CircleOff,
    ListOrdered, Puzzle };
  let Symbol = $derived(symbols[icon || abilityMeta(entry).icon] || Puzzle);
</script>

<Symbol {size} {strokeWidth} aria-hidden="true" />
