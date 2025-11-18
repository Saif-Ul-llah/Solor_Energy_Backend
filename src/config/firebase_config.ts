import * as admin from "firebase-admin";
import serviceAccount from "./service_account_key.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const authService = admin.auth();
export const messaging = admin.messaging();
