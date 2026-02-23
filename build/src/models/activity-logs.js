"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorLogModel = exports.AdminLogModel = void 0;
const var_config_1 = require("../assets/var-config");
const dbConnector_1 = require("./dbConnector");
const Schema = dbConnector_1.mongoose.Schema;
// Admin Log
const Adminlog = new Schema({
    auth_id: {
        type: Schema.Types.ObjectId,
        ref: var_config_1.DatabaseTableList.user_admins,
        required: true
    },
    operation: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true,
    minimize: false,
    id: true
});
// Operator Log
const Operatorlog = new Schema({
    id: Schema.Types.ObjectId,
    auth_id: {
        type: Schema.Types.ObjectId,
        ref: var_config_1.DatabaseTableList.user_operators,
        required: true
    },
    operator_id: {
        type: Schema.Types.ObjectId,
        ref: var_config_1.DatabaseTableList.user_operators,
        index: true,
        required: true
    },
    operation: {
        type: String,
        index: true,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true,
    minimize: false,
    id: true
});
Operatorlog.index({ "data.id": 1 }, { sparse: true });
const OperatorLogModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.operator_logs, Operatorlog);
exports.OperatorLogModel = OperatorLogModel;
const AdminLogModel = dbConnector_1.dbConn.model(var_config_1.DatabaseTableList.admin_activity_logs, Adminlog);
exports.AdminLogModel = AdminLogModel;
