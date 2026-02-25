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
      default: "Point",
    },
    coordinates: {
      type: [Number],
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
  online_status: {
    type: Number,
    default: 0, //0-off, 1-on
  },
  acc_status: {
    type: Number,
    default: 0, //0-off, 1-on
  },
  vehicle_model: {
    type: String,
    default: "",
  },
  vehicle_vin: {
    type: String,
    default: "",
  },
  vehspeed_limit: {
    type: Number,
    default: 0,
  },
  vehicle_status: {
    type: Number,
    enum: [0, 1, 2], //0-pending, 1-active, 2-suspended,
    default: 0,
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