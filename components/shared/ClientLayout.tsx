"use client";

import { usePathname } from "next/navigation";
import { MainSidebar } from "./MainSidebar";
import AIChatbot from "./AIChatbot";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    if (isLoginPage) {
        return (
            <div className="w-full min-h-screen bg-background">
                {children}
            </div>
        );
    }

    return (
        <div className="flex w-full min-h-screen bg-[#FAFAF8] overflow-x-hidden">
            <MainSidebar />
            <main className="flex-1 min-w-0 pt-16 md:pt-0 print:ml-0">
                {children}
            </main>
            <AIChatbot />
        </div>
    );
}
