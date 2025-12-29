import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class SuscriptionService {
  private basePath = "/subscription"; // Ruta base para la API de usuarios




  async getSuscriptions(param: string) {
    return http.get(`${this.basePath}?search&size=500&offset=0&subscription_status=${param}`);
  }
  async getSuscription(uuid: string) {
    return http.get(`${this.basePath}/${uuid}`);
  }

  async getFiles(uuid: string, type: string) {
    return http.get(`${this.basePath}/${uuid}/files?type=${type}`);
  }

  async getSuscriptionType() {
    return http.get(`${this.basePath}/subscription_types`);
  }
  async deteleMotives(suscriptionType:string) {
    return http.get(`${this.basePath}/delete_motives?subscription_type=${suscriptionType}`);
  }
  

  async createSuscription(suscription: any) {
    return http.post(`${this.basePath}`, suscription);
  }
  async createAgricultural(suscription: any, uuid: string) {
    return http.post(`${this.basePath}/${uuid}/agricultural_subscription_detail`, suscription);
  }

  async registrarViaticos(payload: any, uuid: string) {
    return http.put(`${this.basePath}/${uuid}/add_expenses_data`, payload);
  }

  async createLiveStock(suscription: any, uuid: string) {
    return http.post(`${this.basePath}/${uuid}/livestock_subscription_detail`, suscription);
  }
  async updateAgricultural(suscription: any, uuid: string) {
    return http.put(`${this.basePath}/${uuid}/agricultural_subscription_detail`, suscription);
  }

  async updateLiveStock(suscription: any, uuid: string) {
    return http.put(`${this.basePath}/${uuid}/livestock_subscription_detail`, suscription);
  }


  async createCertificate(suscription: any, uuid: string) {
    return http.put(`${this.basePath}/${uuid}/convert_to_insurance_certificate`, suscription);
  }


  async updateSuscription(suscription: any, uuid: string) {
    return http.put(`${this.basePath}/${uuid}/all_info`, suscription);
  }
  async deleteSuscription(uuid: string) {
    return http.delete(`${this.basePath}/${uuid}?comments=BAJA DE SOLICITUD`);
  }

  async getCropType() {
    return http.get(`${this.basePath}/crop_type`);
  }
  async getMode() {
    return http.get(`${this.basePath}/mode`);
  }
  async getCycle() {
    return http.get(`${this.basePath}/agricultural_cycle`);
  }

  async getTemplateAgro() {
    return http.get(`${this.basePath}/agricultural/import_template`);

  }
  async importSuscriptionsAgro(formData: FormData) {

    return http.post(`${this.basePath}/agricultural/import`, formData);
  }
  async getTemplatePecuario() {
    return http.get(`${this.basePath}/livestock/import_template`);

  }
  async importSuscriptionsPecuario(formData: FormData) {

    return http.post(`${this.basePath}/livestock/import`, formData);
  }

  async rechazarSolicitud(payload: any, uuid: string) {
    return http.delete(`${this.basePath}/${uuid}`, {
      params: {
        comments: payload.comments,
        delete_motives: payload.delete_motives
      }
    });
  }

  async getSiniestros(uuid: string) {
    return http.get(`${this.basePath}/${uuid}/sinister`);
  }


}
