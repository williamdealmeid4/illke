import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
export default defineConfig({ plugins:[sveltekit()], optimizeDeps:{include:['jspdf','@lucide/svelte']}, server:{port:5186,strictPort:true,proxy:{'/auth':'http://127.0.0.1:8000','/assets':'http://127.0.0.1:8000'}} });
