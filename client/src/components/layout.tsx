import { ReactNode } from "react";
import BottomNav from "./bottom-nav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
