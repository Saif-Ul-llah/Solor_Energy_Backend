import { Plant, Role, User } from "@prisma/client";
import { HttpError, PlantInterface, prisma } from "../../imports";

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
    role?: Role | null | ""
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
    userId: string,
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
        device: true,
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
    const {
      AutoID,
      latitude,
      longitude,
      plantImage,
      customerId,
      installerId,
      ...rest
    } = data;

    // Ensure AutoId is provided
    if (!AutoID) throw new Error("AutoId is required for updating plant");

    // Fetch existing plant
    const existingPlant = await prisma.plant.findUnique({
      where: { AutoId: AutoID },
      include: { location: true, plantImage: true },
    });

    if (!existingPlant) throw new Error("Plant not found");

    // Build update payload
    const updateData: any = {
      ...rest,
    };
    // if (customerId) {
    //   updateData.customer = { connect: { id: customerId } };
    // }

    // if (installerId) {
    //   updateData.installer = { connect: { id: installerId } };
    // }
    // ✅ Update location only if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        update: {
          latitude,
          longitude,
        },
      };
    }

    // ✅ Handle plantImage updates (optional)
    if (plantImage && Array.isArray(plantImage)) {
      // Remove old images and create new ones
      updateData.plantImage = {
        deleteMany: {}, // remove all old ones
        create: plantImage.map((url: string) => ({
          file_url: url,
        })),
      };
    }

    // ✅ Update timestamp fields safely
    if (rest.installationDate)
      updateData.installationDate = new Date(rest.installationDate);

    if (rest.gridConnectionDate)
      updateData.gridConnectionDate = new Date(rest.gridConnectionDate);

    // ✅ Execute update
    const updatedPlant = await prisma.plant.update({
      where: { AutoId: AutoID },
      data: updateData,
    });

    return updatedPlant;
  }

  // Get Device List of a plant by plant id
  public static async getDevicesForFlowDiagram(plantId: string) {
    const deviceList = await prisma.device.findMany({
      where: { plantId: plantId },
    });
    if (!deviceList || deviceList.length === 0) return [];
    return {
      id: plantId,
      deviceType: "PLANT",
      children: deviceList,
    };
  }
}

export default PlantRepo;
