    // ledgerAccountService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class LedgerAccountService {
  private basePath = "/account";

  async getAccounts() {
    return http.get(`${this.basePath}`);
  }

  async getAccountById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createAccount(payload: {
    name: string;
    description?: string;
    currentBalance: number;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateAccount(id: string, payload: Partial<{
    name: string;
    description: string;
    currentBalance: number;
  }>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteAccount(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
