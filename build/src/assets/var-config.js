"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceEndpoint = exports.DatabaseTableList = exports.varConfig = void 0;
const file_config_1 = require("./file-config");
exports.varConfig = {
    user_types: ["operator", "admin"],
    account_types: ["operator", "team"],
    gender_types: ["male", "female", ""],
    user_upload_bucket: file_config_1.fileConfig.config.env === "live" ? "koova-media" : "koova-dev",
    max_upload_file_size: 100 * 1024 * 1024, //100MB
    support_email: "",
    admin_portal: "",
    mail_sender: file_config_1.fileConfig.config.env === "live" ? `Koova <noreply@koova.com>` : `Koova <dev@koova.com>`,
    otp_type: ["reset", "register", "login"],
    notification_type: ["tab_see", "trip"],
};
exports.DatabaseTableList = {
    dashcam_devices: "dashcam_devices",
    collection_lists: "collection_lists",
    vehicle_lists: "vehicle_lists",
    dashcam_alarms: "dashcam_alarms",
    dashcam_activity_logs: "dashcam_logs",
    dashcam_locations: "dashcam_locations",
    operator_logs: "operator_logs",
    operator_teams: "operator_teams",
    operator_roles: "operator_roles",
    user_operators: "user_operators",
    user_admins: "user_admins",
    admin_activity_logs: "admin_logs",
    otp_requests: "otp_requests",
    message_requests: "message_requests",
};
const serviceURL = {
    message_service: file_config_1.fileConfig.config.env === "live" ? "http://localhost:4007" : "http://localhost:6007",
    service_staging: "https://stagingapp.zeno.ng"
};
exports.serviceEndpoint = {
    message_service_send_mail: `${serviceURL.message_service}/user/messages/email-message`,
    service_staging: serviceURL.service_staging
};
