"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgRequestModel = exports.OtpRequestModel = void 0;
const var_config_1 = require("../assets/var-config");
const dbConnector_1 = require("./dbConnector");
const Schema = dbConnector_1.mongoose.Schema;
const otpRequests = new Schema({
    otp_type: {
        type: String,
        enum: var_config_1.varConfig.otp_type,
        required: true,
    },
    user_type: {
        type: String,
        enum: var_config_1.varConfig.user_types,
        required: true,
    },
    expired_at: {
        type: Date,
        required: true,
    },
    pin: {
        type: String,
        required: true,
        index: true,
    },
    phone_number: {
        type: String,
        index: true
    },
    email: {
        type: String,
        index: true
    },
    subject: {
        type: String
    },
    name: {
        type: String
    },
    signature: {
        type: String,
        default: ""
    },
    trials: {
        type: Number,
        index: true,
        default: 0
    },
    status: {
        type: Number,
        enum: [-1, 0, 1, 2],
        index: true,
        default: 0,
        //-1 failed, status: 0=> pending , 1 => pin sent, 2 => used
    },
    otp_mode: {
        type: String,
        enum: ['sms', 'call', 'whatsapp', 'email'],
        default: 'sms'
    },
    data: {
        type: Object,
        default: {}
    }
});
const MessageRequest = new Schema({
    id: Schema.Types.ObjectId,
    email: {
        type: String
    },
    subject: {
        type: String
    },
    name: {
        type: String
    },
    task_type: {
        type: String,
        enum: ["generic", "mail-template", "trip-receipt"],
        required: true
    },
    status: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0,
        // status: 0=> pending , 1 => pin sent, 2 => successful, 3 => failed
    },
    message: {
        type: String
    },
    data: {
        type: Object,
        default: {}
    },
    trials: {
        type: Number,
        default: 0
    },
    failure_reason: {
        type: String,
    },
}, {
    timestamps: true,
    minimize: false,
    id: true
});
const OtpRequestModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.otp_requests, otpRequests);
exports.OtpRequestModel = OtpRequestModel;
const MsgRequestModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.message_requests, MessageRequest);
exports.MsgRequestModel = MsgRequestModel;
