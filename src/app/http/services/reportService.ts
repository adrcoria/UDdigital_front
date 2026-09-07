import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class ReportService {
  private basePath = "/reports";

  private clean(params: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== "")
    );
  }

  // excel y pdf retornan blob; json retorna datos paginados
  private request(path: string, params: Record<string, any> = {}) {
    const p = this.clean(params);
    const isBlob = !p.format || p.format === "excel" || p.format === "pdf";
    return http.getget(path, { params: p, responseType: isBlob ? "blob" : "json" });
  }

  herdInventory(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/herd-inventory`, p); }
  // R-28: proyeccion del hato a 10 anios (excel | pdf | json)
  herdDevelopment(p: Record<string, any>) { return this.request(`${this.basePath}/herd-development`, p); }
  weightHistory(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/weight-history`, p); }
  births(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/births`, p); }
  discharges(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/discharges`, p); }
  transfers(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/transfers`, p); }
  gestations(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/gestations`, p); }
  heats(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/heats`, p); }
  tagChanges(p: Record<string, any>) { return this.request(`${this.basePath}/livestock/tag-changes`, p); }
  activeFeedlotBatches(p: Record<string, any>) { return this.request(`${this.basePath}/feedlot/active-batches`, p); }
  feedlotWeightGain(p: Record<string, any>) { return this.request(`${this.basePath}/feedlot/weight-gain`, p); }
  closedFeedlotBatches(p: Record<string, any>) { return this.request(`${this.basePath}/feedlot/closed-batches`, p); }
  dailyMilkProduction(p: Record<string, any>) { return this.request(`${this.basePath}/dairy/daily-production`, p); }
  accumulatedMilkProduction(p: Record<string, any>) { return this.request(`${this.basePath}/dairy/accumulated-production`, p); }
  perCowProduction(p: Record<string, any>) { return this.request(`${this.basePath}/dairy/per-cow-production`, p); }
  appliedVaccinations(p: Record<string, any>) { return this.request(`${this.basePath}/vaccination/applied`, p); }
  healthHistory(p: Record<string, any>) { return this.request(`${this.basePath}/vaccination/health-history`, p); }
  unvaccinatedBovines(p: Record<string, any>) { return this.request(`${this.basePath}/vaccination/unvaccinated`, p); }
  cattleSaleOrders(p: Record<string, any>) { return this.request(`${this.basePath}/cattle-sales/orders`, p); }
  soldBovines(p: Record<string, any>) { return this.request(`${this.basePath}/cattle-sales/sold-bovines`, p); }
  activeStaff(p: Record<string, any>) { return this.request(`${this.basePath}/personnel/active-staff`, p); }
  staffMovements(p: Record<string, any>) { return this.request(`${this.basePath}/personnel/hires-terminations`, p); }
  maintenanceHistory(p: Record<string, any>) { return this.request(`${this.basePath}/machinery/maintenance-history`, p); }
  pendingMaintenance(p: Record<string, any>) { return this.request(`${this.basePath}/machinery/pending-maintenance`, p); }
  maintenanceCosts(p: Record<string, any>) { return this.request(`${this.basePath}/machinery/maintenance-costs`, p); }
  inventoryMovements(p: Record<string, any>) { return this.request(`${this.basePath}/inventory/movements`, p); }
  inventoryStock(p: Record<string, any>) { return this.request(`${this.basePath}/inventory/stock`, p); }
  inventoryConsumption(p: Record<string, any>) { return this.request(`${this.basePath}/inventory/consumption`, p); }
  exportOperationsExcel(p: Record<string, any>) { return this.request(`${this.basePath}/operations/excel`, p); }
  exportOperationsExcelSummary(p: Record<string, any>) { return this.request(`${this.basePath}/summary/excel`, p); }
  exportOperationsAllExcelSummary(p: Record<string, any>) { return this.request(`${this.basePath}/all-summary/excel`, p); }
  exportOperationsExport(p: Record<string, any>) { return this.request(`${this.basePath}/operations/export`, p); }
}
