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
    Loader2,
    Clock,
    Video,
    FileText,
    Users as UsersIcon,
    Bell,
    Repeat,
    MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
    obtenerEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    getColorPorTipo,
    getCategoriaPorTipo,
    Evento
} from "@/lib/calendario";

const EVENT_TYPES = [
    { id: 'evento', label: 'Evento', color: '#704A38', cat: 'EVENTO' },
    { id: 'jornada', label: 'Jornada Laboral', color: '#B8844D', cat: 'HORARIOS' },
    { id: 'tarea', label: 'Tarea', color: '#2C2C2A', cat: 'EVENTO' },
    { id: 'cumpleaños', label: 'Cumpleaños', color: '#4A705B', cat: 'PERSONAL' },
    { id: 'recordatorio', label: 'Recordatorio', color: '#E67E22', cat: 'EVENTO' },
    { id: 'festivo', label: 'Festivo', color: '#A13D3D', cat: 'EVENTO' },
    { id: 'descanso', label: 'Descanso', color: '#95A5A6', cat: 'HORARIOS' },
];

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
        descripcion: '',
        todo_el_dia: false,
        recordatorio_minutos: 30,
        videoconferencia: ''
    });

    useEffect(() => {
        loadEvents();

        // Subscription for real-time updates
        const channel = supabase
            .channel('calendar_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendario_eventos' }, () => {
                loadEvents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();
            const data = await obtenerEventos(0, 0, emp?.id); // Fetches all for the user

            const formatted = data.map(e => ({
                id: e.id,
                title: e.titulo,
                start: e.fecha_inicio,
                end: e.fecha_fin,
                allDay: e.todo_el_dia,
                backgroundColor: e.color_hex || getColorPorTipo(e.tipo_evento),
                borderColor: 'transparent',
                extendedProps: { ...e }
            }));

            setEvents(formatted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (selectInfo: any) => {
        const start = selectInfo.startStr;
        const end = selectInfo.endStr;

        setFormData({
            titulo: '',
            tipo_evento: 'evento',
            fecha_inicio: start.includes('T') ? start.slice(0, 16) : `${start}T09:00`,
            fecha_fin: end.includes('T') ? end.slice(0, 16) : `${start}T10:00`,
            prioridad: 'normal',
            ubicacion: '',
            descripcion: '',
            todo_el_dia: selectInfo.allDay,
            recordatorio_minutos: 30
        });
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const e = clickInfo.event.extendedProps;
        setFormData({
            ...e,
            fecha_inicio: e.fecha_inicio?.slice(0, 16) || '',
            fecha_fin: e.fecha_fin?.slice(0, 16) || ''
        });
        setSelectedEvent(e);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.titulo) {
            alert("Por favor, ponle un título.");
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa");

            const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();

            if (selectedEvent?.id) {
                const { error } = await supabase
                    .from('calendario_eventos')
                    .update({
                        ...formData,
                        empleado_id: emp?.id,
                        color_hex: getColorPorTipo(formData.tipo_evento || 'evento'),
                        categoria: getCategoriaPorTipo(formData.tipo_evento || 'evento')
                    })
                    .eq('id', selectedEvent.id);
                if (error) throw error;
            } else {
                const result = await crearEvento({
                    ...formData,
                    empleado_id: emp?.id
                });
                if (!result) throw new Error("Error al crear el registro en la base de datos");
            }
            setIsModalOpen(false);
            await loadEvents();
        } catch (err: any) {
            console.error(err);
            alert("Error al guardar: " + (err.message || "Error desconocido"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (selectedEvent?.id && confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            setLoading(true);
            await eliminarEvento(selectedEvent.id);
            setIsModalOpen(false);
            await loadEvents();
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

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">{monthNames[now.getMonth()]} {now.getFullYear()}</span>
                    <div className="flex gap-2">
                        <ChevronLeft size={14} className="text-charcoal/20 cursor-pointer hover:text-charcoal" />
                        <ChevronRight size={14} className="text-charcoal/20 cursor-pointer hover:text-charcoal" />
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-charcoal/20 uppercase text-center mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {padding.map((_, i) => <div key={`p-${i}`} className="h-4" />)}
                    {days.map(d => (
                        <div key={d} className={cn(
                            "h-6 w-6 flex items-center justify-center text-[9px] font-bold cursor-pointer rounded-full transition-colors",
                            d === now.getDate() ? "bg-charcoal text-white" : "text-charcoal hover:bg-[#F1F1EF]"
                        )}>
                            {d}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex overflow-hidden lg:relative">
                    {/* Visual Sidebar Reference: uploaded_image_0 */}
                    <aside className="hidden lg:flex w-[280px] border-r-premium bg-white flex-col p-8 space-y-12 overflow-y-auto z-10">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/40">Calendarios</h2>
                                <Plus size={14} className="text-charcoal/20 cursor-pointer hover:text-charcoal" />
                            </div>
                            <div className="space-y-4 pt-4">
                                {[
                                    { label: "EVENTO", color: "bg-[#704A38]", count: events.filter(e => e.extendedProps.categoria === 'EVENTO').length },
                                    { label: "HORARIOS", color: "bg-[#B8844D]", count: events.filter(e => e.extendedProps.categoria === 'HORARIOS').length },
                                    { label: "PERSONAL", color: "bg-[#4A705B]", count: events.filter(e => e.extendedProps.categoria === 'PERSONAL').length }
                                ].map(c => (
                                    <div key={c.label} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-3 h-3 rounded-full shadow-sm", c.color)} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-charcoal/60 group-hover:text-charcoal transition-colors">
                                                {c.label}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-charcoal/20">{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {renderMiniCalendar()}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/40">My Space</h4>
                                <div className="space-y-4 pt-4">
                                    {[
                                        { label: "Tareas y Exámenes", icon: <Filter size={14} /> },
                                        { label: "Tasks", icon: <Filter size={14} /> },
                                        { label: "Recordatorios", icon: <Bell size={14} /> }
                                    ].map(c => (
                                        <div key={c.label} className="flex items-center gap-3 cursor-pointer group">
                                            <span className="text-charcoal/20 group-hover:text-primary transition-colors">{c.icon}</span>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-charcoal/60 group-hover:text-charcoal transition-colors">{c.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-charcoal/30 hover:text-charcoal transition-colors pt-8 mt-auto border-t-premium">
                            <Plus size={14} /> Agregar cuenta de calenda...
                        </button>
                    </aside>

                    <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
                        {/* Header */}
                        <div className="p-4 lg:p-6 border-b-premium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md z-20">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 w-full sm:w-auto">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary italic">Planificación</p>
                                    <h1 className="text-xl lg:text-2xl font-display uppercase tracking-tight text-charcoal leading-none">Enero 2026</h1>
                                </div>
                                <div className="flex bg-[#F1F1EF] p-1 border-premium rounded-sm overflow-x-auto max-w-full">
                                    {[
                                        { label: 'Mes', view: 'dayGridMonth' },
                                        { label: 'Sem.', view: 'timeGridWeek' },
                                        { label: 'Día', view: 'timeGridDay' },
                                        { label: 'Agnd', view: 'listWeek' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.label}
                                            onClick={() => changeView(tab.view)}
                                            className={cn(
                                                "px-3 lg:px-6 py-2 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all whitespace-nowrap",
                                                currentView === tab.view ? "bg-white shadow-md text-charcoal" : "text-charcoal/30 hover:text-charcoal"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <div className="flex items-center bg-[#F1F1EF] rounded-sm border-premium overflow-hidden">
                                    <button onClick={handlePrev} className="p-2 lg:p-3 hover:bg-white transition-colors text-charcoal/40 hover:text-charcoal"><ChevronLeft size={16} /></button>
                                    <div className="h-6 w-[1.5px] bg-charcoal/5" />
                                    <button onClick={() => calendarRef.current.getApi().today()} className="px-4 lg:px-6 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-white transition-colors">Hoy</button>
                                    <div className="h-6 w-[1.5px] bg-charcoal/5" />
                                    <button onClick={handleNext} className="p-2 lg:p-3 hover:bg-white transition-colors text-charcoal/40 hover:text-charcoal"><ChevronRight size={16} /></button>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormData({ ...formData, titulo: '', fecha_inicio: new Date().toISOString().slice(0, 16) });
                                        setSelectedEvent(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-charcoal text-white p-3 lg:px-6 lg:py-3 text-[9px] font-bold uppercase tracking-widest rounded-sm shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-3 shrink-0"
                                >
                                    <Plus size={14} /> <span className="hidden lg:inline">Nuevo Registro</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white overflow-hidden p-4 lg:p-8 relative">
                            {loading && (
                                <div className="absolute inset-0 bg-white/80 z-[30] flex flex-col items-center justify-center backdrop-blur-sm">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-charcoal/40">Sincronizando Calendario...</p>
                                </div>
                            )}
                            <div className="h-full premium-calendar">
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                                    initialView={typeof window !== 'undefined' && window.innerWidth < 1024 ? 'listWeek' : 'dayGridMonth'}
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
                                    eventTimeFormat={{
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        meridiem: false,
                                        hour12: false
                                    }}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Modal Reference: uploaded_image_1 */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#1e1e1e] border-premium w-full max-w-[480px] relative z-10 shadow-2xl rounded-xl overflow-hidden text-white/90"
                        >
                            <form onSubmit={handleSubmit}>
                                {/* Header matching image 1 */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1e1e1e]">
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={formData.tipo_evento}
                                            onChange={e => setFormData({ ...formData, tipo_evento: e.target.value as any })}
                                            className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:bg-white/20 transition-all"
                                        >
                                            {EVENT_TYPES.map(t => (
                                                <option key={t.id} value={t.id} className="bg-[#1e1e1e] text-white">
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronLeft size={16} className="rotate-[-90deg] text-white/40" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button type="button" className="text-white/40 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
                                    </div>
                                </div>

                                <div className="p-4 lg:p-8 space-y-8 max-h-[75vh] lg:max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Title Input */}
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        value={formData.titulo}
                                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                        className="w-full bg-white/5 border-none p-4 text-lg lg:text-xl font-bold rounded-lg outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                                        placeholder="Título del evento..."
                                    />

                                    <div className="space-y-6">
                                        {/* Date/Time Row */}
                                        <div className="flex items-start gap-4 group">
                                            <Clock className="mt-1 text-white/40 group-hover:text-primary transition-colors shrink-0" size={20} />
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                                    <div className="flex-1">
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.fecha_inicio}
                                                            onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                                            className="w-full bg-white/5 sm:bg-transparent border-none text-[13px] sm:text-sm font-medium outline-none p-2 sm:p-0 rounded-md cursor-pointer hover:text-white transition-colors"
                                                        />
                                                    </div>
                                                    <span className="text-white/20 hidden sm:inline">—</span>
                                                    <div className="flex-1">
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.fecha_fin}
                                                            onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                                                            className="w-full bg-white/5 sm:bg-transparent border-none text-[13px] sm:text-sm font-medium outline-none p-2 sm:p-0 rounded-md cursor-pointer hover:text-white transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <div className={cn(
                                                            "w-8 h-4 rounded-full relative transition-colors",
                                                            formData.todo_el_dia ? "bg-primary" : "bg-white/10"
                                                        )}>
                                                            <div className={cn(
                                                                "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                                                                formData.todo_el_dia ? "left-5" : "left-1"
                                                            )} />
                                                            <input
                                                                type="checkbox"
                                                                hidden
                                                                checked={formData.todo_el_dia}
                                                                onChange={e => setFormData({ ...formData, todo_el_dia: e.target.checked })}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-white/60 group-hover:text-white">Todo el día</span>
                                                    </label>
                                                    <div className="w-[1px] h-3 bg-white/10 mx-2" />
                                                    <button type="button" className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white">
                                                        <Repeat size={14} /> Repetir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Participants */}
                                        <div className="flex items-center gap-4 group">
                                            <UsersIcon className="text-white/40 group-hover:text-primary transition-colors" size={20} />
                                            <span className="text-sm font-medium text-white/40 hover:text-white cursor-pointer transition-colors">Participantes</span>
                                        </div>

                                        {/* Video/Meeting */}
                                        <div className="flex items-center gap-4 group">
                                            <Video className="text-white/40 group-hover:text-primary transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={formData.videoconferencia}
                                                onChange={e => setFormData({ ...formData, videoconferencia: e.target.value })}
                                                placeholder="Videoconferencia"
                                                className="bg-transparent border-none text-sm font-medium outline-none w-full placeholder:text-white/20"
                                            />
                                        </div>

                                        {/* AI Notebook Section */}
                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-primary" size={20} />
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Documentos y Anotador con IA</label>
                                            </div>
                                            <textarea
                                                value={formData.descripcion}
                                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                                placeholder="Escribe aquí tus notas o resumen de la IA..."
                                                rows={4}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm font-medium outline-none resize-none focus:bg-white/10 transition-all text-white/80 placeholder:text-white/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const mockAI = "Resumen IA: Se ha programado esta sesión para discutir los objetivos del Q1. Temas clave: Productividad, Bienestar y Crecimiento.";
                                                    setFormData({ ...formData, descripcion: (formData.descripcion ? formData.descripcion + "\n\n" : "") + mockAI });
                                                }}
                                                className="w-full py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-primary/30 transition-all"
                                            >
                                                Generar Resumen con IA
                                            </button>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-center gap-4 group">
                                            <MapPin className="text-white/40 group-hover:text-primary transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={formData.ubicacion}
                                                onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                                                placeholder="Ubicación"
                                                className="bg-transparent border-none text-sm font-medium outline-none w-full placeholder:text-white/20"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <textarea
                                                value={formData.descripcion}
                                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                                placeholder="Descripción"
                                                rows={3}
                                                className="w-full bg-transparent border-none text-sm font-medium outline-none resize-none placeholder:text-white/20"
                                            />
                                        </div>

                                        {/* Category/Indicator matching image 1 */}
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/5 group">
                                            <div className={cn(
                                                "w-4 h-4 rounded-sm shadow-sm transition-transform group-hover:scale-110",
                                                formData.tipo_evento === 'jornada' ? "bg-[#B8844D]" :
                                                    formData.tipo_evento === 'cumpleaños' ? "bg-[#4A705B]" :
                                                        "bg-[#704A38]"
                                            )} />
                                            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                                                {EVENT_TYPES.find(t => t.id === formData.tipo_evento)?.label}
                                            </span>
                                            <div className="flex-1" />
                                            <span className="text-[10px] font-medium text-white/40 italic">Visibilidad predeterminada</span>
                                        </div>

                                        {/* Reminders match image 1 */}
                                        <div className="flex items-center gap-4 group">
                                            <Bell className="text-white/40 group-hover:text-primary transition-colors" size={20} />
                                            <div className="flex items-center gap-2 text-xs font-medium text-white/40 group-hover:text-white">
                                                <select
                                                    value={formData.recordatorio_minutos}
                                                    onChange={e => setFormData({ ...formData, recordatorio_minutos: parseInt(e.target.value) })}
                                                    className="bg-transparent border-none outline-none cursor-pointer font-bold text-white/90"
                                                >
                                                    <option value="15" className="bg-charcoal">15 minutos</option>
                                                    <option value="30" className="bg-charcoal">30 minutos</option>
                                                    <option value="60" className="bg-charcoal">1 hora</option>
                                                    <option value="1440" className="bg-charcoal">1 día</option>
                                                </select>
                                                <span>Antes de</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 lg:p-8 border-t border-white/10 flex flex-col sm:flex-row gap-3 lg:gap-4 bg-[#1e1e1e]">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-primary text-white py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-3 order-1 sm:order-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : (selectedEvent?.id ? 'Actualizar' : 'Guardar Evento')}
                                    </button>
                                    {selectedEvent?.id && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="w-full sm:w-auto px-6 py-4 border border-white/10 text-white/40 hover:text-error hover:border-error transition-all rounded-lg text-xs font-bold uppercase order-2 sm:order-1"
                                        >
                                            Borrar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .premium-calendar .fc {
                    border: none;
                }
                .premium-calendar .fc-theme-standard td, 
                .premium-calendar .fc-theme-standard th {
                    border: 1px solid #F1F1EF !important;
                }
                .premium-calendar .fc-col-header-cell {
                    padding: 20px 0;
                    background: #FAFAF8;
                    border: none !important;
                }
                .premium-calendar .fc-col-header-cell-cushion {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: rgba(44, 44, 42, 0.3);
                }
                .premium-calendar .fc-day-number {
                    font-size: 11px;
                    font-weight: 700;
                    padding: 12px !important;
                    color: rgba(44, 44, 42, 0.4);
                }
                .premium-calendar .fc-day-today {
                    background: rgba(112, 74, 56, 0.02) !important;
                }
                .premium-calendar .fc-day-today .fc-daygrid-day-number {
                    color: var(--primary);
                    font-weight: 900;
                }
                .premium-calendar .fc-event {
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .premium-calendar .fc-event:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
