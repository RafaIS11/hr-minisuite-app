"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    User,
    Bot,
    Calendar,
    CheckSquare,
    Check,
    ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    action?: any;
}

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    useEffect(() => {
        // Cargar empleado al inicio
        async function loadEmployee() {
            const { data } = await supabase.from("empleados").select("id").eq('email', 'rafa@hr-minisuite.com').single();
            setEmployee(data);
        }
        loadEmployee();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    employeeId: employee?.id
                })
            });
            const data = await response.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.text,
                action: data.action
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Error al conectar con la central de IA."
            }]);
        }
        setLoading(false);
    };

    const executeAction = async (msgIndex: number) => {
        const msg = messages[msgIndex];
        if (!msg.action || !msg.action.detected) return;

        // Simulación de ejecución de acción
        // En un entorno real llamaría a una función de Supabase o API
        setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[msgIndex] = {
                ...msg,
                action: { ...msg.action, executed: true }
            };
            return newMsgs;
        });
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-[100] bg-charcoal text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
            >
                <div className="relative">
                    <MessageSquare size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-charcoal animate-pulse" />
                </div>
                <div className="absolute right-full mr-4 bg-white text-charcoal px-4 py-2 rounded-sm border-premium text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap swiss-shadow">
                    ¿En qué puedo ayudarte?
                </div>
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, transformOrigin: "bottom right" }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-24 right-8 w-[400px] h-[600px] bg-white border-premium shadow-2xl z-[110] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <header className="bg-charcoal p-6 text-white flex justify-between items-center border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-sm flex items-center justify-center border border-white/20">
                                    <Sparkles size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest font-display">Asistente HR</h3>
                                    <p className="text-[8px] font-bold text-success animate-pulse uppercase tracking-[0.2em]">En línea • Modo Acción</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform opacity-60 hover:opacity-100">
                                <X size={20} />
                            </button>
                        </header>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAF8] scroll-smooth">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4 px-8">
                                    <Bot size={48} className="text-charcoal/20" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">
                                        Soy tu asistente especializado de HR MiniSuite.
                                        Puedo responder dudas sobre la empresa o ayudarte a gestionar tareas y calendario.
                                    </p>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div key={i} className={cn(
                                    "flex items-start gap-3",
                                    m.role === "user" ? "flex-row-reverse" : ""
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-sm flex items-center justify-center border-premium shrink-0",
                                        m.role === "user" ? "bg-white" : "bg-charcoal text-white"
                                    )}>
                                        {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className="space-y-2 max-w-[80%]">
                                        <div className={cn(
                                            "p-4 border-premium text-xs leading-relaxed",
                                            m.role === "user" ? "bg-charcoal text-white" : "bg-white text-charcoal"
                                        )}>
                                            {m.content}
                                        </div>

                                        {/* Action Proposals */}
                                        {m.action && m.action.detected && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-primary/5 border border-primary/20 p-4 rounded-sm space-y-3"
                                            >
                                                <div className="flex items-center gap-2 text-primary">
                                                    {m.action.intent === "crear_evento" ? <Calendar size={12} /> : <CheckSquare size={12} />}
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sugerencia de Acción</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-charcoal/60 leading-tight">
                                                    {m.action.intent === "crear_evento"
                                                        ? `¿Quieres que cree el evento "${m.action.params.titulo}"?`
                                                        : `¿Añado "${m.action.params.titulo}" a tus tareas?`
                                                    }
                                                </p>
                                                {!m.action.executed ? (
                                                    <button
                                                        onClick={() => executeAction(i)}
                                                        className="w-full bg-primary text-white py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        Confirmar y Ejecutar <ArrowRight size={10} />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-success text-[9px] font-bold uppercase tracking-widest bg-success/10 p-2 justify-center">
                                                        <Check size={12} /> ¡Acción Ejecutada!
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-sm bg-charcoal text-white flex items-center justify-center animate-pulse">
                                        <Bot size={14} />
                                    </div>
                                    <div className="p-4 bg-white border-premium flex gap-1">
                                        <span className="w-1 h-1 bg-charcoal/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1 h-1 bg-charcoal/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1 h-1 bg-charcoal/20 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t-premium">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Pregunta algo..."
                                    className="w-full bg-[#F1F1EF] border-premium p-4 pr-12 text-xs font-bold focus:outline-none focus:border-charcoal transition-colors "
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal transition-transform active:scale-90 disabled:opacity-20"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-[8px] font-bold uppercase tracking-widest text-charcoal/20">Impulsado por Gemini 2.0 Flash</p>
                                <div className="flex gap-2">
                                    <div className="w-1 h-1 bg-success rounded-full" />
                                    <div className="w-1 h-1 bg-charcoal/10 rounded-full" />
                                    <div className="w-1 h-1 bg-charcoal/10 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
