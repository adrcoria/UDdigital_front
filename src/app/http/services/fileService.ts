import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class FileService {
  private basePath = "/file"; // Ruta base para la API de usuarios


  async uploadFileSuscription(uuid: string, subType: string) {
    return http.post(`${this.basePath}/subscription/${uuid}/upload?subType=${subType}`, {});
  }


  async uploadFileWorkOrder(uuid: string) {
    return http.post(`${this.basePath}/work_order/${uuid}/upload`, {});
  }

  async updateToS3(url: string, file: any) {
    return http.putFile(
      url,
      file,
      {
        headers: {
          "Content-Type": "application/pdf",
        },
      }
    );
  }



}
