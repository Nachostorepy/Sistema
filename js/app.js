// ========== APLICACIÓN PRINCIPAL ==========

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema RRHH con Base de Datos iniciado');
    
    // Event listeners
    document.getElementById('login-form').addEventListener('submit', iniciarSesion);
    document.getElementById('form-agregar-empleado').addEventListener('submit', agregarEmpleado);
    document.getElementById('form-registro-usuario').addEventListener('submit', registrarUsuario);
    document.getElementById('edit_fecha_contratacion').addEventListener('change', actualizarCalculosVacaciones);
    
    // Verificar si hay usuarios, si no, crear usuario admin por defecto
    inicializarBaseDeDatos();
});

async function inicializarBaseDeDatos() {
    try {
        await verificarYCrearUsuarioAdmin();
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando base de datos:', error);
    }
}

// ========== FUNCIONES DE NAVEGACIÓN ==========

function mostrarSeccion(seccionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.classList.add('d-none');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(seccionId).classList.remove('d-none');
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Encontrar el enlace correspondiente a la sección
    const navLinks = document.querySelectorAll('.nav-link');
    for (let link of navLinks) {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(seccionId)) {
            link.classList.add('active');
            break;
        }
    }
    
    // Actualizar tablas responsivas
    setTimeout(actualizarTablasResponsivas, 100);
}

// ========== FUNCIONES DE UI ==========

function actualizarDashboard() {
    // Total empleados
    document.getElementById('total-empleados').textContent = empleados.length;
    
    // Vacaciones pendientes totales
    let totalVacacionesPendientes = 0;
    empleados.forEach(emp => {
        const antiguedad = calcularAntiguedad(emp.fecha_contratacion);
        const vacacionesAcumuladas = calcularVacaciones(antiguedad);
        const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
        totalVacacionesPendientes += vacacionesPendientes;
    });
    document.getElementById('vacaciones-pendientes').textContent = totalVacacionesPendientes;
    
    // Salario total
    const salarioTotal = empleados.reduce((total, emp) => total + parseFloat(emp.salario_base || 0), 0);
    document.getElementById('salario-total').textContent = '$' + salarioTotal.toLocaleString('es-ES');
    
    // Antigüedad promedio
    const antiguedadPromedio = empleados.length > 0 
        ? empleados.reduce((total, emp) => total + calcularAntiguedad(emp.fecha_contratacion), 0) / empleados.length 
        : 0;
    document.getElementById('antiguedad-promedio').textContent = antiguedadPromedio.toFixed(1) + ' años';
    
    // Empleados recientes
    actualizarListaEmpleadosRecientes();
}

function actualizarListaEmpleadosRecientes() {
    const container = document.getElementById('lista-empleados-recientes');
    const empleadosRecientes = empleados.slice(0, 5);
    
    if (empleadosRecientes.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay empleados registrados</p>';
        return;
    }
    
    const html = empleadosRecientes.map(emp => {
        const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
        
        return `
            <div class="d-flex align-items-center border-bottom py-2">
                <div class="flex-shrink-0">
                    <i class="fas fa-user-circle fa-2x text-primary"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h6 class="mb-0">${emp.nombre} ${emp.apellido}</h6>
                    <small class="text-muted">${emp.puesto} - ${emp.sucursal}</small>
                </div>
                <div class="flex-shrink-0">
                    <span class="badge bg-primary">${antiguedadExacta.textoCorto}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function actualizarTablaEmpleados() {
    const contenedor = document.getElementById('contenedor-empleados');
    
    if (empleados.length === 0) {
        contenedor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover table-mobile-friendly">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Sucursal</th>
                            <th>Puesto</th>
                            <th>Antigüedad</th>
                            <th>Vac. Pendientes</th>
                            <th>Salario</th>
                            <th id="th-acciones">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="8" class="text-center text-muted">
                                No hay empleados registrados
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        return;
    }
    
    // Filtrar empleados por sucursal si es necesario
    let empleadosFiltrados = empleados;
    if (sucursalFiltro !== 'todas') {
        empleadosFiltrados = empleados.filter(emp => emp.sucursal === sucursalFiltro);
    }
    
    if (agruparPorSucursal) {
        // Agrupar empleados por sucursal
        const empleadosPorSucursal = {};
        
        empleadosFiltrados.forEach(emp => {
            if (!empleadosPorSucursal[emp.sucursal]) {
                empleadosPorSucursal[emp.sucursal] = [];
            }
            empleadosPorSucursal[emp.sucursal].push(emp);
        });
        
        let html = '';
        
        // Ordenar sucursales alfabéticamente
        const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
        
        sucursalesOrdenadas.forEach(sucursal => {
            const empleadosSucursal = empleadosPorSucursal[sucursal];
            
            html += `
                <div class="grupo-sucursal">
                    <div class="header-sucursal header-${sucursal.toLowerCase()}">
                        <h5 class="mb-0">
                            <i class="fas fa-building me-2"></i>Sucursal ${sucursal}
                            <span class="badge bg-primary ms-2">${empleadosSucursal.length} empleado${empleadosSucursal.length !== 1 ? 's' : ''}</span>
                        </h5>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover table-mobile-friendly">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Puesto</th>
                                    <th>Antigüedad</th>
                                    <th>Vac. Pendientes</th>
                                    <th>Salario</th>
                                    <th id="th-acciones">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${empleadosSucursal.map(emp => {
                                    const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
                                    const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
                                    const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
                                    
                                    // Determinar si mostrar botones de acción
                                    const botonesAccion = usuarioActual.rol === 'admin' 
                                        ? `
                                            <div class="btn-group btn-group-sm" role="group">
                                                <button class="btn btn-outline-primary" onclick="editarEmpleado('${emp.id_empleado}')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="eliminarEmpleado('${emp.id_empleado}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        `
                                        : '<span class="text-muted">Solo lectura</span>';
                                    
                                    return `
                                        <tr>
                                            <td data-label="ID">${emp.id_empleado}</td>
                                            <td data-label="Nombre">${emp.nombre} ${emp.apellido}</td>
                                            <td data-label="Puesto">${emp.puesto}</td>
                                            <td data-label="Antigüedad">
                                                <span class="badge bg-primary antiguedad-badge" title="${antiguedadExacta.texto}">
                                                    ${antiguedadExacta.textoCorto}
                                                </span>
                                            </td>
                                            <td data-label="Vac. Pendientes">${vacacionesPendientes} días</td>
                                            <td data-label="Salario">$${parseFloat(emp.salario_base).toLocaleString('es-ES')}</td>
                                            <td data-label="Acciones">
                                                ${botonesAccion}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        contenedor.innerHTML = html;
    } else {
        // Mostrar tabla normal sin agrupación
        const html = empleadosFiltrados.map(emp => {
            const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            
            // Determinar si mostrar botones de acción
            const botonesAccion = usuarioActual.rol === 'admin' 
                ? `
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="editarEmpleado('${emp.id_empleado}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="eliminarEmpleado('${emp.id_empleado}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `
                : '<span class="text-muted">Solo lectura</span>';
            
            return `
                <tr>
                    <td data-label="ID">${emp.id_empleado}</td>
                    <td data-label="Nombre">${emp.nombre} ${emp.apellido}</td>
                    <td data-label="Sucursal">
                        <span class="badge badge-${emp.sucursal.toLowerCase()}">${emp.sucursal}</span>
                    </td>
                    <td data-label="Puesto">${emp.puesto}</td>
                    <td data-label="Antigüedad">
                        <span class="badge bg-primary antiguedad-badge" title="${antiguedadExacta.texto}">
                            ${antiguedadExacta.textoCorto}
                        </span>
                    </td>
                    <td data-label="Vac. Pendientes">${vacacionesPendientes} días</td>
                    <td data-label="Salario">$${parseFloat(emp.salario_base).toLocaleString('es-ES')}</td>
                    <td data-label="Acciones">
                        ${botonesAccion}
                    </td>
                </tr>
            `;
        }).join('');
        
        contenedor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover table-mobile-friendly">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Sucursal</th>
                            <th>Puesto</th>
                            <th>Antigüedad</th>
                            <th>Vac. Pendientes</th>
                            <th>Salario</th>
                            <th id="th-acciones">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${html}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Actualizar tablas responsivas
    setTimeout(actualizarTablasResponsivas, 100);
}

function actualizarTablaVacaciones() {
    const contenedor = document.getElementById('contenedor-vacaciones');
    
    if (empleados.length === 0) {
        contenedor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover table-mobile-friendly">
                    <thead class="table-dark">
                        <tr>
                            <th>Empleado</th>
                            <th>Sucursal</th>
                            <th>Antigüedad</th>
                            <th>Vac. Acumuladas</th>
                            <th>Vac. Tomadas</th>
                            <th>Vac. Pendientes</th>
                            <th id="th-acciones-vacaciones">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="text-center text-muted">
                                No hay empleados registrados
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        return;
    }
    
    // Filtrar empleados por sucursal si es necesario
    let empleadosFiltrados = empleados;
    if (sucursalFiltroVacaciones !== 'todas') {
        empleadosFiltrados = empleados.filter(emp => emp.sucursal === sucursalFiltroVacaciones);
    }
    
    if (agruparPorSucursalVacaciones) {
        // Agrupar empleados por sucursal
        const empleadosPorSucursal = {};
        
        empleadosFiltrados.forEach(emp => {
            if (!empleadosPorSucursal[emp.sucursal]) {
                empleadosPorSucursal[emp.sucursal] = [];
            }
            empleadosPorSucursal[emp.sucursal].push(emp);
        });
        
        let html = '';
        
        // Ordenar sucursales alfabéticamente
        const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
        
        sucursalesOrdenadas.forEach(sucursal => {
            const empleadosSucursal = empleadosPorSucursal[sucursal];
            
            html += `
                <div class="grupo-sucursal">
                    <div class="header-sucursal header-${sucursal.toLowerCase()}">
                        <h5 class="mb-0">
                            <i class="fas fa-building me-2"></i>Sucursal ${sucursal}
                            <span class="badge bg-primary ms-2">${empleadosSucursal.length} empleado${empleadosSucursal.length !== 1 ? 's' : ''}</span>
                        </h5>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover table-mobile-friendly">
                            <thead class="table-dark">
                                <tr>
                                    <th>Empleado</th>
                                    <th>Antigüedad</th>
                                    <th>Vac. Acumuladas</th>
                                    <th>Vac. Tomadas</th>
                                    <th>Vac. Pendientes</th>
                                    <th id="th-acciones-vacaciones">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${empleadosSucursal.map(emp => {
                                    const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
                                    const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
                                    const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
                                    
                                    // Determinar si mostrar botón de acción
                                    const botonAccion = usuarioActual.rol === 'admin' 
                                        ? `
                                            <button class="btn btn-sm btn-outline-warning" onclick="abrirModalVacaciones('${emp.id_empleado}')">
                                                <i class="fas fa-umbrella-beach me-1"></i>Registrar
                                            </button>
                                        `
                                        : '<span class="text-muted">Solo lectura</span>';
                                    
                                    return `
                                        <tr>
                                            <td data-label="Empleado">${emp.nombre} ${emp.apellido}</td>
                                            <td data-label="Antigüedad">
                                                <span class="badge bg-primary antiguedad-badge" title="${antiguedadExacta.texto}">
                                                    ${antiguedadExacta.textoCorto}
                                                </span>
                                            </td>
                                            <td data-label="Vac. Acumuladas">${vacacionesAcumuladas} días</td>
                                            <td data-label="Vac. Tomadas">${emp.dias_vacaciones_tomados || 0} días</td>
                                            <td data-label="Vac. Pendientes">
                                                <span class="badge ${vacacionesPendientes > 0 ? 'bg-success' : 'bg-secondary'}">
                                                    ${vacacionesPendientes} días
                                                </span>
                                            </td>
                                            <td data-label="Acciones">
                                                ${botonAccion}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        contenedor.innerHTML = html;
    } else {
        // Mostrar tabla normal sin agrupación
        const html = empleadosFiltrados.map(emp => {
            const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            
            // Determinar si mostrar botón de acción
            const botonAccion = usuarioActual.rol === 'admin' 
                ? `
                    <button class="btn btn-sm btn-outline-warning" onclick="abrirModalVacaciones('${emp.id_empleado}')">
                        <i class="fas fa-umbrella-beach me-1"></i>Registrar
                    </button>
                `
                : '<span class="text-muted">Solo lectura</span>';
            
            return `
                <tr>
                    <td data-label="Empleado">${emp.nombre} ${emp.apellido}</td>
                    <td data-label="Sucursal">
                        <span class="badge badge-${emp.sucursal.toLowerCase()}">${emp.sucursal}</span>
                    </td>
                    <td data-label="Antigüedad">
                        <span class="badge bg-primary antiguedad-badge" title="${antiguedadExacta.texto}">
                            ${antiguedadExacta.textoCorto}
                        </span>
                    </td>
                    <td data-label="Vac. Acumuladas">${vacacionesAcumuladas} días</td>
                    <td data-label="Vac. Tomadas">${emp.dias_vacaciones_tomados || 0} días</td>
                    <td data-label="Vac. Pendientes">
                        <span class="badge ${vacacionesPendientes > 0 ? 'bg-success' : 'bg-secondary'}">
                            ${vacacionesPendientes} días
                        </span>
                    </td>
                    <td data-label="Acciones">
                        ${botonAccion}
                    </td>
                </tr>
            `;
        }).join('');
        
        contenedor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover table-mobile-friendly">
                    <thead class="table-dark">
                        <tr>
                            <th>Empleado</th>
                            <th>Sucursal</th>
                            <th>Antigüedad</th>
                            <th>Vac. Acumuladas</th>
                            <th>Vac. Tomadas</th>
                            <th>Vac. Pendientes</th>
                            <th id="th-acciones-vacaciones">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${html}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Actualizar tablas responsivas
    setTimeout(actualizarTablasResponsivas, 100);
}

function actualizarResumenSucursales() {
    // Contadores por sucursal
    const contadores = {
        'CC': 0, 'CDE': 0, 'CO': 0, 'EA': 0,
        'ENC': 0, 'LMP': 0, 'LQ': 0, 'SL': 0
    };
    
    // Totales de salario por sucursal
    const totalesSalario = {
        'CC': 0, 'CDE': 0, 'CO': 0, 'EA': 0,
        'ENC': 0, 'LMP': 0, 'LQ': 0, 'SL': 0
    };
    
    empleados.forEach(emp => {
        if (emp.sucursal && contadores.hasOwnProperty(emp.sucursal)) {
            contadores[emp.sucursal]++;
            totalesSalario[emp.sucursal] += parseFloat(emp.salario_base || 0);
        }
    });
    
    // Actualizar tarjetas
    document.getElementById('total-sucursales').textContent = Object.keys(contadores).length;
    document.getElementById('empleados-cc').textContent = contadores.CC;
    document.getElementById('empleados-cde').textContent = contadores.CDE;
    document.getElementById('empleados-co').textContent = contadores.CO;
    
    // Actualizar resumen detallado
    const container = document.getElementById('resumen-sucursales');
    const sucursalesActivas = Object.keys(contadores).filter(sucursal => contadores[sucursal] > 0);
    
    if (sucursalesActivas.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No hay empleados en sucursales</p></div>';
        return;
    }
    
    const html = sucursalesActivas.map(sucursal => {
        const empleadosSucursal = empleados.filter(emp => emp.sucursal === sucursal);
        
        // Calcular antigüedad promedio
        let antiguedadPromedio = 0;
        if (empleadosSucursal.length > 0) {
            const totalAntiguedad = empleadosSucursal.reduce((total, emp) => {
                return total + calcularAntiguedad(emp.fecha_contratacion);
            }, 0);
            antiguedadPromedio = totalAntiguedad / empleadosSucursal.length;
        }
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card sucursal-${sucursal.toLowerCase()}">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-building me-2"></i>Sucursal ${sucursal}
                        </h5>
                        <div class="row">
                            <div class="col-6">
                                <strong>${contadores[sucursal]}</strong>
                                <small class="text-muted d-block">Empleados</small>
                            </div>
                            <div class="col-6">
                                <strong>$${totalesSalario[sucursal].toLocaleString('es-ES')}</strong>
                                <small class="text-muted d-block">Salario Total</small>
                            </div>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">Antigüedad promedio: ${antiguedadPromedio.toFixed(1)} años</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ========== FUNCIONES PARA TABLAS RESPONSIVAS ==========

function actualizarTablasResponsivas() {
    // Añadir etiquetas de datos para tablas responsivas
    document.querySelectorAll('.table-mobile-friendly th').forEach((th, index) => {
        const label = th.textContent;
        document.querySelectorAll('.table-mobile-friendly td:nth-child(' + (index + 1) + ')').forEach(td => {
            td.setAttribute('data-label', label);
        });
    });
}

// ========== MÓDULO DE NOTIFICACIONES ==========

function generarNotificaciones() {
    notificaciones = [];
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    
    // Notificaciones de vacaciones
    empleados.forEach(emp => {
        const antiguedad = calcularAntiguedad(emp.fecha_contratacion);
        const vacacionesPendientes = Math.max(0, calcularVacaciones(antiguedad) - (emp.dias_vacaciones_tomados || 0));
        
        if (vacacionesPendientes >= 10) {
            notificaciones.push({
                tipo: 'warning',
                titulo: 'Vacaciones Pendientes',
                mensaje: `${emp.nombre} ${emp.apellido} tiene ${vacacionesPendientes} días de vacaciones pendientes`,
                fecha: new Date(),
                icono: 'fa-umbrella-beach'
            });
        }
    });

    // Notificaciones de cumpleaños (simuladas)
    const cumpleanosEsteMes = empleados.filter(emp => {
        // Simulación - en un sistema real usaríamos la fecha real de nacimiento
        return Math.random() > 0.7; // 30% de empleados "cumplen" este mes
    }).slice(0, 3);

    cumpleanosEsteMes.forEach(emp => {
        notificaciones.push({
            tipo: 'success',
            titulo: 'Cumpleaños',
            mensaje: `${emp.nombre} ${emp.apellido} cumple años este mes`,
            fecha: new Date(),
            icono: 'fa-birthday-cake'
        });
    });

    // Notificaciones de aniversarios
    empleados.forEach(emp => {
        const antiguedad = calcularAntiguedad(emp.fecha_contratacion);
        if (antiguedad > 0 && hoy.getDate() === 15) { // Simulación: día 15 de cada mes
            notificaciones.push({
                tipo: 'info',
                titulo: 'Aniversario',
                mensaje: `${emp.nombre} ${emp.apellido} cumple ${antiguedad} año${antiguedad !== 1 ? 's' : ''} en la empresa`,
                fecha: new Date(),
                icono: 'fa-calendar-alt'
            });
        }
    });

    actualizarInterfazNotificaciones();
}

function actualizarInterfazNotificaciones() {
    // Actualizar contador
    const counter = document.getElementById('notification-counter');
    if (notificaciones.length > 0) {
        counter.textContent = notificaciones.length;
        counter.classList.remove('d-none');
    } else {
        counter.classList.add('d-none');
    }

    // Actualizar dashboard
    const vacacionesProximas = notificaciones.filter(n => n.tipo === 'warning').length;
    const cumpleanos = notificaciones.filter(n => n.tipo === 'success').length;
    const aniversarios = notificaciones.filter(n => n.tipo === 'info').length;

    document.getElementById('contador-vacaciones-proximas').textContent = vacacionesProximas;
    document.getElementById('contador-cumpleanos').textContent = cumpleanos;
    document.getElementById('contador-aniversarios').textContent = aniversarios;

    // Actualizar lista de notificaciones
    const lista = document.getElementById('lista-notificaciones');
    if (notificaciones.length === 0) {
        lista.innerHTML = '<p class="text-muted text-center">No hay notificaciones pendientes</p>';
        return;
    }

    const html = notificaciones.map(notif => `
        <div class="notification-item notification-${notif.tipo}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <i class="fas ${notif.icono} me-2"></i>
                    <strong>${notif.titulo}</strong>
                    <p class="mb-1">${notif.mensaje}</p>
                    <small class="text-muted">${notif.fecha.toLocaleDateString('es-ES')}</small>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="marcarComoLeida(this)">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `).join('');

    lista.innerHTML = html;
}

function marcarComoLeida(boton) {
    const notificacion = boton.closest('.notification-item');
    notificacion.style.opacity = '0.5';
    setTimeout(() => {
        notificacion.remove();
        // Actualizar contador
        const notificacionesRestantes = document.querySelectorAll('.notification-item').length;
        const counter = document.getElementById('notification-counter');
        if (notificacionesRestantes > 0) {
            counter.textContent = notificacionesRestantes;
        } else {
            counter.classList.add('d-none');
        }
    }, 300);
}

function actualizarAlertasRecientes() {
    const container = document.getElementById('alertas-recientes');
    const alertasRecientes = notificaciones.slice(0, 3);
    
    if (alertasRecientes.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay alertas recientes</p>';
        return;
    }

    const html = alertasRecientes.map(notif => `
        <div class="d-flex align-items-center border-bottom py-2">
            <div class="flex-shrink-0">
                <i class="fas ${notif.icono} text-${notif.tipo}"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <small class="d-block">${notif.mensaje}</small>
                <small class="text-muted">${notif.fecha.toLocaleDateString('es-ES')}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}