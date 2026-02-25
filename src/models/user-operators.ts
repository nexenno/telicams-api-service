import { Schema } from "mongoose";
import { DatabaseTableList } from "../assets/var-config";
import { dbConn, InferSchemaType, mongoose, tableID } from "./dbConnector";

const Operators = new mongoose.Schema({
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
  vehspeed_limit: {
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
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.user_operators,
    index: { sparse: true }
  },
  account_status: {
    type: Number,
    default: 0,
    //0 pending 1 active 2 suspend, 3 deleted
  },
  role_id: {
    type: Schema.Types.ObjectId,
    ref: DatabaseTableList.operator_roles,
  },
  suspend_reason: {
    type: String,
    default: ""
  },
}, {
  id: true,
  timestamps: true,
  minimize: true
})


const UserOperatorModel = dbConn.model(DatabaseTableList.user_operators, Operators)
type UserOperatorTypes = InferSchemaType<typeof Operators> & tableID

export {
  UserOperatorModel, UserOperatorTypes
}