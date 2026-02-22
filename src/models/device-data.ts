import { Schema } from "mongoose";
import { DatabaseTableList } from "../assets/var-config";
import { dbConn, InferSchemaType, mongoose, tableID } from "./dbConnector";

const DashcamAlarms = new mongoose.Schema({
  operator_id: {
    type: Schema.Types.ObjectId,
    index: true,
    ref: DatabaseTableList.user_operators,
  },
  vehicle_id: {
    type: Schema.Types.ObjectId,
    index: true,
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
    index: true,
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
    index: true,
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
    index: true,
    ref: DatabaseTableList.user_operators,
  },
  device_id: {
    type: Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: DatabaseTableList.dashcam_devices,
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
})

export const DashcamAlarmModel = dbConn.model(DatabaseTableList.dashcam_alarms, DashcamAlarms)
export type DashcamAlarmTypes = InferSchemaType<typeof DashcamAlarms> & tableID

export const DashcamActivityLogModel = dbConn.model(DatabaseTableList.dashcam_activity_logs, DashcamActivityLog)
export type DashcamActivityLogTypes = InferSchemaType<typeof DashcamActivityLog> & tableID

export const DashcamLocationModel = dbConn.model(DatabaseTableList.dashcam_locations, DashcamLocations)
export type DashcamLocationTypes = InferSchemaType<typeof DashcamLocations> & tableID
