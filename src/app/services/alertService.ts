// alertService.ts
import Swal from "sweetalert2";

const SESSION_EXPIRED_FLAG = "sessionExpired";
const SESSION_EXPIRED_ALERT_SHOWN = "sessionExpiredAlertShown";

export function showErrorAlert(message?: string, code?: string | number) {
  const sessionExpired = sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "true";
  if (sessionExpired) {
    const alreadyShown = sessionStorage.getItem(SESSION_EXPIRED_ALERT_SHOWN) === "true";
    sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
    if (alreadyShown) return;
    sessionStorage.setItem(SESSION_EXPIRED_ALERT_SHOWN, "true");

    (Swal as any).fire({
      target: document.getElementById('swal-container'),
      customClass: {
        popup: "mi-swal-popup"
      },
      icon: "warning",
      title: "Aviso",
      text: "Tu sesion ha expirado. Inicia sesion de nuevo."
    });
    return;
  }

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
