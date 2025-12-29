export function getBackendErrorMessage(err: any, defaultMsg = "Error desconocido") {
  return (
    err?.response?.data?.data ||
    err?.response?.data?.message ||
    err?.message ||
    defaultMsg
  );
}
