import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAdminShortcut } from "@/hooks/useAdminShortcut";

export default function Layout({ children }: { children: ReactNode }) {
  useAdminShortcut();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
