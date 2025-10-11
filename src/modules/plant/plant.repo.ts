import { Plant, Role, User } from "@prisma/client";
import { PlantInterface, prisma } from "../../imports";

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
      plantProfile: payload.plantProfile,
      plantImage: payload.plantImage
        ? {
            create: payload.plantImage.map((url) => ({
              file_url: url,
            })),
          }
        : undefined,
      AutoId: payload.AutoID,
    };

    const plant = await prisma.plant.create({ data });
    return plant;
  }

  public static async getChildrenRecursively(
    userId: string,
    role?: Role
  ): Promise<String[]> {
    // always fetch all children regardless of role
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: {
        role: true,
        id: true,
        email: true,
      },
    });

    let allChildren: any[] = [];

    for (const child of children) {
      // if child matches the role, add it
      if (!role || child.role === role || child.role === "CUSTOMER") {
        allChildren.push(child);
      }

      // recurse for deeper levels
      const childDescendants = await this.getChildrenRecursively(
        child.id,
        role
      );
      allChildren = [...allChildren, ...childDescendants];
    }

    return allChildren;
  }

  // Get My and nested plants
  public static async getAllPlants(
    user: User,
    userIdsList: string[]
  ): Promise<Plant[]> {
    // Get Nested Installer's Ids
    const plants = await prisma.plant.findMany({
      where: {
        customer: {
          email: { in: userIdsList },
        },
      },
      include: {
        // location: true,
        customer: true,
        // installer: true,
        // plantImage: true,
      },
    });
    return plants;
  }

  // Check if plant exists by name
  public static async isPlantExists(name: string): Promise<boolean> {
    const plant = await prisma.plant.findUnique({
      where: { name },
    });
    return !!plant;
  }

  // Get Plant By Id
  public static async getPlantByIdRepo(id: string): Promise<Plant | null> {
    const plant = await prisma.plant.findUnique({
      where: { name: id },
      include: {
        location: true,
        customer: true,
        installer: true,
        plantImage: true,
      },
    });
    return plant;
  }

  public static async getPlantByAutoIdRepo(id: string): Promise<Plant | null> {
    const plant = await prisma.plant.findUnique({
      where: { AutoId: id },
      include: {
        location: true,
        customer: true,
        installer: true,
        plantImage: true,
      },
    });
    return plant;
  }

  // Update Plant
  public static async updatePlantRepo(data: any) {
    let { latitude, longitude, ...rest } = data;
    const plant = await prisma.plant.update({
      where: { AutoId: data.AutoId },
      data: {
        ...rest,
        location: {
          update: {
            latitude,
            longitude,
          },
        },
      },
    });
    return plant;
  }
}

export default PlantRepo;
