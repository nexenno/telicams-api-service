import { DatabaseTableList } from "../assets/var-config";
import { dbConn, InferSchemaType, mongoose } from "./dbConnector";
const Schema = mongoose.Schema;

const OptVehicles = new Schema({
  operator_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.user_operators,
    index: true,
    required: true,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.dashcam_devices,
    index: true,
  },
  collection_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.collection_lists,
    index: true,
  },
  device_assigned: {
    type: Number,
    default: 0,
    // 0=> not assigned, 1=> assigned
  },
  year_purchase: {
    type: String,
    default: ""
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0],
    },
    updated_at: Date
  },
  plate_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
    maxlength: 23
  },
  device_assigned_at: {
    type: Date,
  },
  vehicle_oem: {
    type: String,
    default: "",
  },
  vehicle_model: {
    type: String,
    default: "",
  },
  vehicle_vin: {
    type: String,
    default: "",
  },
  status: {
    type: Number,
    enum: [0, 1, 2, 3], //0-pending, 1-active, 2-suspended,
    default: 0,//0 pending 1-active, 2-suspended by operator, 3-suspended by admin
  },
  suspend_reason: {
    type: String,
    default: ""
  },
  suspend_date: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
  minimize: false,
  id: true,
});

OptVehicles.index({ location: "2dsphere" });

const OptVehicleListModel = dbConn.model(DatabaseTableList.vehicle_lists, OptVehicles);
type OptVehicleListTypes = InferSchemaType<typeof OptVehicles> & { _id: mongoose.Types.ObjectId }
export { OptVehicleListModel, OptVehicleListTypes };