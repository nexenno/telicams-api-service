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
  gateway_service: fileConfig.config.env === "live" ? "http://localhost:4005" : "http://178.62.0.219:8080/api/v1",
  // gateway_service: fileConfig.config.env === "live" ? "http://localhost:4005" : "http://localhost:8080/api/v1",
};

export const serviceEndpoint = {
  device_endpoint: `${serviceURL.gateway_service}/devices`,
  stream_endpoint: `${serviceURL.gateway_service}/streams`,
};



//SIGNAL STRENGTH VALUES
// 0 = No signal
// 1–10 = Weak
// 11–20 = Fair
// 21–31 = Strong

// Satellites Accuracy
// 0–3 = Poor
// 4–6 = Acceptable
// 7–12 = Good
// 12+ = Excellent
