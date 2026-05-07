import { google } from "googleapis";
import { ExportPayload } from "@/types";

export async function saveJsonToDrive(
  accessToken: string,
  payload: ExportPayload,
  fileName: string
): Promise<{ fileId: string; webViewLink: string }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata: Record<string, unknown> = {
    name: fileName,
    mimeType: "application/json",
  };

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType: "application/json",
    body: JSON.stringify(payload, null, 2),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  return {
    fileId: response.data.id ?? "",
    webViewLink: response.data.webViewLink ?? "",
  };
}
