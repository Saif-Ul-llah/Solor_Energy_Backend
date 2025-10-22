import NotificationRepo from "../modules/notification/notification.repo";
import { messaging } from "../config/firebase_config";

// Send notification to a specific device using FCM token
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string
) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
    };

    // Send the notification
    const response = await messaging.send(message);
    // console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    // throw new Error("Failed to send notification");
  }
};
