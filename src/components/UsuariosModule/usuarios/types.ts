export type FilterType = {
  query: string;
  brands: string[];
  category: string;
  discount: string;
};



export type FarmerType = {
  uuid: string;
  name: string;
  curp: string;
  rfc: string;
  phone: string;
  mail: string;
};

export type LandType = {
  uuid: string;
  name: string;
  street: string;
  out_number: string;
  int_number: string;
  zip_code: string;
  neighborhood: string;
  locality: string;
  state: string;
  farmer: FarmerType;
};

export type SubscriptionStatusType = {
  uuid: string;
  name: string;
};

export type SuscriptionType = {
  uuid: string;
  folio: string;
  insurance_certificate_number: string | null;
  request_date: string;
  validity: string | null;
  single_amount_secured: number | null;
  total_amount_secured: number | null;
  single_prima_amount: number | null;
  total_prima_amount: number | null;
  accumulated_travel_expenses: number | null;
  reinsurance_accumulated: number | null;
  operation_expenses: number | null;
  risk_reserve: number | null;
  farmer: FarmerType;
  land: LandType;
  subscription_status: SubscriptionStatusType;
};
