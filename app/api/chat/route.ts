import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    const { messages, employeeId } = await req.json();
    // Fallback directly to the provided key since .env might not be updated yet
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || "AIzaSyCSdXm4D5jimhjLPDVIr0xtt0TybXSUHyU";
    const lastMessage = messages[messages.length - 1].content;

    if (!apiKey) return NextResponse.json({ error: "Gemini API key not found" }, { status: 500 });

    try {
        // 1. Obtener contexto del empleado
        const { data: employeeData } = await supabase
            .from("empleados")
            .select("*")
            .eq("id", employeeId)
            .single();

        // 2. Obtener documentos refinados para contexto (Protocolo 5 Agentes)
        const { data: docData } = await supabase
            .from("documentos")
            .select("nombre_archivo, tipo, descripcion, fecha_subida")
            .eq("persona_id", employeeId)
            .order('fecha_subida', { ascending: false })
            .limit(10);

        // 3. Obtener eventos próximos
        const { data: eventData } = await supabase
            .from("calendario_eventos")
            .select("titulo, fecha_inicio, tipo_evento")
            .eq("empleado_id", employeeId)
            .gte("fecha_inicio", new Date().toISOString())
            .limit(5);

        const contextString = `
        INFORMACIÓN DEL EMPLEADO:
        - Nombre: ${employeeData?.nombre || 'Desconocido'}
        - Email: ${employeeData?.email}
        - Puesto: ${employeeData?.puesto || 'No especificado'}
        - Salario Bruto Anual (SBA): ${employeeData?.salario_bruto_anual || 'No disponible'}
        
        TUS DOCUMENTOS DISPONIBLES (Agent DBA Table):
        ${docData?.map(d => `- [${d.tipo}] ${d.nombre_archivo} | Descripción: ${d.descripcion || 'Sin descripción'} | Fecha: ${d.fecha_subida}`).join('\n')}
        
        PRÓXIMOS EVENTOS EN CALENDARIO:
        ${eventData?.map(e => `- ${e.titulo} (${e.fecha_inicio}) - Tipo: ${e.tipo_evento}`).join('\n')}
        `;

        const systemPrompt = `
        Actúa como el Agente de IA Especializado de HR MiniSuite (Protocolo 5 Agentes).
        Tu objetivo es ser el asistente personal del empleado, ayudándole a navegar su información laboral.
        
        MISIONES PRIORITARIAS:
        1. Localizar Documentos: Si el empleado pregunta por una nómina, contrato o certificado, revisa la lista de documentos y dile si existe, qué dice la descripción y cuándo se subió.
        2. Análisis de Sueldo: Ayúdale a entender su SBA y cuánto está acumulando.
        3. Gestión de Tiempo: Informa sobre sus próximos eventos o tareas.
        4. Tono: Profesional, elegante, extremadamente útil. Estilo #714A38 (Premium).
        
        REGLAS:
        - Nunca inventes datos. Si no está en el contexto, di que no tienes esa información.
        - Si detectas que quiere crear algo, usa el intent correspondiente.
        - Sé empático con el empleado.

        CONTEXTO ACTUAL DEL EMPLEADO:
        ${contextString}

        FORMATO JSON OBLIGATORIO:
        {
            "text": "Tu respuesta en lenguaje natural (Markdown soportado)",
            "action": {
                "detected": true/false,
                "intent": "crear_tarea" | "crear_evento" | null,
                "params": { ... },
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
            throw new Error("No response from Gemini API");
        }

        const rawResult = apiData.candidates[0].content.parts[0].text;
        const result = JSON.parse(rawResult);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Agent AI Error:", error);
        return NextResponse.json({
            text: "Mi sistema de análisis está procesando otros datos. ¿Podrías repetirme la consulta en un momento?",
            action: { detected: false }
        }, { status: 200 });
    }
}
