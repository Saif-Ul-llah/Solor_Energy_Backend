import { Plant } from "@prisma/client";
import { PlantInterface, prisma, registerInterface } from "../../imports";

class PlantRepo {

public static async createPlant(payload: PlantInterface) {
    const data: any = {
      name: payload.name,
      plantType: payload.plantType,
      capacity: payload.capacity,
      region: payload.region,
      tariff: payload.tariff,
      timeZone: payload.timeZone ?? undefined,
      address: payload.address,
      currency: payload.currency ?? "USD",
      installationDate: payload.installationDate
        ? new Date(payload.installationDate)
        : new Date(),
      gridConnectionType: payload.gridConnectionType ?? undefined,
      gridConnectionDate: payload.gridConnectionDate
        ? new Date(payload.gridConnectionDate)
        : undefined,
      notes: payload.notes ?? undefined,
      imagesNotes: payload.imagesNotes ?? undefined,

      // ✅ Relations
      customer: { connect: { id: payload.customerId } },
      installer: { connect: { id: payload.installerId } },
      location: {
        create: {
          latitude: payload.latitude,
          longitude: payload.longitude,
        },
      },
      plantImage: payload.plantImage
        ? {
            create: payload.plantImage.map((url) => ({
              file_url: url,
            })),
          }
        : undefined,
    };

    const plant = await prisma.plant.create({ data });
    return plant;
  }
}

export default PlantRepo;
