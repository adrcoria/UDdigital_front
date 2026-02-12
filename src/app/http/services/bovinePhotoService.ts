// BovinePhotoService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class BovinePhotoService {
  private basePath = "/bovine-photo";

  /**
   * Registra una nueva foto en el sistema.
   * El payload debe contener fileName, contentType e idBovine.
   */
  async createPhoto(payload: {
    fileName: string;
    contentType: string;
    idBovine: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  async uploadToS3(url: string, file: File) {
    return http.putFile(url, file, {
      headers: {
        "Content-Type": file.type, // Dinámico según la imagen (png, jpg, etc)
      },
    });
  }

  /**
   * Elimina una foto específica por su ID.
   */
  async deletePhoto(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}