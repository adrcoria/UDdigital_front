export type TableHeaderType = {
  title: string;
  align?: string;
  isCheck?: boolean;
};

export type TableConfigType = {
  page: number;
  start: number;
  end: number;
  noOfItems: number;
  itemsPerPage: number;
};

export type PaginationType = {
  current: number;
  total: number;
  length: number;
};
