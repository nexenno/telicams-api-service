import { IncomingHttpHeaders } from "http";
import { varConfig } from "../assets/var-config";
import { PipelineStage } from "mongoose";
import { mongoose } from "../models/dbConnector";
import { SimpleJsPrivateMethodProps } from "@increase21/simplenodejs";
export type UserTypes = (typeof varConfig.user_types)[number]
export type SendDBQuery<T = ObjectPayload> = T & { error?: any } | ObjectPayload & { error?: any } | null
export type PipelineQuery = PipelineStage[]
export type NotificationType = (typeof varConfig.notification_type)[number]

export type MakeHTTPReqProp = {
  url: string;
  json?: object;
  form?: ObjectPayload;
  method?: string;
  formData?: object;
  headers?: IncomingHttpHeaders;
}

export type ObjectPayload = {
  [key: string]: any
}

export type JWTTokenPayload = {
  auth_id: string;
  user_type: UserTypes;
  name: string;
  role_list?: ObjectPayload;
  account_type?: string;
  operator_id?: string;
}

export type sendMailData = {
  from: string,
  to: string | string[],
  subject: string,
  text?: string,
  attachments?: Array<string>,
  html?: string | undefined;
  replyTo?: string;
}

export type EmailMsgData = {
  _id: string;
  message: string;
  email: string;
  subject: string;
  name: string;
  pin: string;
  reply_to: string;
  task_type: string;
  data: ObjectPayload;
  cc?: string | string[];
  bcc?: string | string[];
};

export type phoneMsgData = {
  _id?: string;
  phone_number: string;
  name: string;
  pin: string;
  otp_mode: "call" | "sms" | "whatsapp";
  message: string;
  task_type: "otp" | "generic";
  signature?: string | undefined;
};

export type IsNumberProp = {
  input: string,
  type: "float" | "int" | "float-int",
  length?: number,
  minLength?: number;
  maxLength?: number;
  unit?: "positive" | "negative",
  min?: number,
  max?: number
}

export type RemoteNotificationIncoming = {
  auth_id: string;
  title: string;
  message: string;
  sound_name: string;
  priority: '0' | '1';
  channel_id?: string;
  data_only: boolean;
  save_message: boolean;
  token: string;
  notification_type: NotificationType;
  data: ObjectPayload;
}

export type UserNotificationTable = {
  id?: any;
  auth_id: mongoose.Types.ObjectId;
  notification: {
    title: string;
    body: string;
  };
  data: {
    notification_type: string
  };
  data_type?: 'personal' | 'all';
  record_type?: string;
  status?: number
}
export type PrivateMethodProps = Omit<SimpleJsPrivateMethodProps, "customData"> & Required<Pick<SimpleJsPrivateMethodProps, "customData">>