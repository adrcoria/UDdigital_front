import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class OperationImageService {
  private basePath = "/operation-image";

  /**
   * Crea el registro y obtiene la URL prefirmada para subir a S3
   * Body según tu screenshot:
   * { fileName, contentType, uuidOperation }
   */
  async createOperationImage(payload: {
    fileName: string;
    contentType: string;
    uuidOperation: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  /**
   * Obtiene imágenes/archivos asociados a una operación
   * GET /operation-image/operation/:operationId
   */
  async getOperationImagesByOperation(operationId: string) {
    return http.get(`${this.basePath}/operation/${operationId}`);
  }

  /**
   * Elimina un registro de operation-image (y normalmente backend también elimina en S3)
   * DELETE /operation-image/:id
   */
  async deleteOperationImage(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }

  /**
   * PUT directo a S3 usando presignedUrl
   * IMPORTANTE: Content-Type dinámico (no hardcodeado)
   */
  async uploadToS3(presignedUrl: string, file: File) {
    return http.putFile(presignedUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });
  }
}
