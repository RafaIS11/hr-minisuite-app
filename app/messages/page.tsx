"use client";

import React, { useState, useEffect } from "react";
import {
    MessageSquare,
    Send,
    User,
    CheckCircle2,
    Clock,
    Search,
    Inbox,
    Plus,
    MoreVertical,
    CheckCircle,
    Paperclip,
    FileText,
    Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Empleado {
    id: string;
    nombre: string;
    puesto: string;
}

interface Mensaje {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachment_url?: string;
    attachment_name?: string;
    created_at: string;
}

interface Tarea {
    id: string;
    title: string;
    description: string;
    status: string;
    due_date: string;
}

export default function MessagesPage() {
    const [employees, setEmployees] = useState<Empleado[]>([]);
    const [messages, setMessages] = useState<Mensaje[]>([]);
    const [tasks, setTasks] = useState<Tarea[]>([]);
    const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");
    const [currentUser, setCurrentUser] = useState<Empleado | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchEmployeesRecords = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: emps } = await supabase.from("empleados").select("id, nombre, puesto, email");

        if (emps) {
            setEmployees(emps);
            const current = emps.find(e => e.email === user?.email);
            if (current) {
                setCurrentUser(current);
            }
        }
    };

    useEffect(() => {
        async function init() {
            setLoading(true);
            await fetchEmployeesRecords();
            const { data: t } = await supabase.from("tareas").select("*").eq("status", "pendiente");
            if (t) setTasks(t);
            setLoading(false);
        }
        init();

        // Suscripción en tiempo real al directorio de empleados
        const employeesChannel = supabase
            .channel('directory_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'empleados' }, () => {
                fetchEmployeesRecords();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(employeesChannel);
        };
    }, []);

    const fetchMessages = async (receiverId: string) => {
        if (!currentUser) return;
        const { data } = await supabase
            .from("mensajes")
            .select("*")
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    useEffect(() => {
        if (selectedReceiverId) {
            fetchMessages(selectedReceiverId);
            const subscription = supabase
                .channel('mensajes_realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, () => {
                    fetchMessages(selectedReceiverId);
                })
                .subscribe();
            return () => { supabase.removeChannel(subscription); };
        }
    }, [selectedReceiverId]);

    const handleSendMessage = async (attachment?: { url: string; name: string }) => {
        if ((!newMessage.trim() && !attachment) || !selectedReceiverId || !currentUser) return;

        const messageToSend = newMessage;
        setNewMessage(""); // Clear immediately for fluidity
        setIsSending(true);

        const { error } = await supabase.from("mensajes").insert({
            sender_id: currentUser.id,
            receiver_id: selectedReceiverId,
            content: messageToSend,
            attachment_url: attachment?.url,
            attachment_name: attachment?.name
        });

        if (error) {
            alert("No se pudo enviar el mensaje: " + error.message);
            setNewMessage(messageToSend); // Restore if failed
        } else {
            fetchMessages(selectedReceiverId);
        }
        setIsSending(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setIsUploading(true);
        try {
            const timestamp = Date.now();
            const filePath = `chat/${currentUser.id}/${timestamp}_${file.name}`;

            const { data, error } = await supabase.storage
                .from('hr-documents')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('hr-documents')
                .getPublicUrl(filePath);

            await handleSendMessage({ url: publicUrl, name: file.name });
        } catch (error: any) {
            alert("Error al subir archivo: " + error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const selectedEmp = employees.find(e => e.id === selectedReceiverId);

    return (
        <div className="h-screen flex flex-col bg-[#FAFAF8]">
            <header className="p-8 border-b-premium bg-white flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Colaboración</p>
                    <h1 className="text-4xl font-display tracking-tight text-charcoal">Centro de Comunicación</h1>
                </div>
                <div className="flex bg-[#F1F1EF] p-1 border-premium rounded-sm">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={cn(
                            "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all",
                            activeTab === "chat" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal"
                        )}
                    >
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={cn(
                            "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all",
                            activeTab === "tasks" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal"
                        )}
                    >
                        Mi Inbox
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-80 border-r-premium bg-white flex flex-col">
                    <div className="p-4 border-b-premium">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/20" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full bg-[#F1F1EF] border-premium rounded-sm py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y-premium">
                        {activeTab === "chat" ? (
                            employees.filter(e => e.id !== currentUser?.id).map(emp => (
                                <button
                                    key={emp.id}
                                    onClick={() => setSelectedReceiverId(emp.id)}
                                    className={cn(
                                        "w-full p-6 text-left hover:bg-[#FAFAF8] transition-colors flex items-center gap-4 group",
                                        selectedReceiverId === emp.id && "bg-[#F1F1EF]"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border-premium flex items-center justify-center font-bold text-primary">
                                        {emp.nombre.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-charcoal truncate">{emp.nombre}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 truncate">{emp.puesto}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-charcoal/30">
                                <Inbox size={32} className="mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No hay tareas urgentes</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-[#F1F1EF]/30">
                    {activeTab === "chat" ? (
                        selectedReceiverId ? (
                            <>
                                <div className="p-6 border-b-premium bg-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#FAFAF8] border-premium flex items-center justify-center font-bold text-charcoal/40 text-[10px]">
                                            {selectedEmp?.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-charcoal">{selectedEmp?.nombre}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-success flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> En línea
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-charcoal/20 hover:text-charcoal transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                                            <p className="text-xs font-bold uppercase tracking-widest">No hay mensajes aún</p>
                                        </div>
                                    )}
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col max-w-[70%]",
                                                msg.sender_id === currentUser?.id ? "ml-auto items-end" : "mr-auto items-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-4 border-premium shadow-sm text-sm font-medium",
                                                msg.sender_id === currentUser?.id
                                                    ? "bg-primary text-white rounded-l-lg rounded-tr-lg"
                                                    : "bg-white text-charcoal rounded-r-lg rounded-tl-lg"
                                            )}>
                                                {msg.content}
                                                {msg.attachment_url && (
                                                    <div className={cn(
                                                        "mt-3 p-3 rounded-sm border-premium flex items-center gap-3",
                                                        msg.sender_id === currentUser?.id ? "bg-white/10" : "bg-black/5"
                                                    )}>
                                                        <FileText size={16} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-bold truncate">{msg.attachment_name}</p>
                                                        </div>
                                                        <a
                                                            href={msg.attachment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 hover:bg-black/10 rounded-full transition-colors"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-charcoal/30 mt-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-6 bg-white border-t-premium pr-24 relative">
                                    {!currentUser && (
                                        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                                            <p className="text-xs font-bold uppercase tracking-widest text-primary italic">
                                                ⚠️ Debes configurar tu perfil en "Ajustes" para empezar a chatear.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="p-3 border-premium text-charcoal/40 hover:text-charcoal transition-colors rounded-sm"
                                        >
                                            {isUploading ? <Clock className="animate-spin" size={20} /> : <Paperclip size={20} />}
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Escribe un mensaje..."
                                            className="flex-1 bg-[#FAFAF8] border-premium rounded-sm px-6 py-3 text-sm font-medium focus:outline-none focus:border-charcoal transition-colors"
                                        />
                                        <button
                                            onClick={() => handleSendMessage()}
                                            disabled={isSending || !newMessage.trim()}
                                            className="bg-charcoal text-white p-3 rounded-sm hover:translate-y-[-2px] transition-transform shadow-sm disabled:opacity-20"
                                        >
                                            {isSending ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 bg-white border-premium rounded-full swiss-shadow flex items-center justify-center">
                                    <MessageSquare size={32} className="text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-display text-charcoal">Selecciona una conversación</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Busca a un compañero para empezar a chatear</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                            {tasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white border-premium swiss-shadow p-8 space-y-6 relative group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary italic">Asignada</p>
                                            <h3 className="text-xl font-display">{task.title}</h3>
                                        </div>
                                        <button className="text-charcoal/20 hover:text-success transition-colors">
                                            <CheckCircle size={24} />
                                        </button>
                                    </div>
                                    <p className="text-sm font-medium text-charcoal/60 leading-relaxed italic line-clamp-3">
                                        "{task.description}"
                                    </p>
                                    <div className="pt-6 border-t-premium flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">
                                            <Clock size={12} />
                                            <span>Vence: {task.due_date}</span>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[1, 2].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-premium bg-[#F1F1EF] flex items-center justify-center text-[8px] font-bold">
                                                    U{i}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
