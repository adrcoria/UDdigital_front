export type FilterType = {
  query: string;
};

export type RancherType = {
  id: string;
  name: string;
  company: {
    id: string;
    name: string;
    description: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
};
