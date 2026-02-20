import { DatabaseTableList } from "../assets/var-config";
import { dbConn, InferSchemaType, mongoose } from "./dbConnector";
const Schema = mongoose.Schema;

// Admin Log
const Adminlog = new Schema({
  auth_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.user_admins,
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
})


// Operator Log
const Operatorlog = new Schema({
  id: Schema.Types.ObjectId,
  auth_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.user_operators,
    required: true
  },
  operator_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.user_operators,
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
})
Operatorlog.index({ "data.id": 1 }, { sparse: true })

const OperatorLogModel = dbConn.model(DatabaseTableList.operator_logs, Operatorlog);
const AdminLogModel = dbConn.model(DatabaseTableList.admin_activity_logs, Adminlog);
type OperatorLogTypes = InferSchemaType<typeof Operatorlog>
type AdminLogSchemaTypes = InferSchemaType<typeof Adminlog>

export { AdminLogModel, AdminLogSchemaTypes, OperatorLogModel, OperatorLogTypes }