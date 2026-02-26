import { Schema } from "mongoose";
import { DatabaseTableList } from "../assets/var-config";
import { dbConn, InferSchemaType, mongoose, tableID } from "./dbConnector";

const DashcamAlarms = new mongoose.Schema({
  operator_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.user_operators,
  },
  vehicle_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.vehicle_lists,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: DatabaseTableList.dashcam_devices,
  },
  alarm_ref: {
    type: String,
    required: true,
    maxlength: 100,
  },
  triggered_at: {
    type: Date,
    required: true,
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
  cleared_at: {
    type: Date,
  },
  trigger_detail: {
    type: mongoose.Schema.Types.Mixed,
  },
  clear_detail: {
    type: mongoose.Schema.Types.Mixed,
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
})

const DashcamActivityLog = new mongoose.Schema({
  operator_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.user_operators,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: DatabaseTableList.dashcam_devices,
  },
  vehicle_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.vehicle_lists,
  },
  activity_type: {
    type: String,
    maxlength: 50,
  },
  activity_detail: {
    type: mongoose.Schema.Types.Mixed,
  },
  message: {
    type: String,
    maxlength: 500,
  },
}, {
  id: true,
  timestamps: true,
  minimize: true
})

const DashcamLocations = new mongoose.Schema({
  operator_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.user_operators,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: DatabaseTableList.dashcam_devices,
  },
  vehicle_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.vehicle_lists,
  },
  gps_timestamp: {
    type: Date,
    index: true,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  speed: {
    type: Number,
    default: 0,
  },
  heading: {
    type: Number,
  },
  acc_status: {
    type: Number,
    enum: [0, 1], //0 - off, 1 - on
    default: 0,
  },
  alarm_flag: {
    type: Number,
    default: 0,
  },
  satellite_count: {
    type: Number,
    default: 0,
  },
  signal_strength: {
    type: Number,
    default: 0,
  },
  mileage: {
    type: Number,
    default: 0,
  }
}, {
  id: true,
  timestamps: true,
  minimize: true
})

const LocationSummary = new mongoose.Schema({
  operator_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.user_operators,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: DatabaseTableList.dashcam_devices,
  },
  vehicle_id: {
    type: Schema.Types.ObjectId,
    index: { sparse: true },
    ref: DatabaseTableList.vehicle_lists,
  },
  start_time: {
    type: Date,
    index: true,
    required: true,
  },
  end_time: {
    type: Date,
    index: true,
    required: true,
  },
  distance: {
    type: Number,
    default: 0,
  },
  max_speed: {
    type: Number,
    default: 0,
  },
  average_speed: {
    type: Number,
    default: 0,
  },
  driving_time: {
    type: Number,
    default: 0,
  },
  stationary_time: {
    type: Number,
    default: 0,
  },
  parking_time: {
    type: Number,
    default: 0,
  },
  speed_violations: {
    type: Number,
    default: 0,
  },
  alarms: {
    type: Number,
    default: 0,
  },
  mild_alarms: {
    type: Number,
    default: 0,
  },
  critical_alarms: {
    type: Number,
    default: 0,
  },
}, {
  id: true,
  timestamps: true,
  minimize: true
})

export const DashcamAlarmModel = dbConn.model(DatabaseTableList.dashcam_alarms, DashcamAlarms)
export type DashcamAlarmTypes = InferSchemaType<typeof DashcamAlarms> & tableID

export const DashcamActivityLogModel = dbConn.model(DatabaseTableList.dashcam_activity_logs, DashcamActivityLog)
export type DashcamActivityLogTypes = InferSchemaType<typeof DashcamActivityLog> & tableID

export const DashcamLocationModel = dbConn.model(DatabaseTableList.dashcam_locations, DashcamLocations)
export type DashcamLocationTypes = InferSchemaType<typeof DashcamLocations> & tableID

export const LocationSummaryModel = dbConn.model(DatabaseTableList.dashcam_locstats, LocationSummary)
export type LocationSummaryTypes = InferSchemaType<typeof LocationSummary> & tableID
