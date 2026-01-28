export type SubMenuItemType = {
  label: string;
  labelKey?: string;
  link?: string;
  id?: string;
  prefix?: string;
  subMenu?: SubMenuItemType[];
  roles?: string[];
};

export type MenuItemType = {
  label: string;
  labelKey?: string;
  link?: string;
  isHeader?: boolean;
  icon?: string;
  id: string;
  prefix?: string;
  subMenu?: SubMenuItemType[];
  roles?: string[];
};

export type BrandsListType = {
  src: string;
  title: string;
};

export type CartItemType = {
  id: number;
  src: string;
  subTitle: string;
  title: string;
  price: number;
  items: number;
};

export type NotificationType = {
  isSelected: boolean;
  id: string;
  src?: string;
  title?: string;
  message: string;
  icon?: string;
  time: string;
  isRead: boolean;
};
