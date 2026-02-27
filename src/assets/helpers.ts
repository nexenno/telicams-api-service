import request from "request"
import validator from "validator"
import { DateTime } from "luxon";
import {
  MakeHTTPReqProp, ObjectPayload, IsNumberProp,
  JWTTokenPayload, SendDBQuery, ConnectedDeviceValues,
} from "../typings/general"
// import { AdminLogModel, OperatorLogModel } from "../models/activity-logs"
import { ResponseObject } from "@increase21/simplenodejs/dist/typings/general"
import { DashcamDeviceModel, DashcamDeviceTypes } from "../models/device-lists"
import { DashcamActivityLogModel } from "../models/device-data"
import { OperatorLogModel } from "../models/activity-logs"
import { fileConfig } from "./file-config";
import { OptVehicleListModel, OptVehicleListTypes } from "../models/opt-vehlists";
import { GlobalConnectedDevices } from "./var-param";
import { DatabaseTableList } from "./var-config";


export default class helpers {
  constructor() { }

  static get errorText() {
    return {
      failedToProcess: "Failed to process your request"
    }
  }

  static async takeASleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  static csvToJsonArray(csvString: string): object[] {
    const lines = csvString.split('\n');

    // Read headers
    const headers = lines[0].split(',').map((header: string) => header.trim());

    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty or whitespace-only rows
      if (!line) continue;

      const values = line.split(',');
      const obj: { [key: string]: string } = {};

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[j] ? values[j].trim() : '';
      }

      // Skip rows where all fields are empty
      if (Object.values(obj).every(val => val === "")) continue;

      data.push(obj);
    }

    return data;
  }

  static generatePassword(len: number = 6): string {
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let number = "0123456789";
    let code = "";

    let xLen = characters.length - 1;
    for (let i = 0; i < len; i++) {
      code += characters.charAt(Math.random() * xLen);
      code += characters.charAt(Math.random() * xLen).toLowerCase();
      code += i; //number.charAt(Math.random() * xLen)
    }
    return code.slice(0, 8);
  };

  static generateRandomString(len: number = 200): string {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'
    let code = ''
    let xLen = characters.length - 1;
    for (let i = 0; i < len; i++) {
      code += characters.charAt(Math.random() * xLen)
    }
    return code
  }

  static generateOTPCode(len: number = 4) {
    return String(Math.random() * 999).replace(/\./, "").substring(0, len)
  }

  static emailIsValid(email: string): boolean {
    if (/\@gmail./.test(email) && !/.com$/.test(email)) {
      return false
    } else if (/@mail./.test(email)) {
      return false
    }
    return true
  }

  // for checking input fields
  static getInputValueString(inputObj: object | any, field: string): string {
    return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'string'
      ? inputObj[field].trim() : ''
  }

  // for getting input fields number
  static getInputValueNumber(inputObj: object | any, field: string): number | string {
    return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'number'
      ? inputObj[field] : ''
  }

  // for getting input fields object
  static getInputValueObject(inputObj: object | any, field: string): any {
    return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'object' ? inputObj[field] : {}
  }

  // for getting input fields array
  static getInputValueArray(inputObj: object | any, field: string): any[] {
    return inputObj instanceof Object && inputObj.hasOwnProperty(field) && inputObj[field] instanceof Array ? inputObj[field] : []
  }

  static outputSuccess(res: ResponseObject, data?: any): void {
    return res.json({ status: "ok", data })
  }

  static outputError(res: ResponseObject, code: number | null, message?: string): void {
    res.statusCode = code || 406
    let outputObj = {}
    switch (code) {
      case 400:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Bad Request`
        }
        break
      case 401:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Unauthorized`
        }
        break
      case 404:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Requested resources does not exist`
        }
        break
      case 405:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Method Not Allowed`
        }
        break
      case 406:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Requested Not Acceptable`
        }
        break;
      case 410:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Content exist, but has been moved from the current state. Please refetch`
        }
        break;
      case 417:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Record does not exist`
        }
        break;
      case 500:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Oops! Something went wrong.`
        }
        break;
      case 501:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `No changes made. Your request wasn't implemented`
        }
        break;
      case 503:
        outputObj = {
          code: code,
          status: "error",
          error: typeof message !== 'undefined' ? message : `Service Unavailable`
        }
        break;
      default:
        outputObj = {
          code: res.statusCode,
          status: "error",
          error: message || `Requested Not Acceptable`
        }
    }
    return res.json(outputObj)
  }

  static async makeHttpRequest({ url, method, json, form, formData, headers }: MakeHTTPReqProp): Promise<{ status: number, body?: any, error?: any }> {
    return new Promise((resolve, reject) => {
      request({
        url, method: method, form: form, json: json, headers: headers, formData: formData
      }, (error, res, body) => {
        resolve(error ? { status: (res || {}).statusCode, error: error } : { status: (res || {}).statusCode, body: body })
      })
    })
  }


  static getOperatorAuthID(userData: JWTTokenPayload) {
    return userData.account_type === "team" ? userData.operator_id : userData.auth_id
  }

  //for validating number
  static isNumber(data: IsNumberProp): boolean {
    if (!data.input) return false;
    //check the lenth
    if (data.length && String(data.input).length !== data.length) return false;
    if (data.minLength && String(data.input).length < data.minLength) return false;
    if (data.maxLength && String(data.input).length > data.maxLength) return false;

    let isNumber = data.type === "float" ? /^-?\d+\.\d+$/.test(data.input)
      : data.type === "float-int" ? /^-?\d+(\.\d+)?$/.test(data.input) : /^-?\d+$/.test(data.input);
    //if it's invalid
    if (isNumber) {
      //if the unit is not positive
      if (data.unit === "positive" && parseFloat(data.input) < 0) return false;
      if (data.unit === "negative" && parseFloat(data.input) > -1) return false;
      if (data.min && parseFloat(data.input) < data.min) return false;
      if (data.max && parseFloat(data.input) > data.max) return false;
    }

    return isNumber;
  }

  //if the ID is not mongo
  static isInvalidID(ID: string): boolean {
    return !ID ? true : !validator.isMongoId(ID)
  }

  //checking valid time format
  static isTimeFormat(input: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(input)
  }

  static isDateFormat(input: string) {
    return /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(input)
  }

  //checking only alphabet
  static hasAlphabet(value: string, minLength?: number): boolean {
    return minLength ? new RegExp(`(?:[A-Za-z].*){${minLength}}`).test(value) : /[a-zA-Z]+/.test(value)
  }

  static isAllowedCharacters(input: string, regex: string = ""): boolean {
    // return /^[\w\-\'\.\s\@]+$/i.test(input);
    const pattern = new RegExp(`^[\\w\\-'.\\s@${regex}]+$`, 'i');
    return pattern.test(input);
  }

  static hasInvalidSearchChar(text: string) {
    return /[\*\=\'\<\>\]\\\}\{\|]/.test(text)
  }

  static setJWTExpireTime(): number {
    let nextDate = new Date()
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    nextDate.setUTCHours(2, 0, 0)
    return Math.round((nextDate.getTime() - new Date().getTime()) / 1000)
  }


  static convertDateTimeZone(data: { dateString: string; fromTimeZone: string | "utc"; toTimeZone: string | "utc" }) {
    let convertTime = DateTime.fromISO(data.dateString, { zone: data.fromTimeZone || "utc" }).setZone(data.toTimeZone || "utc"); // your user's timezone
    let timeOut = convertTime.toFormat("HH:mm");
    let dateOut = convertTime.toFormat("yyyy-MM-dd");
    let pop = {
      time: timeOut, date: dateOut,
      hr: parseInt(timeOut.substring(0, 2)),
      dateObj: new Date(convertTime.toISO({ includeOffset: false }) + "Z"),
      day: convertTime.weekday === 7 ? 0 : convertTime.weekday,
    }
    return pop;
  }

  //getting pagination number
  static getPageItemPerPage(itemPerPage: string, page: string) {
    let result = { page: 1, item_per_page: 50 }
    //if item per page
    if (itemPerPage) {
      //if the value is not a number
      if (!/^\d+$/.test(String(itemPerPage))) {
        return { status: false, data: result, msg: 'Item per page expect a number' }
      }
      let itemP = parseInt(itemPerPage)
      //if the dataset is greater than 200, set to 50
      if (itemP > 200) {
        itemP = 50;
      }
      result.item_per_page = itemP
    }

    //if item per page
    if (page) {
      //if the value is not a number
      if (!/^\d+$/.test(String(page))) {
        return { status: false, data: result, msg: 'Page expect a number' }
      }
      //check the item perpage if present
      if (parseInt(page) < 1) {
        return { status: false, data: result, msg: 'Invalid page number' }
      }
    }

    //start index
    result.page = page ? (parseInt(page) - 1) * result.item_per_page : 0;

    //return the result
    return { status: true, data: result, msg: undefined }
  }

  //get connected device data
  static async getConnectedDeviceData(deviceNumber: string) {
    //if the data exist in the map
    if (GlobalConnectedDevices.has(deviceNumber)) {
      return GlobalConnectedDevices.get(deviceNumber)
    }
    //check if the device is prepared on the system already
    let getDevice: SendDBQuery = await DashcamDeviceModel.aggregate([
      { $match: { device_number: deviceNumber, } },
      {
        $lookup: {
          from: DatabaseTableList.vehicle_lists,
          let: { deviceID: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$device_id", "$$deviceID"] } } },
            { $project: { vehicle_status: 1, operator_id: 1 } },
          ],
          as: "vehicle_data"
        }
      },
      { $unwind: { path: "$vehicle_data", preserveNullAndEmptyArrays: true } },
    ]).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (getDevice && getDevice.error) return null

    let deviceData = getDevice[0] as (DashcamDeviceTypes & { vehicle_data?: { _id: number, operator_id: string } })

    //if there's data and no error, store it in the map and return the data
    if (deviceData && deviceData._id && deviceData.operator_id && deviceData.vehicle_data && deviceData.vehicle_data._id) {
      let sendData = {
        operator_id: deviceData.operator_id ? String(deviceData.operator_id) : undefined,
        vehicle_id: (deviceData.vehicle_data && deviceData.vehicle_data._id) ? String(deviceData.vehicle_data._id) : undefined,
        device_id: deviceData._id ? String(deviceData._id) : undefined
      }
      GlobalConnectedDevices.set(deviceNumber, sendData)
      return sendData
    }

    return null
  }

  static async sendRequestToGateway(data: { url: string, method: 'POST' | 'GET', json?: ObjectPayload, }) {
    let sendReq = await helpers.makeHttpRequest({
      url: data.url, method: data.method, json: data.json,
      headers: { "Authorization": `Bearer ${fileConfig.config.gatewaySecretOut || ""}` }
    })
    //if there's an error, log it
    if (sendReq && sendReq.error) {
      console.log("Error sending request to gateway ", data.json, sendReq.error)
      return { status: false, error: sendReq.error, data: undefined }
    }

    if (sendReq && sendReq.body) {
      sendReq.body = typeof sendReq.body === "string" ? JSON.parse(sendReq.body) : sendReq.body
    }

    //if the request is successful, return the response
    return (sendReq && sendReq.status) === 200 ? { status: true, error: undefined, data: sendReq.body } :
      { status: false, error: sendReq, data: undefined }
  }

  //for logging dashcam activity
  static async logDashcamActivity(data: {
    operator_id?: string, device_id: string, activity_type: string,
    activity_detail?: ObjectPayload, message: string; vehicle_id?: string,
  }): Promise<void> {

    //if there's no valid data
    if (!data.operator_id || !data.device_id || !data.activity_type) return
    await DashcamActivityLogModel.create(data).catch(e => ({ error: e }))
  }

  //for logging operator activity
  static async logOperatorActivity(data: {
    operation: string, auth_id: string, body: string, data: ObjectPayload, operator_id: string,
  }): Promise<void> {
    //if there's no valid data
    if (!data.auth_id || !data.body || !data.operator_id || !data.operation) return
    await OperatorLogModel.create(data).catch(e => ({ error: e }))
  }

  // static async logAdminActivity(data: { operation: string, auth_id: string, body: string, data: ObjectPayload }): Promise<void> {
  //   //if there's no valid data
  //   if (!data.auth_id || !data.body || !data.operation) return
  //   await AdminLogModel.create(data).catch(e => ({ error: e }))
  // }

  static async checkVehicleBelongsToOperator(vehicleID: string, optID: string | undefined) {
    //check if the device number belongs to the operator
    let optVehicle: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      operator_id: optID, _id: vehicleID
    }).populate("device_id", "vehicle_id device_number operator_id").lean().catch((e) => ({ error: e }))

    //if there's an error, return it
    if (optVehicle && optVehicle.error) return null

    //if there's no device, return an error
    if (!optVehicle) return null

    //if the vehicle does not have a device assigned
    if (!optVehicle.device_id || !optVehicle.device_id._id) return null

    //if there's a mismatch between the device and vehicle, return an error
    if (!optVehicle.device_id.vehicle_id || String(optVehicle.device_id.vehicle_id) !== vehicleID) {
      return null
    }

    return optVehicle as (OptVehicleListTypes & { device_id: { _id: string, vehicle_id: string, device_number: string, operator_id: string } })
  }


  //for getting request params
  static getRequestParams(filterObj: ObjectPayload) {
    let filKeys = typeof filterObj === "object" ? Object.keys(filterObj) : []
    let filStrn = '?'
    //map the filters in
    if (filKeys.length > 0) {
      for (let i in filKeys) {
        filStrn += `${filKeys[i]}=${filterObj[filKeys[i]]}${parseInt(i) + 1 === filKeys.length ? '' : '&'}`
      }
    }
    return filStrn
  }

}