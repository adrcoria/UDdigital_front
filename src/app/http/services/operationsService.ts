import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class OperationService {
  private basePath = "/operation";

  // async getOperations() {
  //   return http.get(`${this.basePath}`);
  // }

  async getOperations(params?: {
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
    categoryId?: string;
    conceptId?: string;
    companyId?: string;
    page?: number;
    pageSize?: number;
  }) {
    return http.getget(this.basePath, { params });
  }


  async createOperation(payload: {
    operationDate: string;
    description: string;
    amount: number;
    idAccount: string;
    idConcept: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateOperation(
    id: string,
    payload: Partial<{
      operationDate: string;
      description: string;
      amount: number;
      idAccount: string;
      idConcept: string;
    }>
  ) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteOperation(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
