"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOperatorModel = void 0;
const mongoose_1 = require("mongoose");
const var_config_1 = require("../assets/var-config");
const dbConnector_1 = require("./dbConnector");
const Operators = new dbConnector_1.mongoose.Schema({
    business_name: {
        type: String,
        index: true,
        maxlength: 100,
    },
    email: {
        type: String,
        unique: true,
        maxlength: 120,
        required: true,
    },
    email_status: {
        type: Number,
        enum: [0, 1],
        default: 0,
        //0 => not confirmed, 1 => confirmed
    },
    business_type: {
        type: Number,
        enum: [1, 2],
        required: true,
        //1 => individual, 2 => company
    },
    fleet_size: {
        type: Number,
        default: 0,
    },
    phone_number: {
        type: String,
        maxlength: 16,
    },
    business_number: {
        type: String,
        maxlength: 16,
    },
    password: {
        type: String,
        default: ""
    },
    business_logo: {
        type: String
    },
    // bizcat_id: {
    //   type: Schema.Types.ObjectId,
    //   ref: DatabaseTableList.admin_business_categories,
    // },
    account_type: {
        type: String,
        enum: ["operator", "team"],
        default: "operator",
    },
    country: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    operator_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: var_config_1.DatabaseTableList.user_operators,
        index: { sparse: true }
    },
    account_status: {
        type: Number,
        default: 0,
        //0 pending 1 active 2 suspend, 3 deleted
    },
    role_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: var_config_1.DatabaseTableList.operator_roles,
    },
    suspend_reason: {
        type: String,
        default: ""
    },
}, {
    id: true,
    timestamps: true,
    minimize: true
});
const UserOperatorModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.user_operators, Operators);
exports.UserOperatorModel = UserOperatorModel;
