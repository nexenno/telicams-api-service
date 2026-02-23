"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionListModel = exports.DashcamDeviceModel = void 0;
const mongoose_1 = require("mongoose");
const var_config_1 = require("../assets/var-config");
const dbConnector_1 = require("./dbConnector");
const DashcamList = new dbConnector_1.mongoose.Schema({
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
    device_number: {
        type: String,
        index: true,
        maxlength: 20,
        unique: true,
        required: true,
    },
    device_model: {
        type: String,
        maxlength: 50,
    },
    device_oem: {
        type: String,
        maxlength: 50,
    },
    online: {
        type: Boolean,
        default: false,
        index: true,
    },
    province_id: {
        type: String,
        maxlength: 20,
    },
    city_id: {
        type: String,
        maxlength: 20,
    },
    license_plate: {
        type: String,
        maxlength: 20,
    },
    gateway_status: {
        type: Number,
        enum: [0, 1], //0 - not registered, 1 - registered
        default: 0,
    },
    active_status: {
        type: Number,
        enum: [1, 2, 3], //1 - active, 2 - suspended, 3 - decommissioned
        default: 1,
    },
    assign_status: {
        type: Number,
        enum: [0, 1, 2], //0 - not assigned, 1 - assigned to operator, 2 - assigned to vehicle
        default: 0,
    },
    created_by: {
        type: String,
        enum: ["operator", "admin"],
        required: true,
    },
    suspension_reason: {
        type: String,
        maxlength: 500,
        default: "",
    },
}, {
    id: true,
    timestamps: true,
    minimize: true
});
const CollectionList = new dbConnector_1.mongoose.Schema({
    operator_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true,
        ref: var_config_1.DatabaseTableList.user_operators,
        required: true,
    },
    name: {
        type: String,
        maxlength: 50,
        required: true,
    },
    description: {
        type: String,
        maxlength: 500,
        default: "",
    },
    status: {
        type: Number,
        enum: [1, 2], //1 - active, 2 - archived
        default: 1,
    }
}, {
    id: true,
    timestamps: true,
    minimize: true
});
CollectionList.index({ operator_id: 1, name: 1 }, { unique: true });
const DashcamDeviceModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.dashcam_devices, DashcamList);
exports.DashcamDeviceModel = DashcamDeviceModel;
const CollectionListModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.collection_lists, CollectionList);
exports.CollectionListModel = CollectionListModel;
