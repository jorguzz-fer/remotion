# videos

Kit para produzir vídeos animados em código com [Remotion](https://www.remotion.dev) 4.0.524,
nos formatos vertical (1080x1920), horizontal (1920x1080) e quadrado (1080x1080).

```bash
npm install
npm run dev                               # Remotion Studio em http://localhost:3000
npm run render -- Exemplo-Vertical        # gera out/Exemplo-Vertical.mp4
npm run new-video -- meu-video --title "Meu vídeo"
npm run voiceover -- meu-video            # narração (voz do macOS; ElevenLabs com .env)
npm run transcribe -- public/meu-video/voiceover   # legendas
npm run lint && npm test && npm run smoke
RENDER_API_KEY=teste npm run api          # API de render local em http://localhost:3000
```

Convenções, estrutura e receitas de animação: [AGENTS.md](AGENTS.md).
Deploy no VPS com Coolify (Studio com senha + API de render): [docs/deploy-coolify.md](docs/deploy-coolify.md).
Design e plano: `docs/superpowers/`.
