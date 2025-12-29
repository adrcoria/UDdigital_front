// alertService.ts
import Swal from "sweetalert2";

export function showErrorAlert(message?: string, code?: string | number) {
  const suffix = code ? ` COD-${code}` : "";

  (Swal as any).fire({
    target: document.getElementById('swal-container'),
    customClass: {
      popup: "mi-swal-popup"
    },
    icon: "error",
    title: "Aviso",
    text: `${message || "OcurriÇü un error interno"}${suffix}`
  });
}

export function showSuccessAlert(message?: string) {
  (Swal as any).fire({
    target: document.getElementById('swal-container'),
    customClass: {
      popup: "mi-swal-popup"
    },
    icon: "success",
    title: "¡Éxito!",
    text: message || "OperaciÇün exitosa"
  });
}

export async function showConfirmAlert(
  title: string,
  message: string,
  confirmText = "Aceptar",
  cancelText = "Cancelar"
) {
  return (Swal as any).fire({
    target: document.getElementById("swal-container"),
    customClass: {
      popup: "mi-swal-popup",
    },
    title,
    text: message,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
}
