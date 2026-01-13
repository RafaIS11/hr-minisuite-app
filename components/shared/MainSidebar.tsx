"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Clock,
    CreditCard,
    FileText,
    Settings,
    User,
    LogOut,
    ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
    { label: "Panel", href: "/", icon: LayoutDashboard },
    { label: "Mensajes", href: "/messages", icon: Users },
    { label: "Horario", href: "/time", icon: Clock },
    { label: "Nóminas", href: "/payroll", icon: CreditCard },
    { label: "Archivos", href: "/docs", icon: FileText },
    { label: "Cuenta", href: "/settings", icon: Settings },
];

export function MainSidebar() {
    const pathname = usePathname();
    const [profile, setProfile] = React.useState<{ nombre: string; cargo: string } | null>(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: emp } = await supabase
                    .from("empleados")
                    .select("nombre, cargo")
                    .eq("email", user.email)
                    .maybeSingle();

                if (emp) {
                    setProfile(emp);
                } else {
                    setProfile({ nombre: user.email?.split('@')[0] || "Usuario", cargo: "Empleado" });
                }
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] border-r-[1.5px] border-[#2C2C2A] bg-[#FAFAF8] flex flex-col z-50 print:hidden overflow-hidden">
            {/* Brand Section */}
            <div className="p-8 border-b-[1.5px] border-[#2C2C2A]/10">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-[#714A38] rounded-sm flex items-center justify-center border-[1.5px] border-[#2C2C2A] rotate-3 group-hover:rotate-0 transition-transform">
                        <span className="text-white font-black text-xl">H</span>
                    </div>
                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]">HR MiniSuite</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse" />
                            <span className="text-[9px] font-bold text-[#2C2C2A]/40 uppercase tracking-widest">Protocol S2</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-sm transition-all duration-200 border-[1.5px]",
                                    isActive
                                        ? "bg-[#714A38] text-white border-[#2C2C2A] shadow-[4px_4px_0px_0px_rgba(44,42,42,0.1)]"
                                        : "text-[#2C2C2A]/60 border-transparent hover:bg-[#F1F1EF] hover:border-[#2C2C2A]/10"
                                )}
                                whileHover={{ x: 4 }}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                                <span className={cn("text-[11px] font-black uppercase tracking-widest", isActive ? "opacity-100" : "opacity-60")}>
                                    {item.label}
                                </span>
                                {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile - Deeply Integrated Swiss Look */}
            <div className="p-6 border-t-[1.5px] border-[#2C2C2A] bg-white">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm border-[1.5px] border-[#2C2C2A] bg-[#FAFAF8] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(44,42,42,0.05)] overflow-hidden">
                        <User size={20} className="text-[#714A38]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#2C2C2A] truncate">
                            {profile?.nombre || "Cargando..."}
                        </p>
                        <p className="text-[9px] font-bold text-[#714A38] uppercase tracking-wider mt-0.5">
                            {profile?.cargo || "Empleado"}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-6">
                    <Link href="/settings" className="flex items-center justify-center py-2 bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A] text-[9px] font-black uppercase tracking-widest hover:bg-[#2C2C2A] hover:text-white transition-all">
                        Perfil
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center py-2 bg-white border-[1.5px] border-[#2C2C2A] text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-600 transition-all">
                        Salir
                    </button>
                </div>
            </div>
        </aside>
    );
}
