import PlatformSettings, {
  IPlatformSettings,
} from "@/models/PlatformSettings";

export async function getPlatformSettings(): Promise<IPlatformSettings> {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  return settings;
}
