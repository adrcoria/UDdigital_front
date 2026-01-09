// companyService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class CompanyService {
  private basePath = "/company";

  async getCompanies() {
    return http.get(`${this.basePath}`);
  }

  async getCompanyById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createCompany(payload: {
    name: string;
    description?: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateCompany(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
    }>
  ) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteCompany(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
