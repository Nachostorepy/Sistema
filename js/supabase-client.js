// Configuración de Supabase
const SUPABASE_URL = 'https://ismdjpasduqxvynnhwms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWRqcGFzZHVxeHZ5bm5od21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzMzNjgsImV4cCI6MjA3ODEwOTM2OH0.6fFh1vRGGobB4-XyQ_mgih0ak7hXy0L2EmVwiURRV5Q';

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