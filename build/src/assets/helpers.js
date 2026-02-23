"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalTimeZones = exports.GlobalConnectedDevices = void 0;
const request_1 = __importDefault(require("request"));
const validator_1 = __importDefault(require("validator"));
const luxon_1 = require("luxon");
const device_lists_1 = require("../models/device-lists");
const device_data_1 = require("../models/device-data");
const activity_logs_1 = require("../models/activity-logs");
exports.GlobalConnectedDevices = new Map(); //for storing connected devices and their auth_id
//@ts-ignore
exports.GlobalTimeZones = Intl.supportedValuesOf('timeZone');
class helpers {
    constructor() { }
    static get errorText() {
        return {
            failedToProcess: "Failed to process your request"
        };
    }
    static async takeASleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    static csvToJsonArray(csvString) {
        const lines = csvString.split('\n');
        // Read headers
        const headers = lines[0].split(',').map((header) => header.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip empty or whitespace-only rows
            if (!line)
                continue;
            const values = line.split(',');
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j] ? values[j].trim() : '';
            }
            // Skip rows where all fields are empty
            if (Object.values(obj).every(val => val === ""))
                continue;
            data.push(obj);
        }
        return data;
    }
    static generatePassword(len = 6) {
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
    }
    ;
    static generateRandomString(len = 200) {
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
        let code = '';
        let xLen = characters.length - 1;
        for (let i = 0; i < len; i++) {
            code += characters.charAt(Math.random() * xLen);
        }
        return code;
    }
    static generateOTPCode(len = 4) {
        return String(Math.random() * 999).replace(/\./, "").substring(0, len);
    }
    static emailIsValid(email) {
        if (/\@gmail./.test(email) && !/.com$/.test(email)) {
            return false;
        }
        else if (/@mail./.test(email)) {
            return false;
        }
        return true;
    }
    // for checking input fields
    static getInputValueString(inputObj, field) {
        return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'string'
            ? inputObj[field].trim() : '';
    }
    // for getting input fields number
    static getInputValueNumber(inputObj, field) {
        return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'number'
            ? inputObj[field] : '';
    }
    // for getting input fields object
    static getInputValueObject(inputObj, field) {
        return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'object' ? inputObj[field] : {};
    }
    // for getting input fields array
    static getInputValueArray(inputObj, field) {
        return inputObj instanceof Object && inputObj.hasOwnProperty(field) && inputObj[field] instanceof Array ? inputObj[field] : [];
    }
    static outputSuccess(res, data) {
        return res.json({ status: "ok", data });
    }
    static outputError(res, code, message) {
        res.statusCode = code || 406;
        let outputObj = {};
        switch (code) {
            case 400:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Bad Request`
                };
                break;
            case 401:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Unauthorized`
                };
                break;
            case 404:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Requested resources does not exist`
                };
                break;
            case 405:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Method Not Allowed`
                };
                break;
            case 406:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Requested Not Acceptable`
                };
                break;
            case 410:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Content exist, but has been moved from the current state. Please refetch`
                };
                break;
            case 417:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Record does not exist`
                };
                break;
            case 500:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Oops! Something went wrong.`
                };
                break;
            case 501:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `No changes made. Your request wasn't implemented`
                };
                break;
            case 503:
                outputObj = {
                    code: code,
                    status: "error",
                    error: typeof message !== 'undefined' ? message : `Service Unavailable`
                };
                break;
            default:
                outputObj = {
                    code: res.statusCode,
                    status: "error",
                    error: message || `Requested Not Acceptable`
                };
        }
        return res.json(outputObj);
    }
    static async makeHttpRequest({ url, method, json, form, formData, headers }) {
        return new Promise((resolve, reject) => {
            (0, request_1.default)({
                url, method: method, form: form, json: json, headers: headers, formData: formData
            }, (error, res, body) => {
                resolve(error ? { status: res.statusCode, error: error } : { status: res.statusCode, body: body });
            });
        });
    }
    static getOperatorAuthID(userData) {
        return userData.account_type === "team" ? userData.operator_id : userData.auth_id;
    }
    //for validating number
    static isNumber(data) {
        if (!data.input)
            return false;
        //check the lenth
        if (data.length && String(data.input).length !== data.length)
            return false;
        if (data.minLength && String(data.input).length < data.minLength)
            return false;
        if (data.maxLength && String(data.input).length > data.maxLength)
            return false;
        let isNumber = data.type === "float" ? /^-?\d+\.\d+$/.test(data.input)
            : data.type === "float-int" ? /^-?\d+(\.\d+)?$/.test(data.input) : /^-?\d+$/.test(data.input);
        //if it's invalid
        if (isNumber) {
            //if the unit is not positive
            if (data.unit === "positive" && parseFloat(data.input) < 0)
                return false;
            if (data.unit === "negative" && parseFloat(data.input) > -1)
                return false;
            if (data.min && parseFloat(data.input) < data.min)
                return false;
            if (data.max && parseFloat(data.input) > data.max)
                return false;
        }
        return isNumber;
    }
    //if the ID is not mongo
    static isInvalidID(ID) {
        return !ID ? true : !validator_1.default.isMongoId(ID);
    }
    //checking valid time format
    static isTimeFormat(input) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(input);
    }
    static isDateFormat(input) {
        return /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(input);
    }
    //checking only alphabet
    static hasAlphabet(value, minLength) {
        return minLength ? new RegExp(`(?:[A-Za-z].*){${minLength}}`).test(value) : /[a-zA-Z]+/.test(value);
    }
    static isAllowedCharacters(input, regex = "") {
        // return /^[\w\-\'\.\s\@]+$/i.test(input);
        const pattern = new RegExp(`^[\\w\\-'.\\s@${regex}]+$`, 'i');
        return pattern.test(input);
    }
    static hasInvalidSearchChar(text) {
        return /[\*\=\'\<\>\]\\\}\{\|]/.test(text);
    }
    static setJWTExpireTime() {
        let nextDate = new Date();
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        nextDate.setUTCHours(2, 0, 0);
        return Math.round((nextDate.getTime() - new Date().getTime()) / 1000);
    }
    static convertDateTimeZone(data) {
        let convertTime = luxon_1.DateTime.fromISO(data.dateString, { zone: data.fromTimeZone || "utc" }).setZone(data.toTimeZone || "utc"); // your user's timezone
        let timeOut = convertTime.toFormat("HH:mm");
        let dateOut = convertTime.toFormat("yyyy-MM-dd");
        let pop = {
            time: timeOut, date: dateOut,
            hr: parseInt(timeOut.substring(0, 2)),
            dateObj: new Date(convertTime.toISO({ includeOffset: false }) + "Z"),
            day: convertTime.weekday === 7 ? 0 : convertTime.weekday,
        };
        return pop;
    }
    //getting pagination number
    static getPageItemPerPage(itemPerPage, page) {
        let result = { page: 1, item_per_page: 50 };
        //if item per page
        if (itemPerPage) {
            //if the value is not a number
            if (!/^\d+$/.test(String(itemPerPage))) {
                return { status: false, data: result, msg: 'Item per page expect a number' };
            }
            let itemP = parseInt(itemPerPage);
            //if the dataset is greater than 200, set to 50
            if (itemP > 200) {
                itemP = 50;
            }
            result.item_per_page = itemP;
        }
        //if item per page
        if (page) {
            //if the value is not a number
            if (!/^\d+$/.test(String(page))) {
                return { status: false, data: result, msg: 'Page expect a number' };
            }
            //check the item perpage if present
            if (parseInt(page) < 1) {
                return { status: false, data: result, msg: 'Invalid page number' };
            }
        }
        //start index
        result.page = page ? (parseInt(page) - 1) * result.item_per_page : 0;
        //return the result
        return { status: true, data: result, msg: undefined };
    }
    //get connected device data
    static async getConnectedDeviceData(deviceNumber) {
        //if the data exist in the map
        if (exports.GlobalConnectedDevices.has(deviceNumber)) {
            return exports.GlobalConnectedDevices.get(deviceNumber);
        }
        //fetch the data from the database and store it in the map
        let deviceData = await device_lists_1.DashcamDeviceModel.findOne({ device_number: deviceNumber }, { operator_id: 1, vehicle_id: 1, _id: 1 }).lean().catch(e => ({ error: e }));
        //if there's data and no error, store it in the map and return the data
        if (deviceData && !deviceData.error) {
            let sendData = {
                operator_id: String(deviceData.operator_id),
                vehicle_id: String(deviceData.vehicle_id),
                device_id: String(deviceData._id)
            };
            exports.GlobalConnectedDevices.set(deviceNumber, sendData);
            return sendData;
        }
        return null;
    }
    //for logging dashcam activity
    static async logDashcamActivity(data) {
        //if there's no valid data
        if (!data.operator_id || !data.device_id || !data.activity_type)
            return;
        await device_data_1.DashcamActivityLogModel.create(data).catch(e => ({ error: e }));
    }
    //for logging operator activity
    static async logOperatorActivity(data) {
        //if there's no valid data
        if (!data.auth_id || !data.body || !data.operator_id || !data.operation)
            return;
        await activity_logs_1.OperatorLogModel.create(data).catch(e => ({ error: e }));
    }
}
exports.default = helpers;
