"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * ProfileSync Component
 * Automatically ensures that any authenticated user has a corresponding record
 * in the 'empleados' table. Runs silently in the background of ClientLayout.
 */
export default function ProfileSync() {
    useEffect(() => {
        const syncProfile = async () => {
            // 1. Get current authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user || !user.email) return;

            // 2. Check if employee record already exists
            const { data: existingEmp, error: fetchError } = await supabase
                .from("empleados")
                .select("id")
                .eq("email", user.email)
                .maybeSingle();

            if (fetchError) {
                console.error("ProfileSync Error (Fetch):", fetchError);
                return;
            }

            // 3. If not exists, create the profile
            if (!existingEmp) {
                const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
                const avatarUrl = user.user_metadata?.avatar_url || "";

                const { error: insertError } = await supabase
                    .from("empleados")
                    .insert({
                        nombre: fullName,
                        email: user.email,
                        foto_url: avatarUrl,
                        puesto: "Nuevo Colaborador",
                        fecha_alta: new Date().toISOString().split('T')[0],
                        salario_base: 0,
                        salario_bruto_anual: 0,
                        departamento: "Sin asignar"
                    });

                if (insertError) {
                    console.error("ProfileSync Error (Insert):", insertError);
                } else {
                    console.log(`Profile synchronized for: ${user.email}`);
                    // Optional: trigger a page reload to refresh lists if we are on people/messages page
                    // window.location.reload(); 
                }
            }
        };

        syncProfile();
    }, []);

    return null; // This component has no UI
}
