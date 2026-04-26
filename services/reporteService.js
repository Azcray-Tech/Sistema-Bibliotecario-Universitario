const PDFDocument = require('pdfkit');
const ExcelJS     = require('exceljs');
const { Material, Ejemplar, Prestamo, Usuario, Libro, Tesis, Revista, Anuario, Autor } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const INCLUDE_FULL = [
  { model: Libro,    as: 'libro',    required: false,
    include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
  { model: Tesis,    as: 'tesis',    required: false },
  { model: Revista,  as: 'revista',  required: false },
  { model: Anuario,  as: 'anuario',  required: false },
  { model: Ejemplar, as: 'ejemplares', required: false }
];

function getAutores(m) {
  if (m.libro && m.libro.autores && m.libro.autores.length)
    return m.libro.autores.map(a => a.nombre).join(', ');
  if (m.tesis && m.tesis.autores && m.tesis.autores.length)
    return m.tesis.autores.map(a => a.nombre).join(', ');
  return '-';
}

function getCodigo(m) {
  if (m.libro && m.libro.isbn) return m.libro.isbn;
  if (m.revista && m.revista.issn) return m.revista.issn;
  return '-';
}

function contarEjemplares(m) {
  const ejs = m.ejemplares || [];
  return {
    total:       ejs.length,
    disponibles: ejs.filter(e => e.estado === 'disponible').length,
    prestados:   ejs.filter(e => e.estado === 'prestado').length,
  };
}

// ── PDF helpers ──────────────────────────────────────────────

function pdfHeader(doc, titulo, subtitulo) {
  doc.fontSize(16).fillColor('#1a1a2e').text('Sistema Bibliográfico', { align: 'center' });
  doc.fontSize(12).fillColor('#333').text(titulo, { align: 'center' });
  if (subtitulo) doc.fontSize(9).fillColor('#666').text(subtitulo, { align: 'center' });
  doc.fontSize(8).fillColor('#999').text('Generado: ' + new Date().toLocaleString('es-VE'), { align: 'right' });
  doc.moveDown(0.4);
  doc.moveTo(30, doc.y).lineTo(800, doc.y).strokeColor('#ccc').lineWidth(0.5).stroke();
  doc.moveDown(0.4);
}

// Dibuja cabecera de tabla con fondo oscuro
function pdfTableHeader(doc, cols, startX) {
  const y = doc.y;
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  doc.rect(startX, y, totalW, 16).fill('#1a1a2e');
  doc.fillColor('#fff').fontSize(7.5);
  let x = startX + 3;
  cols.forEach(c => {
    doc.text(c.label, x, y + 4, { width: c.w - 4, lineBreak: false });
    x += c.w;
  });
  doc.y = y + 17;
  doc.fillColor('#000');
}

// Dibuja una fila calculando la altura necesaria según el texto más largo
function pdfRow(doc, cols, values, shade, startX, pageH) {
  const fontSize = 7.5;
  doc.fontSize(fontSize);

  // Calcular altura necesaria
  let maxLines = 1;
  cols.forEach((c, i) => {
    const txt = String(values[i] || '-');
    const charsPerLine = Math.floor((c.w - 6) / (fontSize * 0.52));
    const lines = Math.ceil(txt.length / Math.max(charsPerLine, 1));
    if (lines > maxLines) maxLines = lines;
  });
  const rowH = Math.max(14, maxLines * (fontSize + 2) + 4);

  // Salto de página si no cabe
  if (doc.y + rowH > pageH - 30) return true; // señal de salto necesario

  const y = doc.y;
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  if (shade) doc.rect(startX, y, totalW, rowH).fill('#f7f7f7');

  doc.fillColor('#222');
  let x = startX + 3;
  cols.forEach((c, i) => {
    doc.text(String(values[i] || '-'), x, y + 3, {
      width: c.w - 6,
      height: rowH - 4,
      lineBreak: true,
      ellipsis: false
    });
    x += c.w;
  });

  // Línea separadora
  doc.moveTo(startX, y + rowH).lineTo(startX + totalW, y + rowH)
     .strokeColor('#e0e0e0').lineWidth(0.3).stroke();

  doc.y = y + rowH;
  return false;
}

function excelHeaderStyle(ws) {
  ws.getRow(1).eachCell(cell => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
    cell.font      = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  ws.getRow(1).height = 22;
}

// ════════════════════════════════════════════════════════════
// 1. INVENTARIO COMPLETO
// ════════════════════════════════════════════════════════════
// Página A4 landscape = 841.89 x 595.28 pt, margins 30
// Área útil ≈ 782pt de ancho

exports.inventarioCompletoPDF = async (res) => {
  const mats = await Material.findAll({ include: INCLUDE_FULL, order: [['categoria','ASC'],['titulo','ASC']] });
  const doc  = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=inventario_completo.pdf');
  doc.pipe(res);

  const PAGE_H = 595;
  const START_X = 30;

  // Anchos ajustados para 782pt total
  const cols = [
    { label: 'Título',       w: 200 },
    { label: 'Autor(es)',    w: 140 },
    { label: 'Categoría',   w: 95  },
    { label: 'Tipo',        w: 50  },
    { label: 'ISBN/ISSN',   w: 110 },
    { label: 'Ej. Total',   w: 50  },
    { label: 'Disponib.',   w: 52  },
    { label: 'Signatura',   w: 85  },
  ]; // total = 782

  pdfHeader(doc, 'Inventario Completo de Materiales', `Total: ${mats.length} títulos`);
  pdfTableHeader(doc, cols, START_X);

  mats.forEach((m, i) => {
    const c = contarEjemplares(m);
    const necesitaSalto = pdfRow(doc, cols, [
      m.titulo, getAutores(m), m.categoria, m.tipo,
      getCodigo(m), c.total, c.disponibles, m.signatura || '-'
    ], i % 2 === 0, START_X, PAGE_H);

    if (necesitaSalto) {
      doc.addPage({ layout: 'landscape', margin: 30 });
      pdfHeader(doc, 'Inventario Completo de Materiales', `(continuación)`);
      pdfTableHeader(doc, cols, START_X);
      pdfRow(doc, cols, [
        m.titulo, getAutores(m), m.categoria, m.tipo,
        getCodigo(m), c.total, c.disponibles, m.signatura || '-'
      ], i % 2 === 0, START_X, PAGE_H);
    }
  });

  doc.end();
};

exports.inventarioCompletoExcel = async (res) => {
  const mats = await Material.findAll({ include: INCLUDE_FULL, order: [['categoria','ASC'],['titulo','ASC']] });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Bibliográfico';
  const ws = wb.addWorksheet('Inventario Completo');
  ws.columns = [
    { header: 'Título',       key: 'titulo',       width: 45 },
    { header: 'Autor(es)',    key: 'autores',      width: 30 },
    { header: 'Categoría',   key: 'categoria',    width: 22 },
    { header: 'Tipo',        key: 'tipo',         width: 10 },
    { header: 'ISBN / ISSN', key: 'codigo',       width: 22 },
    { header: 'Año',         key: 'anio',         width: 7  },
    { header: 'Signatura',   key: 'signatura',    width: 30 },
    { header: 'Ej. Total',   key: 'total',        width: 10 },
    { header: 'Disponibles', key: 'disponibles',  width: 12 },
    { header: 'Prestados',   key: 'prestados',    width: 10 },
  ];
  excelHeaderStyle(ws);
  mats.forEach((m, i) => {
    const c = contarEjemplares(m);
    const row = ws.addRow({
      titulo: m.titulo, autores: getAutores(m), categoria: m.categoria,
      tipo: m.tipo, codigo: getCodigo(m), anio: m.anio || '',
      signatura: m.signatura || '', total: c.total,
      disponibles: c.disponibles, prestados: c.prestados
    });
    row.alignment = { wrapText: true, vertical: 'top' };
    if (i % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=inventario_completo.xlsx');
  await wb.xlsx.write(res); res.end();
};

// ════════════════════════════════════════════════════════════
// 2. INVENTARIO POR CATEGORÍA
// ════════════════════════════════════════════════════════════

exports.inventarioCategoriaPDF = async (res, categoria) => {
  const mats = await Material.findAll({ where: { categoria }, include: INCLUDE_FULL, order: [['titulo','ASC']] });
  const doc  = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=inventario_${categoria}.pdf`);
  doc.pipe(res);

  const PAGE_H = 595, START_X = 30;
  const cols = [
    { label: 'Título',      w: 230 },
    { label: 'Autor(es)',   w: 160 },
    { label: 'ISBN/ISSN',  w: 120 },
    { label: 'Año',        w: 40  },
    { label: 'Ej. Total',  w: 55  },
    { label: 'Disponib.',  w: 55  },
    { label: 'Signatura',  w: 122 },
  ]; // total = 782

  pdfHeader(doc, `Inventario — ${categoria}`, `${mats.length} título(s)`);
  pdfTableHeader(doc, cols, START_X);
  mats.forEach((m, i) => {
    const c = contarEjemplares(m);
    const salto = pdfRow(doc, cols, [m.titulo, getAutores(m), getCodigo(m), m.anio||'-', c.total, c.disponibles, m.signatura||'-'], i%2===0, START_X, PAGE_H);
    if (salto) {
      doc.addPage({ layout:'landscape', margin:30 });
      pdfHeader(doc, `Inventario — ${categoria}`, '(continuación)');
      pdfTableHeader(doc, cols, START_X);
      pdfRow(doc, cols, [m.titulo, getAutores(m), getCodigo(m), m.anio||'-', c.total, c.disponibles, m.signatura||'-'], i%2===0, START_X, PAGE_H);
    }
  });
  doc.end();
};

exports.inventarioCategoriaExcel = async (res, categoria) => {
  const mats = await Material.findAll({ where: { categoria }, include: INCLUDE_FULL, order: [['titulo','ASC']] });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(categoria.substring(0,31));
  ws.columns = [
    { header: 'Título',       key: 'titulo',      width: 45 },
    { header: 'Autor(es)',    key: 'autores',     width: 30 },
    { header: 'ISBN / ISSN', key: 'codigo',      width: 22 },
    { header: 'Año',         key: 'anio',        width: 7  },
    { header: 'Signatura',   key: 'signatura',   width: 30 },
    { header: 'Ej. Total',   key: 'total',       width: 10 },
    { header: 'Disponibles', key: 'disponibles', width: 12 },
  ];
  excelHeaderStyle(ws);
  mats.forEach((m, i) => {
    const c = contarEjemplares(m);
    const row = ws.addRow({ titulo: m.titulo, autores: getAutores(m), codigo: getCodigo(m), anio: m.anio||'', signatura: m.signatura||'', total: c.total, disponibles: c.disponibles });
    row.alignment = { wrapText: true, vertical: 'top' };
    if (i%2===0) row.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF5F5F5' } };
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=inventario_${categoria}.xlsx`);
  await wb.xlsx.write(res); res.end();
};

// ════════════════════════════════════════════════════════════
// 3. INVENTARIO POR TIPO
// ════════════════════════════════════════════════════════════

exports.inventarioTipoPDF = async (res, tipo) => {
  const mats = await Material.findAll({ where: { tipo }, include: INCLUDE_FULL, order: [['titulo','ASC']] });
  const doc  = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=inventario_${tipo}s.pdf`);
  doc.pipe(res);

  const PAGE_H = 595, START_X = 30;
  const cols = [
    { label: 'Título',      w: 210 },
    { label: 'Autor(es)',   w: 150 },
    { label: 'Categoría',  w: 95  },
    { label: 'ISBN/ISSN',  w: 110 },
    { label: 'Año',        w: 40  },
    { label: 'Ej. Total',  w: 52  },
    { label: 'Disponib.',  w: 52  },
    { label: 'Signatura',  w: 73  },
  ]; // total = 782

  pdfHeader(doc, `Inventario de ${tipo.charAt(0).toUpperCase()+tipo.slice(1)}s`, `${mats.length} título(s)`);
  pdfTableHeader(doc, cols, START_X);
  mats.forEach((m, i) => {
    const c = contarEjemplares(m);
    const salto = pdfRow(doc, cols, [m.titulo, getAutores(m), m.categoria, getCodigo(m), m.anio||'-', c.total, c.disponibles, m.signatura||'-'], i%2===0, START_X, PAGE_H);
    if (salto) {
      doc.addPage({ layout:'landscape', margin:30 });
      pdfHeader(doc, `Inventario de ${tipo.charAt(0).toUpperCase()+tipo.slice(1)}s`, '(continuación)');
      pdfTableHeader(doc, cols, START_X);
      pdfRow(doc, cols, [m.titulo, getAutores(m), m.categoria, getCodigo(m), m.anio||'-', c.total, c.disponibles, m.signatura||'-'], i%2===0, START_X, PAGE_H);
    }
  });
  doc.end();
};

exports.inventarioTipoExcel = async (res, tipo) => {
  const mats = await Material.findAll({ where: { tipo }, include: INCLUDE_FULL, order: [['titulo','ASC']] });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(tipo.charAt(0).toUpperCase()+tipo.slice(1)+'s');
  ws.columns = [
    { header: 'Título',       key: 'titulo',      width: 45 },
    { header: 'Autor(es)',    key: 'autores',     width: 30 },
    { header: 'Categoría',   key: 'categoria',   width: 22 },
    { header: 'ISBN / ISSN', key: 'codigo',      width: 22 },
    { header: 'Año',         key: 'anio',        width: 7  },
    { header: 'Signatura',   key: 'signatura',   width: 30 },
    { header: 'Ej. Total',   key: 'total',       width: 10 },
    { header: 'Disponibles', key: 'disponibles', width: 12 },
  ];
  excelHeaderStyle(ws);
  mats.forEach((m, i) => {
    const c = contarEjemplares(m);
    const row = ws.addRow({ titulo: m.titulo, autores: getAutores(m), categoria: m.categoria, codigo: getCodigo(m), anio: m.anio||'', signatura: m.signatura||'', total: c.total, disponibles: c.disponibles });
    row.alignment = { wrapText: true, vertical: 'top' };
    if (i%2===0) row.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF5F5F5' } };
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=inventario_${tipo}s.xlsx`);
  await wb.xlsx.write(res); res.end();
};

// ════════════════════════════════════════════════════════════
// 4. PRÉSTAMOS ACTIVOS
// ════════════════════════════════════════════════════════════

exports.prestamosActivosPDF = async (res) => {
  const prestamos = await Prestamo.findAll({
    where: { estado: 'activo' },
    include: [
      { model: Ejemplar, include: [{ model: Material }] },
      { model: Usuario }
    ],
    order: [['fecha_devolucion','ASC']]
  });
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=prestamos_activos.pdf');
  doc.pipe(res);

  const PAGE_H = 595, START_X = 30;
  const cols = [
    { label: 'Usuario',        w: 150 },
    { label: 'Cédula',        w: 80  },
    { label: 'Material',      w: 200 },
    { label: 'Ej. (código)',  w: 90  },
    { label: 'F. Préstamo',   w: 75  },
    { label: 'F. Devolución', w: 75  },
    { label: 'Renovado',      w: 55  },
    { label: 'Estado',        w: 57  },
  ]; // total = 782

  const hoy = new Date();
  pdfHeader(doc, 'Préstamos Activos', `${prestamos.length} préstamo(s) en curso — ${new Date().toLocaleDateString('es-VE')}`);
  pdfTableHeader(doc, cols, START_X);

  prestamos.forEach((p, i) => {
    const dev   = new Date(p.fecha_devolucion);
    const diasR = Math.floor((hoy - dev) / 86400000);
    const estado = diasR > 0 ? `VENCIDO ${diasR}d` : 'Al día';
    const vals = [
      p.Usuario ? p.Usuario.nombre+' '+p.Usuario.apellido : '-',
      p.Usuario?.cedula || '-',
      p.Ejemplar?.Material?.titulo || '-',
      p.Ejemplar?.codigo_inventario || '-',
      new Date(p.fecha_salida).toLocaleDateString('es-VE'),
      dev.toLocaleDateString('es-VE'),
      p.renovado ? 'Sí' : 'No',
      estado
    ];
    const salto = pdfRow(doc, cols, vals, i%2===0, START_X, PAGE_H);
    if (salto) {
      doc.addPage({ layout:'landscape', margin:30 });
      pdfHeader(doc, 'Préstamos Activos', '(continuación)');
      pdfTableHeader(doc, cols, START_X);
      pdfRow(doc, cols, vals, i%2===0, START_X, PAGE_H);
    }
  });
  doc.end();
};

exports.prestamosActivosExcel = async (res) => {
  const prestamos = await Prestamo.findAll({
    where: { estado: 'activo' },
    include: [{ model: Ejemplar, include: [{ model: Material }] }, { model: Usuario }],
    order: [['fecha_devolucion','ASC']]
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Préstamos Activos');
  ws.columns = [
    { header: 'Usuario',        key: 'usuario',     width: 30 },
    { header: 'Cédula',        key: 'cedula',      width: 15 },
    { header: 'Material',      key: 'material',    width: 45 },
    { header: 'Cód. Ejemplar', key: 'ejemplar',    width: 18 },
    { header: 'F. Préstamo',   key: 'fprestamo',   width: 14 },
    { header: 'F. Devolución', key: 'fdevolucion', width: 14 },
    { header: 'Renovado',      key: 'renovado',    width: 10 },
    { header: 'Días restantes',key: 'dias',        width: 15 },
  ];
  excelHeaderStyle(ws);
  const hoy = new Date();
  prestamos.forEach((p, i) => {
    const dev  = new Date(p.fecha_devolucion);
    const dias = Math.floor((dev - hoy) / 86400000);
    const row  = ws.addRow({
      usuario:     p.Usuario ? p.Usuario.nombre+' '+p.Usuario.apellido : '-',
      cedula:      p.Usuario?.cedula || '-',
      material:    p.Ejemplar?.Material?.titulo || '-',
      ejemplar:    p.Ejemplar?.codigo_inventario || '-',
      fprestamo:   new Date(p.fecha_salida).toLocaleDateString('es-VE'),
      fdevolucion: dev.toLocaleDateString('es-VE'),
      renovado:    p.renovado ? 'Sí' : 'No',
      dias:        dias < 0 ? `Vencido (${Math.abs(dias)}d)` : `${dias} días`,
    });
    if (dias < 0)      row.getCell('dias').font = { color: { argb: 'FFCC0000' }, bold: true };
    else if (dias <= 2) row.getCell('dias').font = { color: { argb: 'FFCC6600' }, bold: true };
    if (i%2===0) row.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF5F5F5' } };
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=prestamos_activos.xlsx');
  await wb.xlsx.write(res); res.end();
};

// ════════════════════════════════════════════════════════════
// 5. MÁS SOLICITADOS
// ════════════════════════════════════════════════════════════

exports.masSolicitadosPDF = async (res) => {
  const datos = await Prestamo.findAll({
    attributes: [[fn('COUNT', col('Prestamo.id')), 'total_prestamos'], 'ejemplar_id'],
    include: [{ model: Ejemplar, attributes: ['material_id'],
      include: [{ model: Material, attributes: ['id','titulo','categoria','tipo'] }] }],
    group: ['Ejemplar.material_id'],
    order: [[literal('total_prestamos'), 'DESC']],
    limit: 50
  });
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=mas_solicitados.pdf');
  doc.pipe(res);

  const PAGE_H = 841, START_X = 30;
  const cols = [
    { label: '#',          w: 25  },
    { label: 'Título',    w: 290 },
    { label: 'Categoría',w: 110 },
    { label: 'Tipo',     w: 60  },
    { label: 'Préstamos',w: 55  },
  ]; // total = 540 (A4 portrait 535pt útil)

  pdfHeader(doc, 'Materiales Más Solicitados', 'Top 50 por número de préstamos históricos');
  pdfTableHeader(doc, cols, START_X);
  datos.forEach((d, i) => {
    const mat  = d.Ejemplar?.Material;
    const salto = pdfRow(doc, cols, [i+1, mat?.titulo||'-', mat?.categoria||'-', mat?.tipo||'-', d.dataValues.total_prestamos], i%2===0, START_X, PAGE_H);
    if (salto) {
      doc.addPage({ margin:30 });
      pdfHeader(doc, 'Materiales Más Solicitados', '(continuación)');
      pdfTableHeader(doc, cols, START_X);
      pdfRow(doc, cols, [i+1, mat?.titulo||'-', mat?.categoria||'-', mat?.tipo||'-', d.dataValues.total_prestamos], i%2===0, START_X, PAGE_H);
    }
  });
  doc.end();
};

exports.masSolicitadosExcel = async (res) => {
  const datos = await Prestamo.findAll({
    attributes: [[fn('COUNT', col('Prestamo.id')), 'total_prestamos'], 'ejemplar_id'],
    include: [{ model: Ejemplar, attributes: ['material_id'],
      include: [{ model: Material, attributes: ['id','titulo','categoria','tipo'] }] }],
    group: ['Ejemplar.material_id'],
    order: [[literal('total_prestamos'), 'DESC']],
    limit: 50
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Más Solicitados');
  ws.columns = [
    { header: '#',          key: 'pos',    width: 6  },
    { header: 'Título',    key: 'titulo', width: 50 },
    { header: 'Categoría',key: 'cat',    width: 22 },
    { header: 'Tipo',     key: 'tipo',   width: 12 },
    { header: 'Préstamos',key: 'total',  width: 12 },
  ];
  excelHeaderStyle(ws);
  datos.forEach((d, i) => {
    const mat = d.Ejemplar?.Material;
    ws.addRow({ pos: i+1, titulo: mat?.titulo||'-', cat: mat?.categoria||'-', tipo: mat?.tipo||'-', total: d.dataValues.total_prestamos });
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=mas_solicitados.xlsx');
  await wb.xlsx.write(res); res.end();
};