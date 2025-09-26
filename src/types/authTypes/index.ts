export enum Roles {
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  DISTRIBUTOR = "DISTRIBUTOR",
  INSTALLER = "INSTALLER",
  CUSTOMER = "CUSTOMER",
} // roles

export interface registerInterface {
  email: string;
  password: string;
  role: Roles;
  fullName: string;
  phoneNumber: string;
}
