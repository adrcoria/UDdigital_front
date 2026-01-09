import UserService from "@/app/http/services/userService";
import AccountService from "@/app/http/services/accountService";
import SuscriptionService from "@/app/http/services/suscriptionService";
import LedgerAccountService from "@/app/http/services/ledgerAccountService";
import OperationsService from "@/app/http/services/operationsService";
import ConceptService from "@/app/http/services/conceptService";
import ConceptCategoryService from "@/app/http/services/conceptCategoryService";
import FileService from "@/app/http/services/fileService";
import FakeBackendService from "@/app/http/services/fakeBackendService";
import VerifyService from "./services/verifyService";
import OperationImageService from "./services/operationImageService";
import CompanyService from "./services/companyService";
import ReportService from "./services/reportService";
const ledgerAccountService = new LedgerAccountService();
const userService = new UserService();
const suscriptionService = new SuscriptionService();
const operationsService = new OperationsService();
const reportService = new ReportService();

const conceptService = new ConceptService();
const conceptCategoryService = new ConceptCategoryService();
const fileService = new FileService();
const accountService = new AccountService();
const fakeBackendService = new FakeBackendService();
const verifyService = new VerifyService
const operationImageService = new OperationImageService();
const companyService = new CompanyService();

export {
  ledgerAccountService,
  userService,
  accountService,
  verifyService,
  operationImageService,
  suscriptionService,
  companyService,
  operationsService,
  conceptService,
  conceptCategoryService,
  reportService,
  fileService,
  fakeBackendService
};
