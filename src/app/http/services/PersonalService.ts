import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface PersonalPayload {
  name: string;
  lastName: string;
  secondLastName?: string;
  address?: string;
  phone?: string;
  curp?: string;
  sex?: string;
  idPosition?: string;
  birthDate?: string;
  age?: number;
  salary?: number;
  entryDate?: string;
  contractType?: string;
  escolarity?: string;
}

export default class PersonalService {
  private basePath = "/personal";

  async getPersonal(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page)   query.append("page",   params.page.toString());
    if (params.limit)  query.append("limit",  params.limit.toString());
    if (params.search) query.append("search", params.search);
    const queryString = query.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    return http.get(url);
  }

  async getPersonalById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createPersonal(payload: PersonalPayload) {
    return http.post(this.basePath, payload);
  }

  async updatePersonal(id: string, payload: Partial<PersonalPayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deletePersonal(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }

  /* ──────── Foto (presigned S3) ──────── */
  async createPhoto(payload: { fileName: string; contentType: string; idPersonal: string }) {
    return http.post(`${this.basePath}/photo`, payload);
  }

  async uploadToS3(url: string, file: File) {
    return http.putFile(url, file, {
      headers: { "Content-Type": file.type },
    });
  }
}
