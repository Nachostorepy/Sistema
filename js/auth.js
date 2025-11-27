// ========== FUNCIONES DE AUTENTICACIÓN ==========

async function verificarYCrearUsuarioAdmin() {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('username', 'admin')
            .single();

        if (error && error.code === 'PGRST116') {
            // No existe usuario admin, crearlo
            console.log('Creando usuario administrador por defecto...');
            await crearUsuarioAdmin();
        } else if (data) {
            console.log('Usuario admin ya existe');
        }
    } catch (error) {
        console.error('Error verificando usuario admin:', error);
    }
}

async function crearUsuarioAdmin() {
    try {
        // Crear hash simple de contraseña (en producción usaría bcrypt)
        const passwordHash = btoa('admin123');
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .insert([
                {
                    username: 'admin',
                    password_hash: passwordHash,
                    rol: 'admin',
                    nombre: 'Administrador Principal',
                    email: 'admin@sistema.com',
                    activo: true
                }
            ]);

        if (error) {
            if (error.code === '23505') {
                console.log('Usuario admin ya existe');
            } else {
                throw error;
            }
        } else {
            console.log('Usuario admin creado exitosamente');
        }
    } catch (error) {
        console.error('Error creando usuario admin:', error);
    }
}

async function iniciarSesion(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Buscar usuario en la base de datos
        const { data: usuario, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .eq('activo', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                alert('Usuario no encontrado');
            } else if (error.code === '42P01') {
                alert('Error: La base de datos no está configurada correctamente.');
            } else {
                throw error;
            }
            return;
        }

        // Verificar contraseña (simple para este ejemplo)
        const passwordHash = btoa(password);
        if (usuario.password_hash !== passwordHash) {
            alert('Contraseña incorrecta');
            return;
        }

        // Actualizar último login
        await supabaseClient
            .from('usuarios')
            .update({ ultimo_login: new Date() })
            .eq('id', usuario.id);

        usuarioActual = usuario;
        
        document.getElementById('login-screen').classList.add('d-none');
        document.getElementById('main-system').classList.remove('d-none');
        document.getElementById('current-user').textContent = usuario.nombre;
        
        // Actualizar interfaz según el rol
        actualizarInterfazSegunRol();
        
        // Actualizar fecha actual
        const fecha = new Date();
        document.getElementById('fecha-actual').textContent = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Registrar log de login
        try {
            await registrarLog('login', 'usuarios', usuario.id, {
                username: usuario.username,
                rol: usuario.rol
            });
        } catch (logError) {
            console.warn('No se pudo registrar el log:', logError);
        }
        
        // Cargar datos iniciales
        await cargarEmpleados();
        await cargarUsuarios();
        mostrarSeccion('dashboard');
        
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión: ' + error.message);
    }
}

async function registrarLog(accion, tabla, registroId, detalles) {
    try {
        await supabaseClient
            .from('logs_sistema')
            .insert([
                {
                    usuario_id: usuarioActual.id,
                    accion: accion,
                    tabla_afectada: tabla,
                    registro_id: registroId,
                    detalles: detalles
                }
            ]);
    } catch (error) {
        console.error('Error registrando log:', error);
    }
}

function actualizarInterfazSegunRol() {
    const userInfoContainer = document.getElementById('user-info-container');
    const userRole = document.getElementById('user-role');
    
    if (usuarioActual.rol === 'admin') {
        userInfoContainer.className = 'user-info';
        userRole.textContent = 'Administrador';
        userRole.className = 'badge bg-light text-dark ms-1';
        
        // Mostrar todas las funcionalidades
        document.getElementById('nav-agregar-empleado').classList.remove('d-none');
        document.getElementById('nav-gestion-usuarios').classList.remove('d-none');
        document.querySelectorAll('.disabled-for-visitor').forEach(el => {
            el.classList.remove('disabled-for-visitor');
        });
    } else {
        userInfoContainer.className = 'user-info user-info-visitante';
        userRole.textContent = 'Visitante';
        userRole.className = 'badge bg-secondary ms-1';
        
        // Ocultar funcionalidades de edición
        document.getElementById('nav-agregar-empleado').classList.add('d-none');
        document.getElementById('nav-gestion-usuarios').classList.add('d-none');
        
        // Deshabilitar botones de acción
        document.querySelectorAll('button[onclick*="editarEmpleado"], button[onclick*="eliminarEmpleado"], button[onclick*="abrirModalVacaciones"]').forEach(btn => {
            btn.classList.add('disabled-for-visitor');
        });
        
        // Ocultar columnas de acciones en tablas
        document.getElementById('th-acciones').style.display = 'none';
        document.getElementById('th-acciones-vacaciones').style.display = 'none';
        
        // Deshabilitar formularios
        document.getElementById('form-agregar-empleado').classList.add('disabled-for-visitor');
        document.querySelectorAll('#form-agregar-empleado input, #form-agregar-empleado select, #form-agregar-empleado button').forEach(el => {
            el.disabled = true;
        });
    }
}

async function cerrarSesion() {
    // Registrar log de logout
    if (usuarioActual) {
        await registrarLog('logout', 'usuarios', usuarioActual.id, {
            username: usuarioActual.username
        });
    }
    
    usuarioActual = null;
    document.getElementById('main-system').classList.add('d-none');
    document.getElementById('login-screen').classList.remove('d-none');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}