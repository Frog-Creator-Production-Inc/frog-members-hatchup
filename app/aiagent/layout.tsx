import { Metadata } from 'next';
import Layout from '@/app/components/layout';

export const metadata: Metadata = {
  title: 'AIアシスタント | Frog Members',
  description: 'カナダのビザ・留学・海外就職に関する質問に、AIがお答えします。実際の体験談や公式情報を元に、あなたの疑問を解決します。',
};

export default function AIAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
} 