// ========== MÓDULO DE REPORTES PDF ORGANIZADOS POR SUCURSAL ==========

function generarReporteGeneral() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('REPORTE GENERAL DE EMPLEADOS', 105, 15, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 22, { align: 'center' });
    doc.text(`Usuario: ${usuarioActual.nombre}`, 105, 27, { align: 'center' });
    
    // Agrupar empleados por sucursal
    const empleadosPorSucursal = agruparEmpleadosPorSucursal(empleados);
    const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
    
    let yPos = 35;
    let totalGeneralEmpleados = 0;
    let totalGeneralSalarios = 0;
    
    // Recorrer cada sucursal
    sucursalesOrdenadas.forEach((sucursal, index) => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        
        // Si no hay espacio, crear nueva página
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // Encabezado de sucursal
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text(`SUCURSAL ${sucursal}`, 14, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total empleados: ${empleadosSucursal.length}`, 14, yPos);
        yPos += 5;
        
        // Tabla de empleados de la sucursal
        const headers = [['ID', 'Nombre', 'Puesto', 'Antigüedad', 'Salario']];
        
        let totalSalariosSucursal = 0;
        const data = empleadosSucursal.map(emp => {
            const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
            totalSalariosSucursal += parseFloat(emp.salario_base || 0);
            
            return [
                emp.id_empleado,
                `${emp.nombre} ${emp.apellido}`,
                emp.puesto,
                antiguedadExacta.textoCorto,
                `$${parseFloat(emp.salario_base).toLocaleString('es-ES')}`
            ];
        });
        
        // Agregar total de la sucursal
        data.push([
            '', '', '', 'TOTAL SUCURSAL:',
            `$${totalSalariosSucursal.toLocaleString('es-ES')}`
        ]);
        
        doc.autoTable({
            head: headers,
            body: data,
            startY: yPos,
            styles: { fontSize: 8 },
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: 255
            },
            margin: { left: 14, right: 14 },
            didDrawCell: function(data) {
                // Resaltar la fila de total
                if (data.row.index === data.table.body.length - 1) {
                    doc.setFillColor(209, 236, 241);
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        totalGeneralEmpleados += empleadosSucursal.length;
        totalGeneralSalarios += totalSalariosSucursal;
        
        // Línea separadora entre sucursales
        if (index < sucursalesOrdenadas.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, 200, yPos);
            yPos += 5;
        }
    });
    
    // Resumen general en nueva página
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('RESUMEN GENERAL', 105, yPos, { align: 'center' });
    yPos += 15;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Tabla de resumen por sucursal
    const headersResumen = [['Sucursal', 'Empleados', 'Salario Total', 'Salario Promedio']];
    const dataResumen = sucursalesOrdenadas.map(sucursal => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        const totalSalarios = empleadosSucursal.reduce((total, emp) => total + parseFloat(emp.salario_base || 0), 0);
        const salarioPromedio = empleadosSucursal.length > 0 ? totalSalarios / empleadosSucursal.length : 0;
        
        return [
            sucursal,
            empleadosSucursal.length.toString(),
            `$${totalSalarios.toLocaleString('es-ES')}`,
            `$${salarioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
        ];
    });
    
    // Agregar total general
    dataResumen.push([
        'TOTAL GENERAL',
        totalGeneralEmpleados.toString(),
        `$${totalGeneralSalarios.toLocaleString('es-ES')}`,
        `$${(totalGeneralSalarios / totalGeneralEmpleados).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
    ]);
    
    doc.autoTable({
        head: headersResumen,
        body: dataResumen,
        startY: yPos,
        styles: { fontSize: 10 },
        headStyles: { 
            fillColor: [41, 128, 185],
            textColor: 255
        },
        margin: { left: 14, right: 14 },
        didDrawCell: function(data) {
            // Resaltar la fila de total general
            if (data.row.index === data.table.body.length - 1) {
                doc.setFillColor(230, 230, 230);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'bold');
            }
        }
    });
    
    // Pie de página en todas las páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount} - Sistema RRHH`, 105, 285, { align: 'center' });
    }
    
    doc.save('reporte_general_empleados.pdf');
}

function generarReporteVacaciones() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('REPORTE DE VACACIONES POR SUCURSAL', 105, 15, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 22, { align: 'center' });
    doc.text(`Usuario: ${usuarioActual.nombre}`, 105, 27, { align: 'center' });
    
    // Agrupar empleados por sucursal
    const empleadosPorSucursal = agruparEmpleadosPorSucursal(empleados);
    const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
    
    let yPos = 35;
    let totalGeneralVacacionesPendientes = 0;
    
    // Recorrer cada sucursal
    sucursalesOrdenadas.forEach((sucursal, index) => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        
        // Si no hay espacio, crear nueva página
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // Encabezado de sucursal
        doc.setFontSize(14);
        doc.setTextColor(230, 126, 34);
        doc.text(`SUCURSAL ${sucursal}`, 14, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total empleados: ${empleadosSucursal.length}`, 14, yPos);
        yPos += 5;
        
        // Tabla de vacaciones de la sucursal
        const headers = [['Empleado', 'Antigüedad', 'Vac. Acumuladas', 'Vac. Tomadas', 'Vac. Pendientes']];
        
        let totalVacacionesPendientesSucursal = 0;
        const data = empleadosSucursal.map(emp => {
            const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            
            totalVacacionesPendientesSucursal += vacacionesPendientes;
            
            return [
                `${emp.nombre} ${emp.apellido}`,
                antiguedadExacta.textoCorto,
                `${vacacionesAcumuladas} días`,
                `${emp.dias_vacaciones_tomados || 0} días`,
                `${vacacionesPendientes} días`
            ];
        });
        
        // Agregar total de la sucursal
        data.push([
            '', '', '', 'TOTAL SUCURSAL:',
            `${totalVacacionesPendientesSucursal} días`
        ]);
        
        doc.autoTable({
            head: headers,
            body: data,
            startY: yPos,
            styles: { fontSize: 8 },
            headStyles: { 
                fillColor: [230, 126, 34],
                textColor: 255
            },
            margin: { left: 14, right: 14 },
            didDrawCell: function(data) {
                // Resaltar la fila de total
                if (data.row.index === data.table.body.length - 1) {
                    doc.setFillColor(253, 235, 208);
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        totalGeneralVacacionesPendientes += totalVacacionesPendientesSucursal;
        
        // Línea separadora entre sucursales
        if (index < sucursalesOrdenadas.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, 200, yPos);
            yPos += 5;
        }
    });
    
    // Resumen general en nueva página
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(230, 126, 34);
    doc.text('RESUMEN DE VACACIONES', 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Estadísticas generales
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    const totalEmpleados = empleados.length;
    const promedioVacaciones = totalEmpleados > 0 ? (totalGeneralVacacionesPendientes / totalEmpleados).toFixed(1) : 0;
    
    doc.text(`Total de empleados: ${totalEmpleados}`, 20, yPos);
    yPos += 7;
    doc.text(`Total días de vacaciones pendientes: ${totalGeneralVacacionesPendientes} días`, 20, yPos);
    yPos += 7;
    doc.text(`Promedio de vacaciones pendientes por empleado: ${promedioVacaciones} días`, 20, yPos);
    yPos += 15;
    
    // Tabla de resumen por sucursal
    const headersResumen = [['Sucursal', 'Empleados', 'Vac. Pendientes', 'Promedio por Empleado']];
    const dataResumen = sucursalesOrdenadas.map(sucursal => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        const totalVacaciones = empleadosSucursal.reduce((total, emp) => {
            const antiguedad = calcularAntiguedad(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedad);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            return total + vacacionesPendientes;
        }, 0);
        const promedio = empleadosSucursal.length > 0 ? (totalVacaciones / empleadosSucursal.length).toFixed(1) : 0;
        
        return [
            sucursal,
            empleadosSucursal.length.toString(),
            `${totalVacaciones} días`,
            `${promedio} días`
        ];
    });
    
    // Agregar total general
    dataResumen.push([
        'TOTAL GENERAL',
        totalEmpleados.toString(),
        `${totalGeneralVacacionesPendientes} días`,
        `${promedioVacaciones} días`
    ]);
    
    doc.autoTable({
        head: headersResumen,
        body: dataResumen,
        startY: yPos,
        styles: { fontSize: 10 },
        headStyles: { 
            fillColor: [230, 126, 34],
            textColor: 255
        },
        margin: { left: 14, right: 14 },
        didDrawCell: function(data) {
            // Resaltar la fila de total general
            if (data.row.index === data.table.body.length - 1) {
                doc.setFillColor(253, 235, 208);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'bold');
            }
        }
    });
    
    // Pie de página en todas las páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount} - Sistema RRHH`, 105, 285, { align: 'center' });
    }
    
    doc.save('reporte_vacaciones_por_sucursal.pdf');
}

function generarReporteSucursales() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('REPORTE DETALLADO POR SUCURSALES', 105, 15, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 22, { align: 'center' });
    doc.text(`Usuario: ${usuarioActual.nombre}`, 105, 27, { align: 'center' });
    
    // Agrupar empleados por sucursal
    const empleadosPorSucursal = agruparEmpleadosPorSucursal(empleados);
    const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
    
    let yPos = 35;
    let totalGeneralEmpleados = 0;
    let totalGeneralSalarios = 0;
    
    // Recorrer cada sucursal
    sucursalesOrdenadas.forEach((sucursal, index) => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        
        // Si no hay espacio, crear nueva página
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // Encabezado de sucursal
        doc.setFontSize(14);
        doc.setTextColor(52, 152, 219);
        doc.text(`SUCURSAL ${sucursal}`, 14, yPos);
        yPos += 7;
        
        // Estadísticas de la sucursal
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        const totalSalariosSucursal = empleadosSucursal.reduce((total, emp) => total + parseFloat(emp.salario_base || 0), 0);
        const salarioPromedio = empleadosSucursal.length > 0 ? totalSalariosSucursal / empleadosSucursal.length : 0;
        const antiguedadPromedio = empleadosSucursal.length > 0 ? 
            empleadosSucursal.reduce((total, emp) => total + calcularAntiguedad(emp.fecha_contratacion), 0) / empleadosSucursal.length : 0;
        
        doc.text(`Empleados: ${empleadosSucursal.length}`, 14, yPos);
        doc.text(`Salario total: $${totalSalariosSucursal.toLocaleString('es-ES')}`, 100, yPos);
        yPos += 5;
        
        doc.text(`Salario promedio: $${salarioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`, 14, yPos);
        doc.text(`Antigüedad promedio: ${antiguedadPromedio.toFixed(1)} años`, 100, yPos);
        yPos += 10;
        
        // Tabla detallada de empleados
        const headers = [['ID', 'Nombre', 'Puesto', 'Antigüedad', 'Salario', 'Vac. Pendientes']];
        
        const data = empleadosSucursal.map(emp => {
            const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            
            return [
                emp.id_empleado,
                `${emp.nombre} ${emp.apellido}`,
                emp.puesto,
                antiguedadExacta.textoCorto,
                `$${parseFloat(emp.salario_base).toLocaleString('es-ES')}`,
                `${vacacionesPendientes} días`
            ];
        });
        
        // Agregar total de la sucursal
        const totalVacacionesSucursal = empleadosSucursal.reduce((total, emp) => {
            const antiguedad = calcularAntiguedad(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedad);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            return total + vacacionesPendientes;
        }, 0);
        
        data.push([
            '', '', '', '', 'TOTAL SUCURSAL:',
            `${totalVacacionesSucursal} días`
        ]);
        
        doc.autoTable({
            head: headers,
            body: data,
            startY: yPos,
            styles: { fontSize: 7 },
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: 255
            },
            margin: { left: 14, right: 14 },
            didDrawCell: function(data) {
                // Resaltar la fila de total
                if (data.row.index === data.table.body.length - 1) {
                    doc.setFillColor(209, 236, 241);
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        totalGeneralEmpleados += empleadosSucursal.length;
        totalGeneralSalarios += totalSalariosSucursal;
        
        // Línea separadora entre sucursales (más espaciada)
        if (index < sucursalesOrdenadas.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, 200, yPos);
            yPos += 10;
        }
    });
    
    // Resumen ejecutivo en nueva página
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(52, 152, 219);
    doc.text('RESUMEN EJECUTIVO', 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Estadísticas generales
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    const salarioPromedioGeneral = totalGeneralEmpleados > 0 ? totalGeneralSalarios / totalGeneralEmpleados : 0;
    
    doc.text(`Total de sucursales: ${sucursalesOrdenadas.length}`, 20, yPos);
    yPos += 7;
    doc.text(`Total de empleados: ${totalGeneralEmpleados}`, 20, yPos);
    yPos += 7;
    doc.text(`Nómina total: $${totalGeneralSalarios.toLocaleString('es-ES')}`, 20, yPos);
    yPos += 7;
    doc.text(`Salario promedio: $${salarioPromedioGeneral.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`, 20, yPos);
    yPos += 15;
    
    // Tabla comparativa de sucursales
    const headersComparativa = [['Sucursal', 'Empleados', '% del Total', 'Salario Total', '% del Total', 'Salario Promedio']];
    
    const dataComparativa = sucursalesOrdenadas.map(sucursal => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        const totalSalarios = empleadosSucursal.reduce((total, emp) => total + parseFloat(emp.salario_base || 0), 0);
        const salarioPromedio = empleadosSucursal.length > 0 ? totalSalarios / empleadosSucursal.length : 0;
        const porcentajeEmpleados = ((empleadosSucursal.length / totalGeneralEmpleados) * 100).toFixed(1);
        const porcentajeSalarios = ((totalSalarios / totalGeneralSalarios) * 100).toFixed(1);
        
        return [
            sucursal,
            empleadosSucursal.length.toString(),
            `${porcentajeEmpleados}%`,
            `$${totalSalarios.toLocaleString('es-ES')}`,
            `${porcentajeSalarios}%`,
            `$${salarioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
        ];
    });
    
    // Agregar total general
    dataComparativa.push([
        'TOTAL GENERAL',
        totalGeneralEmpleados.toString(),
        '100%',
        `$${totalGeneralSalarios.toLocaleString('es-ES')}`,
        '100%',
        `$${salarioPromedioGeneral.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
    ]);
    
    doc.autoTable({
        head: headersComparativa,
        body: dataComparativa,
        startY: yPos,
        styles: { fontSize: 9 },
        headStyles: { 
            fillColor: [52, 152, 219],
            textColor: 255
        },
        margin: { left: 14, right: 14 },
        didDrawCell: function(data) {
            // Resaltar la fila de total general
            if (data.row.index === data.table.body.length - 1) {
                doc.setFillColor(230, 230, 230);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'bold');
            }
        }
    });
    
    // Pie de página en todas las páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount} - Sistema RRHH`, 105, 285, { align: 'center' });
    }
    
    doc.save('reporte_detallado_sucursales.pdf');
}

function exportarAExcel() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Encabezados
    const headers = ['Sucursal', 'ID', 'Nombre', 'Apellido', 'Puesto', 'Fecha Contratación', 'Antigüedad', 'Salario Base', 'Vacaciones Tomadas', 'Vacaciones Pendientes'];
    csvContent += headers.join(',') + '\r\n';
    
    // Agrupar empleados por sucursal
    const empleadosPorSucursal = agruparEmpleadosPorSucursal(empleados);
    const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
    
    // Datos organizados por sucursal
    sucursalesOrdenadas.forEach(sucursal => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        
        empleadosSucursal.forEach(emp => {
            const antiguedadExacta = calcularAntiguedadExacta(emp.fecha_contratacion);
            const vacacionesAcumuladas = calcularVacaciones(antiguedadExacta.años);
            const vacacionesPendientes = Math.max(0, vacacionesAcumuladas - (emp.dias_vacaciones_tomados || 0));
            
            const row = [
                sucursal,
                emp.id_empleado,
                emp.nombre,
                emp.apellido,
                emp.puesto,
                emp.fecha_contratacion,
                antiguedadExacta.textoCorto,
                emp.salario_base,
                emp.dias_vacaciones_tomados || 0,
                vacacionesPendientes
            ];
            csvContent += row.join(',') + '\r\n';
        });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "empleados_por_sucursal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generarReporteEstadisticas() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('REPORTE DE ESTADÍSTICAS POR SUCURSAL', 105, 15, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 22, { align: 'center' });
    doc.text(`Usuario: ${usuarioActual.nombre}`, 105, 27, { align: 'center' });
    
    // Agrupar empleados por sucursal
    const empleadosPorSucursal = agruparEmpleadosPorSucursal(empleados);
    const sucursalesOrdenadas = Object.keys(empleadosPorSucursal).sort();
    
    let yPos = 35;
    
    // Estadísticas generales
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('ESTADÍSTICAS GENERALES', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    const totalEmpleados = empleados.length;
    const totalSucursales = sucursalesOrdenadas.length;
    const totalSalarios = empleados.reduce((total, emp) => total + parseFloat(emp.salario_base || 0), 0);
    const salarioPromedio = totalEmpleados > 0 ? totalSalarios / totalEmpleados : 0;
    
    doc.text(`Total de empleados: ${totalEmpleados}`, 20, yPos);
    yPos += 5;
    doc.text(`Total de sucursales: ${totalSucursales}`, 20, yPos);
    yPos += 5;
    doc.text(`Nómina total: $${totalSalarios.toLocaleString('es-ES')}`, 20, yPos);
    yPos += 5;
    doc.text(`Salario promedio: $${salarioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`, 20, yPos);
    yPos += 10;
    
    // Estadísticas por sucursal
    doc.setFontSize(14);
    doc.text('ESTADÍSTICAS POR SUCURSAL', 14, yPos);
    yPos += 10;
    
    const headers = [['Sucursal', 'Empleados', '% Total', 'Salario Total', '% Total', 'Salario Promedio', 'Antig. Promedio']];
    
    const data = sucursalesOrdenadas.map(sucursal => {
        const empleadosSucursal = empleadosPorSucursal[sucursal];
        const totalSalariosSucursal = empleadosSucursal.reduce((total, emp) => total + parseFloat(emp.salario_base || 0), 0);
        const salarioPromedioSucursal = empleadosSucursal.length > 0 ? totalSalariosSucursal / empleadosSucursal.length : 0;
        const antiguedadPromedio = empleadosSucursal.length > 0 ? 
            empleadosSucursal.reduce((total, emp) => total + calcularAntiguedad(emp.fecha_contratacion), 0) / empleadosSucursal.length : 0;
        const porcentajeEmpleados = ((empleadosSucursal.length / totalEmpleados) * 100).toFixed(1);
        const porcentajeSalarios = ((totalSalariosSucursal / totalSalarios) * 100).toFixed(1);
        
        return [
            sucursal,
            empleadosSucursal.length.toString(),
            `${porcentajeEmpleados}%`,
            `$${totalSalariosSucursal.toLocaleString('es-ES')}`,
            `${porcentajeSalarios}%`,
            `$${salarioPromedioSucursal.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`,
            `${antiguedadPromedio.toFixed(1)} años`
        ];
    });
    
    // Agregar total general
    data.push([
        'TOTAL GENERAL',
        totalEmpleados.toString(),
        '100%',
        `$${totalSalarios.toLocaleString('es-ES')}`,
        '100%',
        `$${salarioPromedio.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`,
        `${(empleados.reduce((total, emp) => total + calcularAntiguedad(emp.fecha_contratacion), 0) / totalEmpleados).toFixed(1)} años`
    ]);
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { 
            fillColor: [102, 16, 242],
            textColor: 255
        },
        margin: { left: 14, right: 14 },
        didDrawCell: function(data) {
            // Resaltar la fila de total general
            if (data.row.index === data.table.body.length - 1) {
                doc.setFillColor(230, 230, 230);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'bold');
            }
        }
    });
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount} - Sistema RRHH`, 105, 285, { align: 'center' });
    }
    
    doc.save('reporte_estadisticas_sucursales.pdf');
}