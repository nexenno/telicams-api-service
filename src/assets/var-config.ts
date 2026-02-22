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
  user_operators: "user_operators",
  dashcam_devices: "dashcam_devices",
  collection_lists: "collection_lists",
  vehicle_lists: "vehicle_lists",
  dashcam_alarms: "dashcam_alarms",
  dashcam_activity_logs: "dashcam_logs",
  dashcam_locations: "dashcam_locations",

  user_admins: "user_admins",
  user_customers: "user_customers",
  user_riders: "user_riders",
  admin_activity_logs: "admin_activity_logs",
  operator_logs: "operator_logs",
  trip_ratings: "trip_ratings",
  trip_requests: "trip_requests",
  trip_revenues: "trip_revenues",
  operator_vehicle_docs: "opt_vehicle_docs",
  operator_business_docs: "opt_business_docs",
  operator_rider_docs: "opt_rider_docs",
  opt_infractions: "opt_infractions",
  admin_account_roles: "admin_account_roles",
  admin_business_categories: "admin_business_cats",
  admin_asset_lists: "admin_asset_lists",
  admin_infraction_list: "admin_infraction_lists",
  otp_requests: "otp_requests",
  message_requests: "message_requests",
  user_alert_list: "user_alert_lists",
  user_alert_statuses: "user_alert_statuses",
  user_chats: "user_chats",
  operator_teams: "opt_team_lists",
  operator_roles: "opt_role_lists",
}

const serviceURL = {
  message_service: fileConfig.config.env === "live" ? "http://localhost:4007" : "http://localhost:6007",
  service_staging: "https://stagingapp.zeno.ng"
};

export const serviceEndpoint = {
  message_service_send_mail: `${serviceURL.message_service}/user/messages/email-message`,
  service_staging: serviceURL.service_staging
};
