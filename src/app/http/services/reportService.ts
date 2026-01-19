import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class ReportService {
  private basePath = "/reports";

  async exportOperationsExcel(params: {
    startDate?: string;
    endDate?: string;
  }) {
    // Es fundamental el responseType: 'blob' para archivos binarios
    return http.getget(`${this.basePath}/operations/excel`, {
      params,
      responseType: 'blob'
    });
  }
  async exportOperationsExcelSummary(params: {
    startDate?: string;
    endDate?: string;
  }) {
    // Es fundamental el responseType: 'blob' para archivos binarios
    return http.getget(`${this.basePath}/summary/excel`, {
      params,
      responseType: 'blob'
    });
  }
  async exportOperationsAllExcelSummary(params: {
    startDate?: string;
    endDate?: string;
  }) {
    // Es fundamental el responseType: 'blob' para archivos binarios
    return http.getget(`${this.basePath}/all-summary/excel`, {
      params,
      responseType: 'blob'
    });
  }
}