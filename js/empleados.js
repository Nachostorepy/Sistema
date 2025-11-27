// ========== GESTIÓN DE EMPLEADOS ==========

async function cargarEmpleados() {
    try {
        console.log('Cargando empleados desde Supabase...');
        
        const { data, error } = await supabaseClient
            .from('empleados')
            .select('*')
            .eq('activo', true)
            .order('fecha_contratacion', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        empleados = data || [];
        console.log(`Se cargaron ${empleados.length} empleados`);
        
        actualizarDashboard();
        actualizarTablaEmpleados();
        actualizarTablaVacaciones();
        actualizarResumenSucursales();
        generarNotificaciones();
        actualizarAlertasRecientes();
        
    } catch (error) {
        console.error('Error cargando empleados:', error);
        alert('Error al cargar empleados: ' + error.message);
    }
}

async function agregarEmpleado(event) {
    event.preventDefault();
    
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para agregar empleados');
        return;
    }
    
    try {
        const nuevoEmpleado = {
            id_empleado: document.getElementById('id_empleado').value,
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            fecha_contratacion: document.getElementById('fecha_contratacion').value,
            salario_base: parseFloat(document.getElementById('salario_base').value),
            puesto: document.getElementById('puesto').value,
            sucursal: document.getElementById('sucursal').value,
            departamento: document.getElementById('departamento').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            dias_vacaciones_tomados: 0
        };
        
        console.log('Agregando empleado:', nuevoEmpleado);
        
        const { data, error } = await supabaseClient
            .from('empleados')
            .insert([nuevoEmpleado]);
        
        if (error) {
            throw error;
        }
        
        // Registrar log
        await registrarLog('crear', 'empleados', nuevoEmpleado.id_empleado, {
            empleado: nuevoEmpleado.nombre + ' ' + nuevoEmpleado.apellido,
            puesto: nuevoEmpleado.puesto
        });
        
        alert('Empleado agregado exitosamente a la base de datos');
        document.getElementById('form-agregar-empleado').reset();
        
        // Recargar la lista de empleados
        await cargarEmpleados();
        mostrarSeccion('empleados');
        
    } catch (error) {
        console.error('Error agregando empleado:', error);
        alert('Error al agregar empleado: ' + error.message);
    }
}

function editarEmpleado(idEmpleado) {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para editar empleados');
        return;
    }
    
    const empleado = empleados.find(emp => emp.id_empleado === idEmpleado);
    if (!empleado) return;
    
    // Llenar el formulario con los datos del empleado
    document.getElementById('edit_empleado_id').value = empleado.id;
    document.getElementById('edit_id_empleado').value = empleado.id_empleado;
    document.getElementById('edit_nombre').value = empleado.nombre;
    document.getElementById('edit_apellido').value = empleado.apellido;
    document.getElementById('edit_fecha_contratacion').value = empleado.fecha_contratacion;
    document.getElementById('edit_salario_base').value = empleado.salario_base;
    document.getElementById('edit_puesto').value = empleado.puesto;
    document.getElementById('edit_sucursal').value = empleado.sucursal;
    document.getElementById('edit_departamento').value = empleado.departamento || '';
    document.getElementById('edit_email').value = empleado.email || '';
    document.getElementById('edit_telefono').value = empleado.telefono || '';
    document.getElementById('edit_dias_vacaciones_tomados').value = empleado.dias_vacaciones_tomados || 0;
    
    // Actualizar cálculos de vacaciones
    actualizarCalculosVacaciones();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEmpleado'));
    modal.show();
}

async function guardarEdicionEmpleado() {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para editar empleados');
        return;
    }
    
    try {
        const empleadoActualizado = {
            nombre: document.getElementById('edit_nombre').value,
            apellido: document.getElementById('edit_apellido').value,
            fecha_contratacion: document.getElementById('edit_fecha_contratacion').value,
            salario_base: parseFloat(document.getElementById('edit_salario_base').value),
            puesto: document.getElementById('edit_puesto').value,
            sucursal: document.getElementById('edit_sucursal').value,
            departamento: document.getElementById('edit_departamento').value,
            email: document.getElementById('edit_email').value,
            telefono: document.getElementById('edit_telefono').value,
            dias_vacaciones_tomados: parseInt(document.getElementById('edit_dias_vacaciones_tomados').value) || 0,
            fecha_actualizacion: new Date()
        };
        
        const idEmpleado = document.getElementById('edit_id_empleado').value;
        
        const { data, error } = await supabaseClient
            .from('empleados')
            .update(empleadoActualizado)
            .eq('id_empleado', idEmpleado);
        
        if (error) {
            throw error;
        }
        
        // Registrar log
        await registrarLog('actualizar', 'empleados', idEmpleado, {
            empleado: empleadoActualizado.nombre + ' ' + empleadoActualizado.apellido
        });
        
        alert('Empleado actualizado exitosamente');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEmpleado'));
        modal.hide();
        
        await cargarEmpleados();
        
    } catch (error) {
        console.error('Error actualizando empleado:', error);
        alert('Error al actualizar empleado: ' + error.message);
    }
}

async function eliminarEmpleado(idEmpleado) {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para eliminar empleados');
        return;
    }
    
    if (!confirm('¿Está seguro de que desea eliminar este empleado?')) {
        return;
    }
    
    try {
        const empleado = empleados.find(emp => emp.id_empleado === idEmpleado);
        
        const { error } = await supabaseClient
            .from('empleados')
            .update({ activo: false, fecha_actualizacion: new Date() })
            .eq('id_empleado', idEmpleado);
        
        if (error) {
            throw error;
        }
        
        // Registrar log
        await registrarLog('eliminar', 'empleados', idEmpleado, {
            empleado: empleado.nombre + ' ' + empleado.apellido
        });
        
        alert('Empleado eliminado exitosamente');
        await cargarEmpleados();
        
    } catch (error) {
        console.error('Error eliminando empleado:', error);
        alert('Error al eliminar empleado: ' + error.message);
    }
}

// ========== CÁLCULOS Y UTILIDADES ==========

// Nueva función mejorada para calcular antigüedad exacta
function calcularAntiguedadExacta(fechaContratacion) {
    const hoy = new Date();
    const fechaContrato = new Date(fechaContratacion);
    
    let años = hoy.getFullYear() - fechaContrato.getFullYear();
    let meses = hoy.getMonth() - fechaContrato.getMonth();
    let dias = hoy.getDate() - fechaContrato.getDate();
    
    // Ajustar si los días son negativos
    if (dias < 0) {
        meses--;
        // Obtener el último día del mes anterior
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }
    
    // Ajustar si los meses son negativos
    if (meses < 0) {
        años--;
        meses += 12;
    }
    
    return {
        años: años,
        meses: meses,
        dias: dias,
        texto: `${años} año${años !== 1 ? 's' : ''}, ${meses} mes${meses !== 1 ? 'es' : ''} y ${dias} día${dias !== 1 ? 's' : ''}`,
        textoCorto: `${años}a ${meses}m ${dias}d`
    };
}

// Función para calcular antigüedad en años (para compatibilidad)
function calcularAntiguedad(fechaContratacion) {
    const antiguedadExacta = calcularAntiguedadExacta(fechaContratacion);
    return antiguedadExacta.años;
}

function calcularVacaciones(antiguedad) {
    if (antiguedad < 1) return 0;
    if (antiguedad < 5) return 12;
    if (antiguedad < 10) return 18;
    return 30;
}

function actualizarCalculosVacaciones() {
    const fechaContratacion = document.getElementById('edit_fecha_contratacion').value;
    const diasTomados = parseInt(document.getElementById('edit_dias_vacaciones_tomados').value) || 0;
    
    if (!fechaContratacion) return;
    
    const antiguedad = calcularAntiguedad(fechaContratacion);
    const vacacionesAcumuladas = calcularVacaciones(antiguedad);
    const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - diasTomados);
    
    document.getElementById('edit_antiguedad_info').textContent = `${antiguedad} año${antiguedad !== 1 ? 's' : ''}`;
    document.getElementById('edit_vacaciones_acumuladas').textContent = `${vacacionesAcumuladas} días`;
    document.getElementById('edit_vacaciones_pendientes').textContent = `${vacacionesPendientes} días`;
    
    // Determinar rango de antigüedad
    let rango = 'Menos de 1 año';
    if (antiguedad >= 1 && antiguedad < 5) rango = '1-4 años (12 días)';
    else if (antiguedad >= 5 && antiguedad < 10) rango = '5-9 años (18 días)';
    else if (antiguedad >= 10) rango = '10+ años (30 días)';
    
    document.getElementById('edit_rango_antiguedad').textContent = rango;
}