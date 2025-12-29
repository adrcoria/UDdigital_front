import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class OperationService {
  private basePath = "/operation";

  async getOperations() {
    return http.get(`${this.basePath}`);
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
