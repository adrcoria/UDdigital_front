export type FilterType = {
  query: string;
  brands: string[];
  category: string;
  discount: string;
};



export type FunctionType = {
  uuid: string;
  name: string;
  code: string;
  specie: {
    uuid: string;
    name: string;
  }
}
