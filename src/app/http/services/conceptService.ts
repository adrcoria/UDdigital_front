import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class ConceptService {
  private basePath = "/concept";

  async getConcepts(idConceptCategory?: string) {
    if (idConceptCategory) {
      return http.get(`${this.basePath}?idConceptCategory=${idConceptCategory}`);
    }
    return http.get(this.basePath);
  }


  // 🔹 Crear concepto
  async createConcept(payload: {
    name: string;
    description: string;
    polarity: number;
    idConceptCategory: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  // 🔹 Actualizar concepto
  async updateConcept(
    id: string,
    payload: {
      name: string;
      description: string;
      polarity: number;
      idConceptCategory: string;
    }
  ) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  // 🔹 Eliminar concepto
  async deleteConcept(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
