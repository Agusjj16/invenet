
const escaparHTML = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caracter]);

export function imprimirInventario(ventana, activos, nombreAdministrador) {
  const fecha = new Date().toLocaleString("es-AR");

  const filas = activos.map((activo) => `
    <tr>
      <td>${escaparHTML(activo.codigo_inventario)}</td>
      <td>${escaparHTML(activo.categoria?.nombre ?? "Sin categoría")}</td>
      <td>${escaparHTML(activo.marca || "Sin marca")}</td>
      <td>${escaparHTML(activo.modelo || "Sin modelo")}</td>
      <td>${escaparHTML(activo.ubicacion?.nombre ?? "Sin ubicación")}</td>
      <td>${escaparHTML(activo.estado?.nombre ?? "Sin estado")}</td>
    </tr>
  `).join("");

  ventana.document.open();
  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Inventario de activos - Invenet</title>

        <style>
          @page {
            size: A4 landscape;
            margin: 15mm 15mm 20mm 15mm;

            @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-family: Arial, sans-serif;
                font-size: 10px;
                color: #64748b;
            }
        }

          body {
            font-family: Arial, sans-serif;
            color: #1e293b;
            font-size: 11px;
          }

          header {
            border-bottom: 2px solid #1d4ed8;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }

          h1 {
            font-size: 22px;
            margin: 8px 0;
          }

          .institucion {
            font-weight: bold;
            color: #1d4ed8;
            text-transform: uppercase;
          }

          .subtitulo {
            color: #64748b;
          }

          .informacion {
            display: flex;
            justify-content: space-between;
            margin-bottom: 18px;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th, td {
            padding: 9px 7px;
            border: 1px solid #cbd5e1;
            text-align: left;
            overflow-wrap: anywhere;
          }

          th {
            background: #e2e8f0;
            font-weight: bold;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          thead {
            display: table-header-group;
          }

          footer {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <header>
          <div class="institucion">ESCOM N.º 44</div>
          <h1>Informe de inventario de activos</h1>
          <div class="subtitulo">
            Sistema de Gestión de Activos Informáticos - Invenet
          </div>
        </header>

        <div class="informacion">
            <div>
                <strong>Emitido por:</strong>
                ${escaparHTML(nombreAdministrador)}
            </div>

            <div>
                <strong>Fecha de emisión:</strong>
                ${escaparHTML(fecha)}
            </div>

            <div>
                <strong>Total de activos:</strong>
                ${activos.length}
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Ubicación</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>${filas}</tbody>
        </table>

        <footer>
          Documento generado mediante Invenet - ESCOM N.º 44
        </footer>
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();
  ventana.print();
}
