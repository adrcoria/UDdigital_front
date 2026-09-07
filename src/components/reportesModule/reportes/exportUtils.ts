/**
 * Utilidades de exportacion compartidas por los reportes del modulo.
 * Centralizadas para que Excel y PDF se descarguen igual en todos los reportes.
 */

/** R-01_INVENTARIO_HATO_2026-09-07.xlsx */
export const buildReportFileName = (id: string, name: string, ext: string) =>
  `${id}_${name}_${new Date().toISOString().slice(0, 10)}.${ext}`;

export const triggerDownload = (url: string, fileName: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", fileName);
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/** Descarga un blob de respuesta y libera la URL temporal */
export const downloadBlob = (data: any, fileName: string, mime?: string) => {
  const blob = mime ? new Blob([data], { type: mime }) : new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  triggerDownload(url, fileName);
  window.URL.revokeObjectURL(url);
};
