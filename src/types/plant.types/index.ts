export interface PlantInterface {
  name: string;
  capacity: number;
  region: string;
  latitude: number;
  longitude: number;
  tariff: number;
  plantType: "Grid" | "Grid_Meter" | "Hybrid";
  timeZone?: string | null;
  address: string;
  currency?: string;
  installationDate?: string;
  gridConnectionType?: string | null;
  gridConnectionDate?: string | null;
  notes?: string | null;
  imagesNotes?: string | null;
  plantImage?: string[];
  plantProfile: string;
  customerId: string;
  installerId: string;
  AutoID?: string;
}

export const deviceDetailFilter = (details:any)=>{  
  return{
    deviceName: details?.GoodsName,
    plantName: details?.plant?.name,
    plantType: details?.plant.plantType,
    plantLat : details?.plant.location.latitude,
    plantLong : details?.plant.location.longitude,
    plantRegion : details?.plant.region,
    customerName: details?.customer.fullName,
    customerPhone: details?.customer.phoneNumber,
    customerEmail: details?.customer.email,
    installerName: details?.plant.installer.fullName,
    installerPhone: details?.plant.installer.phoneNumber,
    installerEmail: details?.plant.installer.email,
    deviceType: details?.deviceType,
    sn: details?.sn,
    plantId: details?.plantId,
    customerId: details?.customerId,
    currentPower: details?.CurrPac || 0,
      AutoID: details?.AutoID || "0",
      status:
        details?.Light === 1
          ? "ONLINE"
          : details?.Light == 2
          ? "FAULT"
          : details?.Light == 3
          ? "STANDBY"
          : details?.Light == 4
          ? "OFFLINE"
          : "UNKNOWN",
          todayYield: details?.EToday || 0,
      totalYield: details?.ETotal || 0,
      generationTime: details?.Htotal || "",
  }
}
