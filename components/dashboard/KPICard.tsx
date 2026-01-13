"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string;
    trend: number;
    icon: LucideIcon;
}

export function KPICard({ title, value, trend, icon: Icon }: KPICardProps) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-surface p-6 swiss-shadow transition-transform duration-200"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-charcoal/60 mb-1">{title}</p>
                    <h3 className="font-display text-3xl tracking-tight text-charcoal">{value}</h3>
                </div>
                <div className="p-2 bg-[#F1F1EF] rounded-sm border-premium">
                    <Icon size={20} className="text-primary" strokeWidth={1.5} />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded",
                    trend >= 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"
                )}>
                    {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
                <span className="text-xs text-charcoal/40 font-medium">vs último mes</span>
            </div>
        </motion.div>
    );
}
