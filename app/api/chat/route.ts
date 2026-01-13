import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    const { messages, employeeId } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_KEY;
    const lastMessage = messages[messages.length - 1].content;

    if (!apiKey) return NextResponse.json({ error: "Gemini API key not found" }, { status: 500 });

    try {
        // 1. Obtener contexto del empleado
        const { data: employeeData } = await supabase
            .from("empleados")
            .select("*")
            .eq("id", employeeId)
            .single();

        // 2. Obtener últimas nóminas y documentos para contexto
        const { data: docData } = await supabase
            .from("documentos")
            .select("nombre_archivo, categoria, cliente_asociado")
            .eq("empleado_id", employeeId)
            .limit(5);

        // 3. Obtener eventos próximos
        const { data: eventData } = await supabase
            .from("calendario_eventos")
            .select("titulo, fecha_inicio, tipo_evento")
            .eq("empleado_id", employeeId)
            .gte("fecha_inicio", new Date().toISOString())
            .limit(5);

        const contextString = `
        INFORMACIÓN DEL USUARIO ACTUAL:
        - Nombre: ${employeeData?.nombre || 'Desconocido'}
        - Puesto: ${employeeData?.puesto || 'No especificado'}
        - Salario Bruto Anual: ${employeeData?.salario_bruto_anual || 'No disponible'}
        
        DOCUMENTOS RECIENTES:
        ${docData?.map(d => `- [${d.categoria}] ${d.nombre_archivo} (${d.cliente_asociado || 'General'})`).join('\n')}
        
        PRÓXIMOS EVENTOS:
        ${eventData?.map(e => `- ${e.titulo} (${e.fecha_inicio}) - Tipo: ${e.tipo_evento}`).join('\n')}
        `;

        const systemPrompt = `
        Actúa como el Asistente Inteligente de HR MiniSuite.
        Eres un experto en la gestión de la empresa y tienes acceso a la información personalizada del empleado.
        
        Tus misiones son:
        1. Responder preguntas sobre el contexto del empleado (nóminas, vacaciones, calendario).
        2. Ejecutar acciones detectando "intents": crear tareas, eventos o redactar correos.
        3. Ayudar con filtrados (ej: "muéstrame nóminas de 2025").
        4. Redactar mensajes corporativos con un tono premium, profesional y servicial (estilo suizo).

        CONTEXTO ACTUAL:
        ${contextString}

        REGLAS DE RESPUESTA:
        - Si el usuario pregunta algo que conoces por el contexto, respóndele directamente.
        - Si el usuario quiere crear un evento o tarea, devuelve un JSON estructurado con la acción.
        - Sé conciso y elegante. Evita disculpas innecesarias.

        FORMATO JSON OBLIGATORIO:
        {
            "text": "Tu respuesta en lenguaje natural",
            "action": {
                "detected": true/false,
                "intent": "crear_tarea" | "crear_evento" | null,
                "params": { ...parámetros extraídos... },
                "confirmation_required": true
            }
        }`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    ...messages.map((m: any) => ({
                        role: m.role === "user" ? "user" : "model",
                        parts: [{ text: m.content }]
                    }))
                ],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            }),
        });

        const apiData = await response.json();

        if (!apiData.candidates?.[0]) {
            throw new Error("No response from Gemini");
        }

        const rawResult = apiData.candidates[0].content.parts[0].text;
        const result = JSON.parse(rawResult);

        // persistencia
        if (employeeId) {
            await supabase.from("chatbot_conversaciones").insert([
                { empleado_id: employeeId, rol: 'assistant', mensaje: result.text }
            ]);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({
            text: "Lo siento, mi motor de IA está en mantenimiento. Inténtalo de nuevo en unos momentos.",
            action: { detected: false }
        }, { status: 200 });
    }
}
