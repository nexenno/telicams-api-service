import { DatabaseTableList, varConfig } from "../assets/var-config";
import { dbConn, mongoose, tableID } from "./dbConnector";
const Schema = mongoose.Schema;

const otpRequests = new Schema({
  otp_type: {
    type: String,
    enum: varConfig.otp_type,
    required: true,
  },
  user_type: {
    type: String,
    enum: varConfig.user_types,
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
})

const OtpRequestModel = dbConn.model(DatabaseTableList.otp_requests, otpRequests);
type OtpRequestTypes = mongoose.InferSchemaType<typeof otpRequests> & tableID;
const MsgRequestModel = dbConn.model(DatabaseTableList.message_requests, MessageRequest);

export { OtpRequestModel, OtpRequestTypes, MsgRequestModel };
