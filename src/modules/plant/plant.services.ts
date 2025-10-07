import { User } from "@prisma/client";
import {
  getEndUserInfo,
  getGroupList,
  HttpError,
  PlantInterface,
  sendMail,
} from "../../imports";
import PlantRepo from "./plant.repo";

class PlantService {
  public static createPlant = async (payload: PlantInterface) => {
    const plant = await PlantRepo.createPlant(payload);
    return plant;
  };

  // public static getAllPlants = async (user: User) => {
  //   let plantList: any = [];
  //   let userIdsList: any = await PlantRepo.getChildrenRecursively(
  //     user.id,
  //     "INSTALLER"
  //   );

  //   let MemberIds: string[] = userIdsList.map((child: any) => child.email);
  //   MemberIds.push("progziel01");
  //   console.log(MemberIds);

  //   let MonitorUsers = await getEndUserInfo();
  //   let monitorUserEmail = MonitorUsers.map((data: any) => data.MemberID);
  //   console.log(monitorUserEmail);

  //   const commonUsers: string[] = MemberIds.filter((email) =>
  //     monitorUserEmail.includes(email)
  //   );
  //   console.log("Common Users:", commonUsers);
  //   const MemberIdAndSignature = MonitorUsers.filter((data: any) =>
  //     commonUsers.includes(data.MemberID)
  //   );
  //   console.log("Signature", MemberIdAndSignature);

  //   for (let i = 0; i < MemberIdAndSignature.length; i++) {
  //     let usersPlantList: any = await getGroupList(
  //       MemberIdAndSignature[i].MemberID,
  //       MemberIdAndSignature[i].Sign
  //     );
  //     console.log("\n\n usersPlantList", usersPlantList);

  //     if (usersPlantList && usersPlantList.AllGroupList.length > 0) {
  //       plantList = [...plantList, ...usersPlantList.AllGroupList];
  //     }
  //   }

  //   return plantList;
  // };

public static getAllPlants = async (user: User) => {
  // 1️ Get all child installers recursively
  const userIdsList = await PlantRepo.getChildrenRecursively(user.id, "INSTALLER");

  // 2 Build installer email list
  const memberIds = userIdsList.map((child: any) => child.email);
  memberIds.push("progziel01");

  // 3️ Fetch all monitoring users once
  const monitorUsers = await getEndUserInfo();

  // 4️ Use Set for faster lookups
  const monitorEmailSet = new Set(monitorUsers.map((u: any) => u.MemberID));

  // 5️ Filter only users present in both lists
  const validMonitorUsers = monitorUsers.filter((u: any) =>
    memberIds.includes(u.MemberID)
  );

  // 6️ Fetch all plant lists concurrently
  const groupPromises = validMonitorUsers.map((user: any) =>
    getGroupList(user.MemberID, user.Sign)
  );

  // ⚡ Run all at once
  const usersPlantLists = await Promise.allSettled(groupPromises);

  // 7️⃣ Extract successful results and flatten
  const plantList = usersPlantLists
    .filter((res: any) => res.status === "fulfilled" && res.value?.AllGroupList?.length)
    .flatMap((res: any) => res.value.AllGroupList);

  return plantList;
};

}

export default PlantService;
