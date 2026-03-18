# Neon Platformer (Next.js + Three.js)

Projeto de jogo de plataforma estilo **2D fake** usando:
- **Next.js (App Router)**
- **Three.js** com **OrthographicCamera**
- **EffectComposer + UnrealBloomPass**
- HUD/UI em HTML/CSS
- Save automático e ranking local via `localStorage`

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Controles

- **A / D** ou **← / →**: mover
- **W / ↑ / Espaço**: pular
- **P** ou **Esc**: pausar
- Mobile: botões touch na tela

## Arquivos principais

- `app/page.js` — lógica do jogo, Three.js, HUD e menus
- `app/globals.css` — estilo do jogo e UI
- `app/layout.js` — layout base

## Recursos implementados

- visual neon com bloom
- câmera ortográfica (2D fake)
- parallax de fundo
- 3 fases
- inimigos (patrol, hover, tank)
- moedas, hazards e portal
- HUD profissional
- telas de menu / pausa / game over / vitória / ranking / config
- save automático em `localStorage`
- ranking local
- controles mobile
