import { LogType } from "@prisma/client";

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
  parentId?: string;
  imageUrl?: string;
  language: string;
}

export interface loginInterface {
  email: string;
  password: string;
}

export interface resetPassInterface {
  newPassword: string;
  email: string;
  userId: string;
}

export interface SendOtpOptions {
  email: string | null;
  otp: string;
  validMinutes: number;
  userName?: string;
  sendDate?: string;
  year?: number;
}

export interface SendMail {
  email: string;
  subject: string;
  html: string;
}

export interface UserInterface {
  id: string;
  email: string;
  role: Roles;
  fullName: string;
  phoneNumber: string;
  parentId?: string;
  IsActive: boolean;
  address?: string;
  imageUrl?: string;
  TFA_enabled: boolean;
}

export function getUserData(user: any) {
  const abstract: any = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    IsActive: user.IsActive,
    address: user.address || "",
    imageUrl: user.imageUrl || "",
    TFA_enabled: user.TFA_enabled,
    // parent: user.parent ? getUserData(user.parent) : null,
    parentId: user.parentId,
    underName: user.parent ? user.parent.fullName : null,
    underRole: user.parent ? user.parent.role : null,
    allowDeviceCreation: user.allowDeviceCreation,
    allowUserCreation: user.allowUserCreation,
    allowPlantCreation: user.allowPlantCreation,
  };
  return abstract;
}

export interface LogsInterface {
  userId?: string;
  action: string;
  description: string;
  logType?: LogType;
  logData?: any;
}
