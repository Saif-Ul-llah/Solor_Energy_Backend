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

export interface deviceDetailsInterface {
  deviceName: string;
  plantName: string;
  plantType: string;
  plantLat : number;
  plantLong : number;
  plantRegion : string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  installerName: string;
  installerPhone: string;
  installerEmail: string;
  deviceType: string;
  sn: string;
  plantId: string;
  customerId: string;
}


export const deviceDetailFilter = (details:any)=>{
  return{
    deviceName: details.GoodsName,
    plantName: details.plant.name,
    plantType: details.plant.plantType,
    plantLat : details.plant.location.latitude,
    plantLong : details.plant.location.longitude,
    plantRegion : details.plant.region,
    customerName: details.customer.fullName,
    customerPhone: details.customer.phoneNumber,
    customerEmail: details.customer.email,
    installerName: details.plant.installer.fullName,
    installerPhone: details.plant.installer.phoneNumber,
    installerEmail: details.plant.installer.email,
    deviceType: details.deviceType,
    sn: details.sn,
    plantId: details.plantId,
    customerId: details.customerId,
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


// {
//         "id": "5f816c72-91fd-4c75-8b2a-3a79abf56cae",
//         "createdAt": "2025-10-15T09:52:25.582Z",
//         "customerId": "1b62c5c6-cbdd-44b1-8b7d-91e1b2a98e73",
//         "plantId": "a7408855-1fc1-42c0-871c-384f38b2af86",
//         "sn": "xyz4582",
//         "deviceType": "INVERTER",
//         "customer": {
//             "id": "1b62c5c6-cbdd-44b1-8b7d-91e1b2a98e73",
//             "email": "customer@example.com",
//             "password": "$2b$10$quo4ua2v.usJy.soeBrcKeqru0KXbPHlaL..0LWdNJCvxAAuiX1Jy",
//             "phoneNumber": "1234567890",
//             "role": "CUSTOMER",
//             "IsActive": true,
//             "createdAt": "2025-10-08T06:38:01.552Z",
//             "locationId": null,
//             "fullName": "Jacka",
//             "address": "sdadasds",
//             "fcmToken": "eHs0B1LDQXeQqKCSJ3r41m:APA91bGEZ4bxYVbaqbnNcrguBILKNLq3QvQime2_zNlU4DFHyrZiJoXajvosI_Zs7pHV3fZ_0SwaxBr2v3FxX3RJjXlFstJQxUcF6wkoYPmKkXatd87AdEA",
//             "imageUrl": null,
//             "TFA_enabled": true,
//             "language": "EN",
//             "parentId": "6abbc6f1-40c3-4f6e-9903-bbc29c870788"
//         },
//         "plant": {
//             "id": "a7408855-1fc1-42c0-871c-384f38b2af86",
//             "createdAt": "2025-10-11T05:58:41.740Z",
//             "customerId": "1b62c5c6-cbdd-44b1-8b7d-91e1b2a98e73",
//             "installerId": "18834ca1-fb60-45f7-a3ce-311ddfed743a",
//             "name": "White hate testing",
//             "plantType": "Grid",
//             "capacity": 500,
//             "region": "Punjab",
//             "locationId": 7,
//             "tariff": 12.5,
//             "timeZone": "Asia/Karachi",
//             "address": "123 Solar Street, Lahore",
//             "currency": "PKR",
//             "installationDate": "2025-01-15T00:00:00.000Z",
//             "gridConnectionType": "Three-Phase",
//             "gridConnectionDate": "2025-02-01T00:00:00.000Z",
//             "notes": "High efficiency panels used.",
//             "imagesNotes": "Main building, control room, and rooftop panels",
//             "plantProfile": "https://res.cloudinary.com/demo/image/upload/v12345/plant2.jpg",
//             "AutoId": "253514",
//             "installer": {
//                 "id": "18834ca1-fb60-45f7-a3ce-311ddfed743a",
//                 "email": "installer@email.com",
//                 "password": "$2b$10$4g3QmCKXw0oiFl2dhZtlOOX7bsBzh3FoEJX/PVAZMlG7XF9CGqtVK",
//                 "phoneNumber": "1234567890",
//                 "role": "INSTALLER",
//                 "IsActive": true,
//                 "createdAt": "2025-10-08T11:02:29.213Z",
//                 "locationId": null,
//                 "fullName": "installer",
//                 "address": null,
//                 "fcmToken": null,
//                 "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/plant1.jpg",
//                 "TFA_enabled": false,
//                 "language": "EN",
//                 "parentId": "6abbc6f1-40c3-4f6e-9903-bbc29c870788"
//             }
//         },
//         "AutoID": "266288",
//         "GoodsID": "xyz4582",
//         "GoodsName": "xyz4582",
//         "Light": 4,
//         "CurrPac": "0",
//         "EToday": "0",
//         "ETotal": "0",
//         "Htotal": "0",
//         "DataTime": null
//     }