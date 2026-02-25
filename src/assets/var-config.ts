import { fileConfig } from "./file-config"

export const varConfig = {
  user_types: ["operator", "admin"] as const,
  account_types: ["operator", "team"] as const,
  gender_types: ["male", "female", ""] as const,
  user_upload_bucket: fileConfig.config.env === "live" ? "koova-media" : "koova-dev",
  max_upload_file_size: 100 * 1024 * 1024, //100MB
  support_email: "",
  admin_portal: "",
  mail_sender: fileConfig.config.env === "live" ? `Koova <noreply@koova.com>` : `Koova <dev@koova.com>`,
  otp_type: ["reset", "register", "login"] as const,
  notification_type: ["tab_see", "trip"] as const,
}


export const DatabaseTableList = {
  dashcam_devices: "dashcam_devices",
  collection_lists: "collection_lists",
  vehicle_lists: "vehicle_lists",
  dashcam_alarms: "dashcam_alarms",
  dashcam_activity_logs: "dashcam_logs",
  dashcam_locations: "dashcam_locations",
  dashcam_locstats: "dashcam_locstats",
  operator_logs: "operator_logs",
  operator_teams: "operator_teams",
  operator_roles: "operator_roles",
  user_operators: "user_operators",
  user_admins: "user_admins",
  admin_activity_logs: "admin_logs",
  otp_requests: "otp_requests",
  message_requests: "message_requests",


}

const serviceURL = {
  message_service: fileConfig.config.env === "live" ? "http://localhost:4007" : "http://localhost:6007",
  service_staging: "https://stagingapp.zeno.ng"
};

export const serviceEndpoint = {
  message_service_send_mail: `${serviceURL.message_service}/user/messages/email-message`,
  service_staging: serviceURL.service_staging
};
