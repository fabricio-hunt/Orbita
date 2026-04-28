import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orbita',
  description: 'Converse com uma IA que consulta dados reais da SimilarWeb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
