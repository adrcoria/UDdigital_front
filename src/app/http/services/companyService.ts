// companyService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class CompanyService {
  private basePath = "/company";

  // GET /company
  async getCompanies() {
    return http.get(`${this.basePath}`);
  }

  // POST /company
  async createCompany(payload: {
    name: string;
    description: string;
    code: string; // Campo obligatorio según la imagen
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  // PATCH /company/:id
  async updateCompany(id: string, payload: any) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  // DELETE /company/:id
  async deleteCompany(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}