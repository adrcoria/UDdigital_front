export type FilterType = {
  query: string;
  brands: string[];
  category: string;
  discount: string;
};



export type UserType = {
  uuid: string;
  name: string;
  last_name: string;
  phone: string;
  uuidRol: string;
  mail: string;
  password: string;
  nameRol: string;
  role: {
    uuid: "",
    name: ""
  };
}
