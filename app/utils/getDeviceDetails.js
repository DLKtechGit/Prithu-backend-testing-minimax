import * as Device from "expo-device";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export const getDeviceDetails = async () => {
  // Try to get a stable app-specific ID (same app reinstall = new ID)
  const appInstallId = Application.androidId || Application.applicationId;

  // ✅ Persistent custom deviceId fallback
  let deviceId = await AsyncStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem("deviceId", deviceId);
  }

  const osName = Device.osName || "Unknown OS";
  const osVersion = Device.osVersion || "Unknown Version";

  const deviceType = Device.deviceType === Device.DeviceType.PHONE ? "phone" :
                     Device.deviceType === Device.DeviceType.TABLET ? "tablet" : "unknown";

  const deviceBrand = Device.brand || "Unknown Brand";
  const deviceModel = Device.modelName || "Unknown Model";

  console.log({
    appInstallId,
    deviceId,
    deviceType,
    brand: deviceBrand,
    model: deviceModel,
    os: `${osName} ${osVersion}`,
  });

  return {
    appInstallId, // optional
    deviceId,     // your persistent ID
    deviceType,
    brand: deviceBrand,
    model: deviceModel,
    os: `${osName} ${osVersion}`,
  };
};
