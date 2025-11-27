// ========== GESTIÓN DE USUARIOS ==========

async function cargarUsuarios() {
    try {
        console.log('Cargando usuarios desde Supabase...');
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .order('username');
        
        if (error) {
            throw error;
        }
        
        usuarios = data || [];
        console.log(`Se cargaron ${usuarios.length} usuarios`);
        
        actualizarTablaUsuarios();
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        alert('Error al cargar usuarios: ' + error.message);
    }
}

async function registrarUsuario(event) {
    event.preventDefault();
    
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para crear usuarios');
        return;
    }
    
    const username = document.getElementById('reg_username').value;
    const password = document.getElementById('reg_password').value;
    const nombre = document.getElementById('reg_nombre').value;
    const email = document.getElementById('reg_email').value;
    const rol = document.getElementById('reg_rol').value;
    const activo = document.getElementById('reg_activo').checked;

    try {
        // Verificar si el usuario ya existe
        const { data: usuarioExistente, error: errorVerificar } = await supabaseClient
            .from('usuarios')
            .select('id')
            .eq('username', username)
            .single();

        // Si encontramos un usuario o hay un error diferente a "no encontrado"
        if (usuarioExistente || (errorVerificar && errorVerificar.code !== 'PGRST116')) {
            if (usuarioExistente) {
                alert('El nombre de usuario ya existe');
            } else {
                throw errorVerificar;
            }
            return;
        }

        // Crear hash de contraseña (simple para este ejemplo)
        const passwordHash = btoa(password);

        const { data, error } = await supabaseClient
            .from('usuarios')
            .insert([
                {
                    username: username,
                    password_hash: passwordHash,
                    rol: rol,
                    nombre: nombre,
                    email: email,
                    activo: activo
                }
            ]);

        if (error) {
            throw error;
        }

        // Registrar log
        await registrarLog('crear', 'usuarios', username, {
            username: username,
            rol: rol
        });

        alert('Usuario creado exitosamente');
        document.getElementById('form-registro-usuario').reset();

        // Recargar la lista de usuarios
        await cargarUsuarios();

    } catch (error) {
        console.error('Error creando usuario:', error);
        
        if (error.code === '42P01') {
            // Tabla no existe
            alert('Error: La tabla de usuarios no existe. Contacta al administrador.');
        } else {
            alert('Error al crear usuario: ' + error.message);
        }
    }
}

function editarUsuario(idUsuario) {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para editar usuarios');
        return;
    }
    
    const usuario = usuarios.find(user => user.id === idUsuario);
    if (!usuario) return;
    
    // Llenar el formulario con los datos del usuario
    document.getElementById('edit_usuario_id').value = usuario.id;
    document.getElementById('edit_username').value = usuario.username;
    document.getElementById('edit_nombre_usuario').value = usuario.nombre;
    document.getElementById('edit_email_usuario').value = usuario.email || '';
    document.getElementById('edit_rol_usuario').value = usuario.rol;
    document.getElementById('edit_activo_usuario').checked = usuario.activo;
    document.getElementById('edit_password_usuario').value = '';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    modal.show();
}

async function guardarEdicionUsuario() {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para editar usuarios');
        return;
    }
    
    try {
        const usuarioActualizado = {
            nombre: document.getElementById('edit_nombre_usuario').value,
            email: document.getElementById('edit_email_usuario').value,
            rol: document.getElementById('edit_rol_usuario').value,
            activo: document.getElementById('edit_activo_usuario').checked,
            fecha_actualizacion: new Date()
        };
        
        // Si se proporcionó una nueva contraseña, actualizarla
        const nuevaPassword = document.getElementById('edit_password_usuario').value;
        if (nuevaPassword) {
            usuarioActualizado.password_hash = btoa(nuevaPassword);
        }
        
        const idUsuario = document.getElementById('edit_usuario_id').value;
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .update(usuarioActualizado)
            .eq('id', idUsuario);
        
        if (error) {
            throw error;
        }
        
        // Registrar log
        await registrarLog('actualizar', 'usuarios', idUsuario, {
            username: document.getElementById('edit_username').value
        });
        
        alert('Usuario actualizado exitosamente');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario'));
        modal.hide();
        
        await cargarUsuarios();
        
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        alert('Error al actualizar usuario: ' + error.message);
    }
}

async function eliminarUsuario(idUsuario) {
    // Verificar permisos
    if (usuarioActual.rol !== 'admin') {
        alert('No tiene permisos para eliminar usuarios');
        return;
    }
    
    const usuario = usuarios.find(user => user.id === idUsuario);
    if (!usuario) return;
    
    // No permitir eliminar al usuario actual
    if (usuario.id === usuarioActual.id) {
        alert('No puedes eliminar tu propio usuario');
        return;
    }
    
    if (!confirm(`¿Está seguro de que desea eliminar al usuario "${usuario.username}"?`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .delete()
            .eq('id', idUsuario);
        
        if (error) {
            throw error;
        }
        
        // Registrar log
        await registrarLog('eliminar', 'usuarios', idUsuario, {
            username: usuario.username
        });
        
        alert('Usuario eliminado exitosamente');
        await cargarUsuarios();
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('Error al eliminar usuario: ' + error.message);
    }
}

function actualizarTablaUsuarios() {
    const tabla = document.getElementById('tabla-usuarios');
    
    if (usuarios.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    const html = usuarios.map(usuario => {
        const estadoBadge = usuario.activo 
            ? '<span class="badge bg-success">Activo</span>' 
            : '<span class="badge bg-secondary">Inactivo</span>';
        
        const rolBadge = usuario.rol === 'admin' 
            ? '<span class="badge bg-primary">Administrador</span>' 
            : '<span class="badge bg-info">Visitante</span>';
        
        const ultimoLogin = usuario.ultimo_login 
            ? new Date(usuario.ultimo_login).toLocaleDateString('es-ES')
            : 'Nunca';
        
        // Determinar si mostrar botones de acción
        const botonesAccion = usuarioActual.rol === 'admin' 
            ? `
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" onclick="editarUsuario('${usuario.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="eliminarUsuario('${usuario.id}')" ${usuario.id === usuarioActual.id ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `
            : '<span class="text-muted">Solo lectura</span>';
        
        return `
            <tr>
                <td data-label="Usuario">${usuario.username}</td>
                <td data-label="Nombre">${usuario.nombre}</td>
                <td data-label="Email">${usuario.email || '-'}</td>
                <td data-label="Rol">${rolBadge}</td>
                <td data-label="Estado">${estadoBadge}</td>
                <td data-label="Último Login">${ultimoLogin}</td>
                <td data-label="Acciones">
                    ${botonesAccion}
                </td>
            </tr>
        `;
    }).join('');
    
    tabla.innerHTML = html;
    
    // Actualizar tablas responsivas
    setTimeout(actualizarTablasResponsivas, 100);
}