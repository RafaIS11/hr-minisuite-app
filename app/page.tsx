"use client";

import React, { useState, useEffect } from "react";
import {
  HandCoins,
  CheckCircle2,
  TrendingUp,
  Calendar,
  ArrowRight,
  Bell,
  Plus,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchDashboardStats, fetchUpcomingEvents, DashboardStats, UpcomingEvent } from "@/lib/dashboard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    proximaNomina: 0,
    tareasPendientes: 0,
    mensajesNuevos: 0,
    ingresosHoy: 0
  });
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const [dashboardStats, upcomingEvents] = await Promise.all([
            fetchDashboardStats(user.email),
            fetchUpcomingEvents(user.email)
          ]);
          setStats(dashboardStats);
          setEvents(upcomingEvents);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#714A38]" size={48} />
        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-30 animate-pulse">Sincronizando Panel Soberano...</p>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto">
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
          <div className="relative">
            <button className="w-12 h-12 rounded-sm border-[1.5px] border-[#2C2C2A] bg-white flex items-center justify-center hover:bg-[#F1F1EF] transition-all">
              <Bell size={20} />
            </button>
            {stats.mensajesNuevos > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-sm border-[1.5px] border-[#2C2C2A]">
                {stats.mensajesNuevos}
              </span>
            )}
          </div>
          <button className="h-12 px-6 bg-[#2C2C2A] text-white flex items-center gap-3 border-[1.5px] border-[#2C2C2A] shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)] hover:bg-[#714A38] transition-all">
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Nueva Solicitud</span>
          </button>
        </div>
      </header>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 1. Salary */}
        <div className="bg-white p-8 border-[1.5px] border-[#2C2C2A] shadow-[8px_8px_0px_0px_rgba(113,74,56,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HandCoins size={64} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]/40 mb-1">Mi Sueldo (Bruto Mes)</p>
          <h2 className="text-4xl font-black text-[#714A38] tabular-nums">€{stats.proximaNomina.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-[#4A7C59] bg-[#4A7C59]/10 w-fit px-2 py-1 rounded-sm uppercase tracking-widest">
            <TrendingUp size={12} /> Datos de Contrato Activo
          </div>
        </div>

        {/* 2. Tasks */}
        <div className="bg-white p-8 border-[1.5px] border-[#2C2C2A] shadow-[8px_8px_0px_0px_rgba(113,74,56,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={64} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]/40 mb-1">Tareas Pendientes</p>
          <h2 className="text-4xl font-black text-[#2C2C2A] tabular-nums">{stats.tareasPendientes}</h2>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-2 bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 overflow-hidden">
              <div
                className="h-full bg-[#714A38] transition-all duration-1000"
                style={{ width: stats.tareasPendientes > 0 ? '45%' : '100%' }}
              />
            </div>
            <span className="text-[10px] font-black uppercase">{stats.tareasPendientes > 0 ? 'En curso' : 'Todo al día'}</span>
          </div>
        </div>

        {/* 3. Daily Stats */}
        <div className="bg-[#714A38] p-8 border-[1.5px] border-[#2C2C2A] text-white shadow-[8px_8px_0px_0px_rgba(113,74,56,0.1)] relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Previsión del Día</p>
          <h2 className="text-4xl font-black tabular-nums">€{stats.ingresosHoy.toFixed(2)}</h2>
          <p className="mt-6 text-[9px] font-bold uppercase tracking-widest text-white/30 italic">Basado en salario contractual...</p>
        </div>
      </div>

      {/* Secondary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
        {/* Inbox Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1.5px] bg-[#714A38]" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#2C2C2A]">COMUNICACIONES</h3>
          </div>
          <div className="bg-[#2C2C2A] p-8 border-[1.5px] border-[#2C2C2A] text-white flex items-center justify-between group cursor-pointer hover:bg-[#714A38] transition-all shadow-[12px_12px_0px_0px_rgba(44,44,42,0.05)]">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-sm">
                <Bell size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Centro de Mensajes</p>
                <p className="text-[12px] font-bold text-white/40 mt-1">{stats.mensajesNuevos} mensajes nuevos</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border-[1.5px] border-white/20 flex items-center justify-center group-hover:border-white transition-all">
              <ArrowRight size={18} />
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1.5px] bg-[#714A38]" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#2C2C2A]">PRÓXIMAMENTE</h3>
          </div>
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((item) => (
                <div key={item.id} className="bg-white p-6 border-[1.5px] border-[#2C2C2A] group hover:bg-[#FAFAF8] transition-all cursor-pointer shadow-[6px_6px_0px_0px_rgba(44,44,42,0.02)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#714A38] mb-1">{item.tipo}</p>
                      <h4 className="text-sm font-bold text-[#2C2C2A]">{item.titulo}</h4>
                      <p className="text-[11px] text-[#2C2C2A]/40 mt-1 flex items-center gap-2">
                        <Calendar size={12} /> {new Date(item.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-[#2C2C2A]/20 group-hover:text-[#714A38] transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 border-[1.5px] border-dashed border-[#2C2C2A]/10 text-center rounded-sm bg-[#FAFAF8]/50">
                <p className="text-[10px] font-bold uppercase opacity-30 italic">No hay eventos próximos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
