"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {
    Plus,
    X,
    Calendar as CalendarIcon,
    MapPin,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    obtenerEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    getColorPorTipo,
    Evento
} from "@/lib/calendario";

export default function CalendarPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<Evento> | null>(null);
    const calendarRef = useRef<any>(null);
    const [currentView, setCurrentView] = useState("dayGridMonth");

    // Form states
    const [formData, setFormData] = useState<Partial<Evento>>({
        titulo: '',
        tipo_evento: 'evento',
        fecha_inicio: '',
        fecha_fin: '',
        prioridad: 'normal',
        ubicacion: '',
        descripcion: ''
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        const now = new Date();
        const data = await obtenerEventos(now.getMonth() + 1, now.getFullYear());

        const formatted = data.map(e => ({
            id: e.id,
            title: e.titulo,
            start: e.fecha_inicio,
            end: e.fecha_fin,
            backgroundColor: e.color_hex || getColorPorTipo(e.tipo_evento),
            borderColor: 'transparent',
            extendedProps: { ...e }
        }));

        setEvents(formatted);
        setLoading(false);
    };

    const handleDateSelect = (selectInfo: any) => {
        setFormData({
            titulo: '',
            tipo_evento: 'evento',
            fecha_inicio: selectInfo.startStr.includes('T') ? selectInfo.startStr.slice(0, 16) : `${selectInfo.startStr}T09:00`,
            fecha_fin: selectInfo.endStr.includes('T') ? selectInfo.endStr.slice(0, 16) : `${selectInfo.startStr}T10:00`,
            prioridad: 'normal',
            ubicacion: '',
            descripcion: ''
        });
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const e = clickInfo.event.extendedProps;
        setFormData({
            ...e,
            fecha_inicio: e.fecha_inicio.slice(0, 16),
            fecha_fin: e.fecha_fin.slice(0, 16)
        });
        setSelectedEvent(e);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!formData.titulo || formData.titulo.length < 3) {
            alert("El título debe tener al menos 3 caracteres.");
            return;
        }

        if (new Date(formData.fecha_fin!) <= new Date(formData.fecha_inicio!)) {
            alert("La fecha de fin debe ser posterior a la de inicio.");
            return;
        }

        if (formData.tipo_evento === 'tarea') {
            // Tareas suelen ser puntuales, pero respetamos el ISO
        }

        if (selectedEvent?.id) {
            await actualizarEvento(selectedEvent.id, formData);
        } else {
            await crearEvento(formData);
        }

        setIsModalOpen(false);
        loadEvents();
    };

    const handleDelete = async () => {
        if (selectedEvent?.id && confirm('¿Eliminar este evento?')) {
            await eliminarEvento(selectedEvent.id);
            setIsModalOpen(false);
            loadEvents();
        }
    };

    const handlePrev = () => calendarRef.current.getApi().prev();
    const handleNext = () => calendarRef.current.getApi().next();
    const changeView = (view: string) => {
        calendarRef.current.getApi().changeView(view);
        setCurrentView(view);
    };

    const renderMiniCalendar = () => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const padding = Array.from({ length: (firstDay + 6) % 7 }, (_, i) => null);

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Enero 2026</span>
                    <div className="flex gap-2">
                        <ChevronLeft size={14} className="text-charcoal/20 cursor-pointer" />
                        <ChevronRight size={14} className="text-charcoal/20 cursor-pointer" />
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-charcoal/20 uppercase text-center mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {padding.map((_, i) => <div key={`p-${i}`} className="h-4" />)}
                    {days.map(d => (
                        <div key={d} className={cn(
                            "h-6 w-6 flex items-center justify-center text-[9px] font-bold cursor-pointer rounded-full",
                            d === now.getDate() ? "bg-primary text-white" : "text-charcoal hover:bg-[#F1F1EF]"
                        )}>
                            {d}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-[#FAFAF8] overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* Notion Sidebar */}
                <aside className="w-72 border-r-premium bg-white flex flex-col p-6 space-y-10 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-display uppercase tracking-tight">Personal</h2>
                        <button className="text-charcoal/20 hover:text-charcoal"><Plus size={16} /></button>
                    </div>

                    {renderMiniCalendar()}

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal/40">Calendarios</h4>
                            <div className="space-y-3">
                                {[
                                    { label: "EVENTO", color: "bg-primary" },
                                    { label: "HORARIOS", color: "bg-[#B8844D]" },
                                    { label: "PERSONAL", color: "bg-success" }
                                ].map(c => (
                                    <div key={c.label} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={cn("w-2.5 h-2.5 rounded-full", c.color)} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/60 group-hover:text-charcoal">{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal/40">My Space</h4>
                            <div className="space-y-3">
                                {[
                                    { label: "Tareas y Examenes", icon: <Filter size={12} /> },
                                    { label: "Task", icon: <Filter size={12} /> },
                                    { label: "UniversityGpt", icon: <Filter size={12} /> }
                                ].map(c => (
                                    <div key={c.label} className="flex items-center gap-3 cursor-pointer group">
                                        <span className="text-charcoal/20">{c.icon}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/60 group-hover:text-charcoal">{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-charcoal/30 hover:text-charcoal transition-colors pt-4 border-t-premium">
                        <Plus size={12} /> Agregar cuenta de calenda...
                    </button>
                </aside>

                <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {/* Inner Header matching the image */}
                    <div className="p-4 border-b-premium flex items-center justify-between bg-white z-20">
                        <div className="flex items-center gap-6">
                            <h3 className="text-xl font-display uppercase tracking-tight">Enero 2026</h3>
                            <div className="flex bg-[#F1F1EF] p-1 border-premium rounded-sm">
                                {['Mes', 'Semana', 'Día'].map((label, idx) => {
                                    const views = ["dayGridMonth", "timeGridWeek", "timeGridDay"];
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => changeView(views[idx])}
                                            className={cn(
                                                "px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-sm transition-all",
                                                currentView === views[idx] ? "bg-white shadow-sm text-charcoal" : "text-charcoal/40"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handlePrev} className="p-2 hover:bg-[#F1F1EF] rounded-sm transition-colors text-charcoal/40"><ChevronLeft size={16} /></button>
                            <button onClick={() => calendarRef.current.getApi().today()} className="px-4 py-1.5 border-premium text-[8px] font-bold uppercase tracking-widest hover:bg-[#F1F1EF]">Hoy</button>
                            <button onClick={handleNext} className="p-2 hover:bg-[#F1F1EF] rounded-sm transition-colors text-charcoal/40"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div className="flex-1 bg-white overflow-hidden p-6 relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 z-30 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                <Loader2 className="w-8 h-8 text-[#704A38] animate-spin mb-4" />
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Cargando base de datos...</p>
                            </div>
                        )}
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={false}
                            events={events}
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            locale="es"
                            firstDay={1}
                            height="100%"
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                        />
                    </div>
                </main>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-[#2C2C2A]/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border-[1.5px] border-[#2C2C2A] w-full max-w-lg relative z-10 shadow-[24px_24px_0px_0px_rgba(44,44,42,0.15)]"
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="p-8 border-b-[1.5px] border-[#2C2C2A] bg-[#2C2C2A] text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center">
                                            <CalendarIcon size={20} />
                                        </div>
                                        <h3 className="text-xl font-display uppercase tracking-tight">
                                            {selectedEvent?.id ? 'Detalles del Evento' : 'Nuevo Registro'}
                                        </h3>
                                    </div>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20} /></button>
                                </div>

                                <div className="p-10 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Tipo de Registro</label>
                                            <select
                                                value={formData.tipo_evento}
                                                onChange={e => setFormData({ ...formData, tipo_evento: e.target.value as any })}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#704A38] transition-colors appearance-none"
                                            >
                                                <option value="evento">Evento</option>
                                                <option value="tarea">Tarea</option>
                                                <option value="recordatorio">Recordatorio</option>
                                                <option value="turno">Turno</option>
                                                <option value="festivo">Festivo</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Prioridad</label>
                                            <select
                                                value={formData.prioridad}
                                                onChange={e => setFormData({ ...formData, prioridad: e.target.value as any })}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#704A38] transition-colors appearance-none"
                                            >
                                                <option value="baja">Baja</option>
                                                <option value="normal">Normal</option>
                                                <option value="alta">Alta</option>
                                                <option value="urgente">Urgente</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Título del Evento *</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.titulo}
                                            onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                            className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-5 text-xs font-bold outline-none focus:border-[#704A38] transition-colors"
                                            placeholder="Título descriptivo..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Inicio *</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={formData.fecha_inicio}
                                                onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[10px] font-bold outline-none focus:border-[#704A38] transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Fin *</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={formData.fecha_fin}
                                                onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[10px] font-bold outline-none focus:border-[#704A38] transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Ubicación</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C2C2A]/20" size={14} />
                                            <input
                                                type="text"
                                                value={formData.ubicacion}
                                                onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 pl-12 pr-4 py-4 text-xs font-bold outline-none focus:border-[#704A38] transition-colors"
                                                placeholder="Link de reunión o sala..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t-[1.5px] border-[#2C2C2A]/10 flex gap-4">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-[#704A38] text-white py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all"
                                        >
                                            {selectedEvent?.id ? 'Actualizar Registro' : 'Confirmar Registro'}
                                        </button>
                                        {selectedEvent?.id && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="px-8 border-[1.5px] border-error text-error text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-error hover:text-white transition-all"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
