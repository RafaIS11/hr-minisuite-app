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
    BarChart3,
    LogOut,
    Settings,
    User
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
    { label: "Panel", href: "/", icon: LayoutDashboard },
    { label: "Mensajes", href: "/messages", icon: Users },
    { label: "Horario", href: "/time", icon: Clock },
    { label: "Nóminas", href: "/payroll", icon: CreditCard },
    { label: "Docs", href: "/docs", icon: FileText },
    { label: "Configuración", href: "/settings", icon: Settings },
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
        <aside className="fixed left-0 top-0 h-screen w-[260px] border-r-premium bg-surface flex flex-col z-50 print:hidden">
            {/* Logo Section */}
            <div className="p-8">
                <Link href="/" className="flex items-center group">
                    <motion.div
                        className="relative h-8 w-auto rotate-3 group-hover:rotate-0 transition-transform duration-200"
                        whileHover={{ scale: 1.02 }}
                    >
                        <img
                            src="/logo-wide.png"
                            alt="HR MiniSuite"
                            className="h-full w-auto object-contain"
                        />
                    </motion.div>
                </Link>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 text-sm font-medium border-[1.5px] border-transparent",
                                    isActive
                                        ? "bg-primary text-white border-charcoal"
                                        : "text-charcoal/70 hover:bg-[#F1F1EF] hover:text-charcoal"
                                )}
                                whileHover={{ x: 4 }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Icon size={20} strokeWidth={1.5} />
                                </motion.div>
                                <span>{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t-premium bg-[#F1F1EF]/30 mt-auto">
                <div className="flex items-center gap-3 px-4 py-3 rounded-sm group cursor-pointer hover:bg-surface border-[1.5px] border-transparent hover:border-charcoal transition-all duration-200">
                    <Link href="/settings" className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border-premium flex items-center justify-center overflow-hidden">
                            <User className="text-primary" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal truncate">
                                {profile?.nombre || "Cargando..."}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase tracking-wider">
                                {profile?.cargo || "Empleado"}
                            </span>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-error/10 rounded-sm transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut size={16} className="text-charcoal/40 group-hover:text-error transition-colors" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
