export const metadata = {
  title: 'Neon Platformer 2D Fake',
  description: 'Jogo de plataforma em Next.js + Three.js (2D fake)'
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
