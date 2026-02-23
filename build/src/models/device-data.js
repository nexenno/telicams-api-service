"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashcamLocationModel = exports.DashcamActivityLogModel = exports.DashcamAlarmModel = void 0;
const mongoose_1 = require("mongoose");
const var_config_1 = require("../assets/var-config");
const dbConnector_1 = require("./dbConnector");
const DashcamAlarms = new dbConnector_1.mongoose.Schema({
    operator_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        ref: var_config_1.DatabaseTableList.user_operators,
    },
    vehicle_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        ref: var_config_1.DatabaseTableList.vehicle_lists,
    },
    device_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        required: true,
        ref: var_config_1.DatabaseTableList.dashcam_devices,
    },
    alarm_ref: {
        type: String,
        required: true,
        maxlength: 100,
    },
    alarm_type: {
        type: String,
        maxlength: 50,
    },
    severity: {
        type: String,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    speed: {
        type: Number,
    },
    triggered_at: {
        type: Date,
        required: true,
    },
    cleared_at: {
        type: Date,
    },
    trigger_detail: {
        type: dbConnector_1.mongoose.Schema.Types.Mixed,
    },
    clear_detail: {
        type: dbConnector_1.mongoose.Schema.Types.Mixed,
    },
    status: {
        type: Number,
        enum: [0, 1], //0 - unresolved, 1 - resolved
        default: 0,
    }
}, {
    id: true,
    timestamps: true,
    minimize: true
});
const DashcamActivityLog = new dbConnector_1.mongoose.Schema({
    operator_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        ref: var_config_1.DatabaseTableList.user_operators,
    },
    device_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        required: true,
        ref: var_config_1.DatabaseTableList.dashcam_devices,
    },
    vehicle_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        ref: var_config_1.DatabaseTableList.vehicle_lists,
    },
    activity_type: {
        type: String,
        maxlength: 50,
    },
    activity_detail: {
        type: dbConnector_1.mongoose.Schema.Types.Mixed,
    },
    message: {
        type: String,
        maxlength: 500,
    },
}, {
    id: true,
    timestamps: true,
    minimize: true
});
const DashcamLocations = new dbConnector_1.mongoose.Schema({
    operator_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        ref: var_config_1.DatabaseTableList.user_operators,
    },
    device_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        required: true,
        ref: var_config_1.DatabaseTableList.dashcam_devices,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    speed: {
        type: Number,
    },
    heading: {
        type: Number,
    },
    gps_timestamp: {
        type: Date,
    },
    acc_status: {
        type: Number,
        enum: [0, 1], //0 - off, 1 - on
        default: 0,
    },
}, {
    id: true,
    timestamps: true,
    minimize: true
});
exports.DashcamAlarmModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.dashcam_alarms, DashcamAlarms);
exports.DashcamActivityLogModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.dashcam_activity_logs, DashcamActivityLog);
exports.DashcamLocationModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.dashcam_locations, DashcamLocations);
