import type { Metadata } from "next";
import Layout from "@/app/components/layout";

export const metadata: Metadata = {
  title: "イベント | Frog Members",
  description: "Frogが提供、または主催するイベント情報をご覧いただけます。",
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      {children}
    </Layout>
  );
} 