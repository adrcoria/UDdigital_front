import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class ConceptCategoryService {
  private basePath = "/concept-category";

  // GET /concept-category
  async getConceptCategories() {
    return http.get(`${this.basePath}`);
  }

  // POST /concept-category
  async createConceptCategory(payload: {
    name: string;
    description?: string | null;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  // PATCH /concept-category/:id
  async updateConceptCategory(
    id: string,
    payload: {
      name?: string;
      description?: string | null;
    }
  ) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  // DELETE /concept-category/:id
  async deleteConceptCategory(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
