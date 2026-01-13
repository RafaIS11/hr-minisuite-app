"use client";

import React, { useState, useEffect } from "react";
import {
  HandCoins,
  CheckCircle2,
  TrendingUp,
  Calendar,
  ArrowRight,
  Search,
  Bell,
  Plus,
  Clock,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { KPICard } from "@/components/dashboard/KPICard";
import { PunchInWidget } from "@/components/dashboard/PunchInWidget";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [userStats, setUserStats] = useState({
    proximaNomina: 2450.00,
    tareasPendientes: 4,
    ingresosHoy: 112.50,
    objetivosCompletados: 85
  });

  return (
    <div className="p-12 space-y-12">
      {/* Header / Brand Identity */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-[1.5px] border-[#2C2C2A]">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-[#2C2C2A] mb-2">MI PANEL</h1>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#714A38]">Protocol 5 Agents Activated</span>
            <div className="h-[1.5px] w-12 bg-[#2C2C2A]/10" />
            <span className="text-[11px] font-bold text-[#2C2C2A]/40 uppercase tracking-widest">Enero 2026</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-12 h-12 rounded-sm border-[1.5px] border-[#2C2C2A] bg-white flex items-center justify-center hover:bg-[#F1F1EF] transition-all">
            <Bell size={20} />
          </button>
          <div className="h-12 px-6 bg-[#2C2C2A] text-white flex items-center gap-3 border-[1.5px] border-[#2C2C2A] shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)]">
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Nueva Solicitud</span>
          </div>
        </div>
      </header>

      {/* Core Metrics - Restricted to the 3 Keys */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 1. Salary */}
        <div className="bg-white p-8 border-[1.5px] border-[#2C2C2A] shadow-[8px_8px_0px_0px_rgba(113,74,56,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HandCoins size={64} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]/40 mb-1">Mi Sueldo (Bruto Mes)</p>
          <h2 className="text-4xl font-black text-[#714A38] tabular-nums">€{userStats.proximaNomina.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-[#4A7C59] bg-[#4A7C59]/10 w-fit px-2 py-1 rounded-sm uppercase tracking-widest">
            <TrendingUp size={12} /> +2.4% vs dic
          </div>
        </div>

        {/* 2. Tasks */}
        <div className="bg-white p-8 border-[1.5px] border-[#2C2C2A] shadow-[8px_8px_0px_0px_rgba(113,74,56,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={64} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]/40 mb-1">Tareas Pendientes</p>
          <h2 className="text-4xl font-black text-[#2C2C2A] tabular-nums">{userStats.tareasPendientes}</h2>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-2 bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 overflow-hidden">
              <div className="h-full bg-[#714A38] w-[65%]" />
            </div>
            <span className="text-[10px] font-black uppercase">65%</span>
          </div>
        </div>

        {/* 3. Daily Stats */}
        <div className="bg-[#714A38] p-8 border-[1.5px] border-[#2C2C2A] text-white shadow-[8px_8px_0px_0px_rgba(44,44,42,0.1)] relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Previsión del Día</p>
          <h2 className="text-4xl font-black tabular-nums">€{userStats.ingresosHoy.toFixed(2)}</h2>
          <p className="mt-6 text-[9px] font-bold uppercase tracking-widest text-white/30 italic">Basado en jornada actual...</p>
        </div>
      </div>

      {/* Schedule Section - Main Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        {/* PunchInWidget Center Stage */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1.5px] bg-[#714A38]" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#2C2C2A]">REGISTRO DE JORNADA</h3>
          </div>
          <div className="bg-white p-2 border-[1.5px] border-[#2C2C2A] shadow-[12px_12px_0px_0px_rgba(44,44,42,0.05)]">
            <PunchInWidget />
          </div>
        </div>

        {/* Next Events / Inbox Summary */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1.5px] bg-[#714A38]" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#2C2C2A]">PRÓXIMAMENTE</h3>
          </div>
          <div className="space-y-4">
            {[
              { title: "Revisión Objetivos Q1", time: "Mañana, 09:00", type: "Event" },
              { title: "Entrega Nómina Enero", time: "25 de Enero", type: "Admin" }
            ].map((item, i) => (
              <div key={i} className="bg-[#FAFAF8] p-6 border-[1.5px] border-[#2C2C2A] group hover:bg-white transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#714A38] mb-1">{item.type}</p>
                    <h4 className="text-sm font-bold text-[#2C2C2A]">{item.title}</h4>
                    <p className="text-[11px] text-[#2C2C2A]/40 mt-1 flex items-center gap-2">
                      <Calendar size={12} /> {item.time}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#2C2C2A]/20 group-hover:text-[#714A38] transition-colors" />
                </div>
              </div>
            ))}
            <div className="bg-[#2C2C2A] p-6 border-[1.5px] border-[#2C2C2A] text-white flex items-center justify-between group cursor-pointer hover:bg-[#714A38] transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-sm">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Centro de Mensajes</p>
                  <p className="text-[9px] font-bold text-white/40">2 notificaciones nuevas</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-[1.5px] border-white/20 flex items-center justify-center group-hover:border-white transition-all">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
