import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class InventoryService {
  async getProducts() {
    return http.get("/products");
  }
  async createProduct(payload: { name: string; idBrand: string; price: number; unitOfMeasure: string; idProductSubcategory: string }) {
    return http.post("/products", payload);
  }
  async updateProduct(id: string, payload: { name: string; idBrand: string; price: number; unitOfMeasure: string; idProductSubcategory: string }) {
    return http.patch(`/products/${id}`, payload);
  }
  async deleteProduct(id: string) {
    return http.delete(`/products/${id}`);
  }

  async getBrands() {
    return http.get("/brands");
  }
  async createBrand(payload: { name: string }) {
    return http.post("/brands", payload);
  }
  async updateBrand(id: string, payload: { name: string }) {
    return http.patch(`/brands/${id}`, payload);
  }
  async deleteBrand(id: string) {
    return http.delete(`/brands/${id}`);
  }

  async getSubcategories() {
    return http.get("/product-subcategories");
  }
  async createSubcategory(payload: { name: string }) {
    return http.post("/product-subcategories", payload);
  }
  async updateSubcategory(id: string, payload: { name: string }) {
    return http.patch(`/product-subcategories/${id}`, payload);
  }
  async deleteSubcategory(id: string) {
    return http.delete(`/product-subcategories/${id}`);
  }

  async getInventory() {
    return http.get("/inventory");
  }
  async createInventory(payload: { idProduct: string; units: number }) {
    return http.post("/inventory", payload);
  }
  async updateInventory(id: string, payload: { idProduct: string; units: number }) {
    return http.patch(`/inventory/${id}`, payload);
  }
  async deleteInventory(id: string) {
    return http.delete(`/inventory/${id}`);
  }
  async adjustInventory(id: string, payload: { units: number; type: "add" | "subtract"; purpose: string }) {
    return http.patch(`/inventory/${id}/adjust`, payload);
  }
}
