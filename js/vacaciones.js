// ========== GESTIÓN DE VACACIONES ==========

function abrirModalVacaciones(idEmpleado) {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para registrar vacaciones');
        return;
    }
    
    const empleado = empleados.find(emp => emp.id_empleado === idEmpleado);
    if (!empleado) return;
    
    const antiguedadExacta = calcularAntiguedadExacta(empleado.fecha_contratacion);
    const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
    const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (empleado.dias_vacaciones_tomados || 0));
    
    document.getElementById('empleado_vacaciones_id').value = idEmpleado;
    document.getElementById('info-empleado').textContent = `${empleado.nombre} ${empleado.apellido}`;
    document.getElementById('info-sucursal').textContent = empleado.sucursal;
    document.getElementById('info-sucursal').className = `badge badge-${empleado.sucursal.toLowerCase()}`;
    document.getElementById('info-antiguedad').textContent = antiguedadExacta.texto;
    document.getElementById('info-vacaciones-acumuladas').textContent = `${vacacionesAcumuladas} días`;
    document.getElementById('info-vacaciones-pendientes').textContent = `${vacacionesPendientes} días`;
    
    const modal = new bootstrap.Modal(document.getElementById('modalVacaciones'));
    modal.show();
}

async function registrarVacaciones() {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para registrar vacaciones');
        return;
    }
    
    try {
        const idEmpleado = document.getElementById('empleado_vacaciones_id').value;
        const diasVacaciones = parseInt(document.getElementById('dias_vacaciones').value);
        
        if (!idEmpleado || !diasVacaciones || diasVacaciones <= 0) {
            alert('Por favor ingrese un número válido de días');
            return;
        }
        
        const empleado = empleados.find(emp => emp.id_empleado === idEmpleado);
        if (!empleado) {
            alert('Empleado no encontrado');
            return;
        }
        
        const antiguedad = calcularAntiguedad(empleado.fecha_contratacion);
        const vacacionesAcumuladas = calcularVacaciones(antiguedad);
        const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (empleado.dias_vacaciones_tomados || 0));
        
        if (diasVacaciones > vacacionesPendientes) {
            alert(`No hay suficientes días disponibles. Días pendientes: ${vacacionesPendientes}`);
            return;
        }
        
        const nuevosDiasTomados = (empleado.dias_vacaciones_tomados || 0) + diasVacaciones;
        
        // Actualizar empleado
        const { error: errorEmpleado } = await supabaseClient
            .from('empleados')
            .update({ 
                dias_vacaciones_tomados: nuevosDiasTomados,
                fecha_actualizacion: new Date()
            })
            .eq('id_empleado', idEmpleado);
        
        if (errorEmpleado) {
            throw errorEmpleado;
        }
        
        // Registrar en tabla de vacaciones
        const { error: errorVacaciones } = await supabaseClient
            .from('registro_vacaciones')
            .insert([
                {
                    empleado_id: empleado.id,
                    dias_solicitados: diasVacaciones,
                    estado: 'aprobado',
                    observaciones: 'Registrado desde el sistema'
                }
            ]);
        
        if (errorVacaciones) {
            throw errorVacaciones;
        }
        
        // Registrar log
        await registrarLog('registrar_vacaciones', 'empleados', idEmpleado, {
            empleado: empleado.nombre + ' ' + empleado.apellido,
            dias: diasVacaciones
        });
        
        alert(`Vacaciones registradas exitosamente: ${diasVacaciones} días para ${empleado.nombre} ${empleado.apellido}`);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalVacaciones'));
        modal.hide();
        
        await cargarEmpleados();
        
    } catch (error) {
        console.error('Error registrando vacaciones:', error);
        alert('Error al registrar vacaciones: ' + error.message);
    }
}

// ========== ORGANIZACIÓN POR SUCURSAL ==========

function alternarAgrupacionSucursal() {
    agruparPorSucursal = document.getElementById('agrupar-sucursal').checked;
    actualizarTablaEmpleados();
}

function filtrarEmpleadosPorSucursal() {
    sucursalFiltro = document.getElementById('filtro-sucursal').value;
    actualizarTablaEmpleados();
}

// ========== ORGANIZACIÓN POR SUCURSAL EN VACACIONES ==========

function alternarAgrupacionSucursalVacaciones() {
    agruparPorSucursalVacaciones = document.getElementById('agrupar-sucursal-vacaciones').checked;
    actualizarTablaVacaciones();
}

function filtrarVacacionesPorSucursal() {
    sucursalFiltroVacaciones = document.getElementById('filtro-sucursal-vacaciones').value;
    actualizarTablaVacaciones();
}