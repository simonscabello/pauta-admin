/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Build sem o endereço da API falha aqui, e não no navegador: o admin
  // publicado falando com o endereço errado é o defeito que ninguém vê.
  if (command === 'build' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL) {
    throw new Error('Defina VITE_API_BASE_URL para o build (ver .env.example).')
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5174, strictPort: true },
    test: { environment: 'jsdom' },
  }
})
