import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { employee, contract, complements, hours, noSalarial } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Gemini API key not found" }, { status: 500 });
    }

    try {
        const prompt = `Actúa como un motor de cálculo de nóminas certificado (Normativa España Enero 2026).
        Debes ignorar datos previos y usar exclusivamente estos valores actuales:
        - Salario Base Mensual: ${contract.salario_base_mensual} €
        - Horas Ordinarias (MANUAL): ${hours?.horas_ordinarias || 160}
        - Horas Extras (MANUAL): ${hours?.horas_extras_normales || 0}
        - Complementos: ${complements.length > 0 ? complements.reduce((acc: number, c: any) => acc + (Number(c.importe_mensual) || 0), 0) : 0} €
        - Pagas Extra: ${contract.numero_pagas} pagas.
        - Situación Familiar: ${employee.situacion_familiar}, Hijos: ${employee.personas_a_cargo}

        PASOS MATEMÁTICOS OBLIGATORIOS:
        1. Devengo Salarial = (${contract.salario_base_mensual}/160 * ${hours?.horas_ordinarias}) + (${contract.salario_base_mensual}/160 * 1.5 * ${hours?.horas_extras_normales}) + Complementos.
        2. Prorrata Pagas Extra = (Salario Base + Complementos) * (${contract.numero_pagas}-12) / 12.
        3. Base Cotización (BC) = Devengo Salarial + Prorrata Pagas Extra.
        4. Seguridad Social (Trabajador):
           - Contingencias Comunes (4.70%), Desempleo (1.55%), Formación (0.10%), MEI (0.15%). TOTAL = 6.50% de BC.
        5. Retención IRPF (Tablas 2026):
           - Bruto Anual (BA) = BC * 12.
           - Mínimo Personal y Familiar: 5.550€ base + incrementos por hijos (1º: 2.400, 2º: 2.700).
           - Base Liquidable = BA - Seguridad Social Anual - Mínimo Personal.
           - Aplica Tramos: [0-12450: 19%], [12451-20200: 24%], [20201-35200: 30%], [35201-60000: 37%], [>60000: 45%].
           - Calcula el tipo_irpf final resultante y aplícalo al Bruto Mensual.

        ESTRUCTURA JSON DE SALIDA:
        {
            "id_ref": "LIQ-2026-V3-ULTRA",
            "devengos": [
                {"label": "Salario Base (Proporcional)", "val": 0.0},
                {"label": "Complementos Salariales", "val": 0.0},
                {"label": "Horas Extra (1.5x)", "val": 0.0}
            ],
            "deducciones": [
                {"label": "Seguridad Social (6.5%)", "val": 0.0},
                {"label": "Retención IRPF (X%)", "val": 0.0}
            ],
            "total_bruto": 0.0,
            "total_deducciones": 0.0,
            "neto": 0.0,
            "base_cotizacion": 0.0,
            "tipo_irpf": 0.0,
            "coste_empresa_total_ss": 0.0,
            "ia_insight": "Análisis de cómo la base de cotización y el IRPF han reaccionado a las horas manuales y situación familiar."
        }`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Limpiar posible markdown
        const cleanJson = rawJsonText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanJson);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Payroll API Error:", error);
        return NextResponse.json({ error: "Failed to calculate payroll" }, { status: 500 });
    }
}
