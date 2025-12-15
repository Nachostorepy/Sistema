// Configuración de Supabase
const SUPABASE_URL = 'https://wyajqxzwlsruxpehivtq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YWpxeHp3bHNydXhwZWhpdnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjkwODksImV4cCI6MjA4MTQwNTA4OX0.Sxs9ikJP9ryNY72PpspEM9vYiM_rG5LB3_UxLY9ZkqI';

// Cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let empleados = [];
let usuarios = [];
let notificaciones = [];
let usuarioActual = null;
let agruparPorSucursal = false;
let sucursalFiltro = 'todas';
let agruparPorSucursalVacaciones = false;
let sucursalFiltroVacaciones = 'todas';

// Función para agrupar empleados por sucursal (usada en reportes)
function agruparEmpleadosPorSucursal(listaEmpleados) {
    const empleadosPorSucursal = {};
    
    listaEmpleados.forEach(emp => {
        const sucursal = emp.sucursal || 'CC';
        if (!empleadosPorSucursal[sucursal]) {
            empleadosPorSucursal[sucursal] = [];
        }
        empleadosPorSucursal[sucursal].push(emp);
    });
    
    return empleadosPorSucursal;
}
