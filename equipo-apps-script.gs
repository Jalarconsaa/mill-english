/**
 * Mill English · Seguimiento del equipo
 * Pega este código en Extensiones → Apps Script de tu planilla de Google Sheets.
 * Luego: Implementar → Nueva implementación → Aplicación web
 *   Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 */
const HOJA = 'Registro';
const COLS = ['Fecha', 'Usuario', 'Cargo / área', 'Nivel', 'Minutos', 'Dictados', 'Deletreos',
  'Conversaciones', 'Listening', 'Errores guardados', 'Racha (días)', 'Minutos totales', 'Actualizado', 'ID'];

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA);
  if (!sh) sh = ss.insertSheet(HOJA);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#F2B705');
    sh.getRange('A:A').setNumberFormat('@'); // la fecha se guarda como texto AAAA-MM-DD
  }
  return sh;
}
function fecha_(v) {
  return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v);
}

// La app envía el avance del día de cada usuario
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = hoja_();
    const fila = [String(d.date), d.name, d.role, d.level, d.minutes, d.dict, d.spell, d.talk, d.listen,
      d.notes, d.streak, d.totalMinutes, new Date(), d.user_id];
    const datos = sh.getDataRange().getValues();
    for (let i = datos.length - 1; i >= 1; i--) {
      if (String(datos[i][13]) === String(d.user_id) && fecha_(datos[i][0]) === String(d.date)) {
        sh.getRange(i + 1, 1, 1, fila.length).setValues([fila]);
        return ContentService.createTextOutput('ok');
      }
    }
    sh.appendRow(fila);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// El panel del equipo en la app lee los últimos 60 días
function doGet() {
  const datos = hoja_().getDataRange().getValues().slice(1);
  const desde = new Date(); desde.setDate(desde.getDate() - 60);
  const limite = Utilities.formatDate(desde, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const filas = datos.filter(r => fecha_(r[0]) >= limite).map(r => ({
    fecha: fecha_(r[0]), usuario: r[1], cargo: r[2], nivel: r[3], minutos: r[4], dictados: r[5], deletreos: r[6],
    conversaciones: r[7], listening: r[8], errores: r[9], racha: r[10], total: r[11], id: String(r[13])
  }));
  return ContentService.createTextOutput(JSON.stringify(filas)).setMimeType(ContentService.MimeType.JSON);
}
