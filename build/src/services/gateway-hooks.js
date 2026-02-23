"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayHookService = void 0;
const helpers_1 = __importStar(require("../assets/helpers"));
const device_data_1 = require("../models/device-data");
const device_lists_1 = require("../models/device-lists");
class GatewayHookService {
    static async RegisterNewDevice({ res, body }) {
        let deviceID = body.deviceId;
        let manufacturer = body.manufacturer;
        let model = body.model;
        let provinceID = body.provinceId;
        let cityID = body.cityId;
        let licensePlate = body.licensePlate;
        //validate the inputs
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        if (!manufacturer)
            return helpers_1.default.outputError(res, null, "Manufacturer is required");
        if (!model)
            return helpers_1.default.outputError(res, null, "Model is required");
        if (!provinceID)
            return helpers_1.default.outputError(res, null, "Province ID is required");
        if (!cityID)
            return helpers_1.default.outputError(res, null, "City ID is required");
        //register the device in the database
        if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
            return helpers_1.default.outputError(res, null, "Device ID must be a number between 10 and 20 digits");
        }
        //if there's no manufacturer, model, province ID, city ID or license plate, return an error
        if (manufacturer.length < 2 || manufacturer.length > 50) {
            return helpers_1.default.outputError(res, null, "Manufacturer must be between 2 and 50 characters");
        }
        if (model.length < 2 || model.length > 50) {
            return helpers_1.default.outputError(res, null, "Model must be between 2 and 50 characters");
        }
        if (!helpers_1.default.isNumber({ input: String(provinceID), type: "int", minLength: 1, maxLength: 10 })) {
            return helpers_1.default.outputError(res, null, "Province ID must be a number between 1 and 10 digits");
        }
        if (!helpers_1.default.isNumber({ input: String(cityID), type: "int", minLength: 1, maxLength: 10 })) {
            return helpers_1.default.outputError(res, null, "City ID must be a number between 1 and 10 digits");
        }
        if (licensePlate) {
            if (licensePlate.length < 2 || licensePlate.length > 20) {
                return helpers_1.default.outputError(res, null, "License plate must be between 2 and 20 characters");
            }
        }
        //check if the device is prepared on the system already
        let getDevice = await device_lists_1.DashcamDeviceModel.findOne({
            device_number: deviceID
        }).lean().catch((e) => ({ error: e }));
        //if there's an error, return it
        if (getDevice && getDevice.error) {
            console.log("Error fetching device for registration ", getDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the device is not found
        if (!getDevice)
            return helpers_1.default.outputError(res, 404, "Device not found.");
        //if the device is not active for registration, return an error
        if (getDevice.active_status !== 1 || !getDevice.operator_id) {
            return helpers_1.default.outputError(res, null, "Device is not active for registration");
        }
        //if the gateway status already registered
        if (getDevice.gateway_status === 1)
            return res.status(200).json({ approved: true });
        //update the device with the new information and set the gateway status to registered
        let updateDevice = await device_lists_1.DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
            $set: {
                device_oem: manufacturer, device_model: model, province_id: provinceID,
                city_id: cityID, license_plate: licensePlate, gateway_status: 1
            }
        }, { new: true }).lean().catch((e) => ({ error: e }));
        //if there's an error, return it
        if (updateDevice && updateDevice.error) {
            console.log("Error updating device for registration ", updateDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the device is not found after update, return an error
        if (!updateDevice)
            return helpers_1.default.outputError(res, 404, "Device not found after update.");
        //log the registration activity
        await helpers_1.default.logDashcamActivity({
            device_id: String(updateDevice._id), operator_id: updateDevice.operator_id,
            activity_type: "DEVICE_REGISTRATION", vehicle_id: updateDevice.vehicle_id,
            activity_detail: { deviceID, manufacturer, model, provinceID, cityID, licensePlate },
            message: `Device ${deviceID} registered successfully.`
        });
        //return success response
        return res.status(200).json({ approved: true });
    }
    static async HandleEventDeviceConnected({ res, body }) {
        //     {
        //   "eventType": "DEVICE_CONNECTED",
        //   "deviceId": "628072951915",
        //   "manufacturer": "VENDOR",
        //   "model": "MODEL_X",
        //   "firmwareVersion": "v2.1.0",
        //   "provinceId": 12,
        //   "cityId": 34,
        //   "reconnectCount": 0,
        //   "connectedAt": "2026-02-21T10:30:00",
        //   "timestamp": "2026-02-21T10:30:00"
        // }
        let deviceID = body.deviceId;
        let manufacturer = body.manufacturer;
        let model = body.model;
        let reconnectCount = body.reconnectCount;
        let connectedAt = body.connectedAt;
        //validate the inputs
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        if (!manufacturer)
            return helpers_1.default.outputError(res, null, "Manufacturer is required");
        if (!model)
            return helpers_1.default.outputError(res, null, "Model is required");
        //validate the device ID
        if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
            return helpers_1.default.outputError(res, null, "Device ID must be a number between 10 and 20 digits");
        }
        //validate the manufacturer and model
        if (manufacturer.length < 2 || manufacturer.length > 50) {
            return helpers_1.default.outputError(res, null, "Manufacturer must be between 2 and 50 characters");
        }
        if (model.length < 2 || model.length > 50) {
            return helpers_1.default.outputError(res, null, "Model must be between 2 and 50 characters");
        }
        //reply the gateway
        res.status(200).json({ success: true });
        //update the device online status to true
        let updateDevice = await device_lists_1.DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
            $set: { online: true }
        }, { new: true }).lean().catch((e) => ({ error: e }));
        //if there's an error, return it
        if (updateDevice && updateDevice.error) {
            console.log("Error updating device for connection event ", updateDevice.error);
            return;
        }
        //if the device is not found after update, return an error
        if (!updateDevice)
            return;
        //set global connected 
        helpers_1.GlobalConnectedDevices.set(deviceID, {
            device_id: String(updateDevice._id),
            operator_id: String(updateDevice.operator_id || ""),
            vehicle_id: String(updateDevice.vehicle_id || "")
        });
        // log the connection event in the database for analytics and monitoring
        helpers_1.default.logDashcamActivity({
            device_id: String(updateDevice._id), operator_id: updateDevice.operator_id,
            activity_type: "DEVICE_CONNECTED", vehicle_id: updateDevice.vehicle_id,
            activity_detail: { deviceID, manufacturer, model, reconnectCount, connectedAt },
            message: `Device ${deviceID} connected successfully.`
        });
    }
    static async HandleEventDeviceDisconnected({ res, body }) {
        //     {
        //   "eventType": "DEVICE_DISCONNECTED",
        //   "deviceId": "628072951915",
        //   "reason": "tcp_close",
        //   "manufacturer": "VENDOR",
        //   "model": "MODEL_X",
        //   "reconnectCount": 2,
        //   "connectedAt": "2026-02-21T08:00:00",
        //   "lastActivityAt": "2026-02-21T10:29:55",
        //   "timestamp": "2026-02-21T10:30:00"
        // }
        let deviceID = body.deviceId;
        //validate the input
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        //validate the device ID
        if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
            return helpers_1.default.outputError(res, null, "Device ID must be a number between 10 and 20 digits");
        }
        //reply the gateway
        res.status(200).json({ success: true });
        //update the device online status to false
        let updateDevice = await device_lists_1.DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
            $set: { online: false }
        }, { new: true }).lean().catch((e) => ({ error: e }));
        //if there's an error, return it
        if (updateDevice && updateDevice.error) {
            console.log("Error updating device for disconnection event ", updateDevice.error);
            return;
        }
        //if the device is not found after update, return an error
        if (!updateDevice)
            return;
        //remove from global connected
        helpers_1.GlobalConnectedDevices.delete(deviceID);
        // log the disconnection event in the database for analytics and monitoring
        helpers_1.default.logDashcamActivity({
            device_id: String(updateDevice._id), operator_id: updateDevice.operator_id,
            activity_type: "DEVICE_DISCONNECTED", activity_detail: {},
            vehicle_id: updateDevice.vehicle_id,
            message: `Device ${deviceID} disconnected successfully.`
        });
    }
    static async HandleEventDeviceAlarmTriggered({ res, body }) {
        //     {
        //   "eventType": "ALARM_TRIGGERED",
        //   "eventId": "uuid",
        //   "deviceId": "628072951915",
        //   "alarmType": "OVERSPEED",
        //   "severity": "WARNING",
        //   "latitude": 6.5244,
        //   "longitude": 3.3792,
        //   "speed": 85.0,
        //   "triggeredAt": "2026-02-21T10:30:00",
        //   "detail": null,
        //   "timestamp": "2026-02-21T10:30:00"
        // }
        let deviceID = body.deviceId;
        let alarmType = body.alarmType;
        let severity = body.severity;
        let latitude = body.latitude;
        let longitude = body.longitude;
        let speed = body.speed;
        let eventId = body.eventId;
        //validate the inputs
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        if (!alarmType)
            return helpers_1.default.outputError(res, null, "Alarm type is required");
        if (!severity)
            return helpers_1.default.outputError(res, null, "Severity is required");
        //validate the device ID
        if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
            return helpers_1.default.outputError(res, null, "Device ID must be a number between 10 and 20 digits");
        }
        //validate the alarm type and severity
        if (alarmType.length < 2 || alarmType.length > 50) {
            return helpers_1.default.outputError(res, null, "Alarm type must be between 2 and 50 characters");
        }
        if (severity.length < 2 || severity.length > 50) {
            return helpers_1.default.outputError(res, null, "Severity must be between 2 and 50 characters");
        }
        //reply the gateway
        res.status(200).json({ success: true });
        let deviceData = await helpers_1.default.getConnectedDeviceData(deviceID);
        //if device data is not found, return
        if (!deviceData || !deviceData.device_id) {
            // console.log("Connected device data not found for device ID ", deviceID)
            return;
        }
        //log the alarm event in the database
        let logData = await device_data_1.DashcamAlarmModel.create({
            alarm_type: alarmType, severity: severity, status: 0,
            vehicle_id: deviceData.vehicle_id || undefined,
            latitude: latitude, longitude: longitude, speed: speed,
            triggered_at: new Date(), alarm_ref: eventId, trigger_detail: body.detail,
            operator_id: deviceData.operator_id, device_id: deviceData.device_id
        }).catch((e) => ({ error: e }));
        //if there's an error, return it
        if (logData && logData.error) {
            console.log("Error logging alarm event ", logData.error);
            return;
        }
        // log the alarm event in the database for analytics and monitoring
        helpers_1.default.logDashcamActivity({
            device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
            activity_type: "ALARM_TRIGGERED", vehicle_id: deviceData.vehicle_id,
            activity_detail: { alarmType, severity, latitude, longitude, speed, eventId },
            message: `Alarm ${alarmType} triggered on device ${deviceID} with severity ${severity}.`
        });
    }
    static async HandleEventDeviceAlarmCleared({ res, body }) {
        //     {
        //   "eventType": "ALARM_CLEARED",
        //   "eventId": "uuid",
        //   "deviceId": "628072951915",
        //   "alarmType": "OVERSPEED",
        //   "severity": "WARNING",
        //   "latitude": 6.5244,
        //   "longitude": 3.3792,
        //   "speed": 60.0,
        //   "triggeredAt": "2026-02-21T10:28:00",
        //   "clearedAt": "2026-02-21T10:30:00",
        //   "active": false,
        //   "detail": null,
        //   "timestamp": "2026-02-21T10:30:00"
        // }
        let deviceID = body.deviceId;
        let alarmType = body.alarmType;
        let eventId = body.eventId;
        //validate the inputs
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        if (!alarmType)
            return helpers_1.default.outputError(res, null, "Alarm type is required");
        //validate the device ID
        if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
            return helpers_1.default.outputError(res, null, "Device ID must be a number between 10 and 20 digits");
        }
        //validate the alarm type
        if (alarmType.length < 2 || alarmType.length > 50) {
            return helpers_1.default.outputError(res, null, "Alarm type must be between 2 and 50 characters");
        }
        //reply the gateway
        res.status(200).json({ success: true });
        let deviceData = await helpers_1.default.getConnectedDeviceData(deviceID);
        //if device data is not found, return
        if (!deviceData || !deviceData.device_id) {
            // console.log("Connected device data not found for device ID ", deviceID)
            return;
        }
        //update the alarm event in the database to set it as cleared
        let updateData = await device_data_1.DashcamAlarmModel.findOneAndUpdate({
            device_id: deviceData.device_id, alarm_ref: eventId
        }, {
            $set: { status: 1, cleared_at: new Date() }
        }, { new: true }).catch((e) => ({ error: e }));
        //if there's an error, return it
        if (updateData && updateData.error) {
            console.log("Error updating alarm event ", updateData.error);
            return;
        }
        // log the alarm cleared event in the database for analytics and monitoring
        helpers_1.default.logDashcamActivity({
            device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
            activity_type: "ALARM_CLEARED", vehicle_id: deviceData.vehicle_id,
            activity_detail: { alarmType, eventId },
            message: `Alarm ${alarmType} cleared on device ${deviceID}.`
        });
    }
    static async HandleDeviceStreamStartedAndStopped({ res, body }) {
        let deviceID = body.deviceId;
        //     {
        //   "eventType": "STREAM_STARTED",
        //   "deviceId": "628072951915",
        //   "sessionId": "uuid",
        //   "channelId": 1,
        //   "streamType": "MAIN",
        //   "dataType": "AUDIO_VIDEO",
        //   "startedAt": "2026-02-21T10:30:00",
        //   "status": "PENDING",
        //   "timestamp": "2026-02-21T10:30:00"
        //     }
        //     {
        //   "eventType": "STREAM_STOPPED",
        //   "deviceId": "628072951915",
        //   "sessionId": "uuid",
        //   "channelId": 1,
        //   "streamType": "MAIN",
        //   "dataType": "AUDIO_VIDEO",
        //   "startedAt": "2026-02-21T10:28:00",
        //   "durationSeconds": 142,
        //   "bytesReceived": 2097152,
        //   "framesReceived": 3540,
        //   "timestamp": "2026-02-21T10:30:22"
        //     }
        //reply the gateway
        res.status(200).json({ success: true });
        //check if the device is online
        let deviceData = await helpers_1.default.getConnectedDeviceData(deviceID);
        //if device data is not found, return
        if (!deviceData || !deviceData.device_id) {
            // console.log("Connected device data not found for device ID ", deviceID)
            return;
        }
        //log the stream event in the database for analytics and monitoring
        helpers_1.default.logDashcamActivity({
            device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
            activity_type: body.eventType, activity_detail: body, vehicle_id: deviceData.vehicle_id,
            message: `Stream event ${body.eventType} received for device ${deviceID}.`
        });
    }
    static async HandleDeviceLocationUpdate({ res, body }) {
        // {
        //   "deviceId": "628072951915",
        //   "latitude": 6.5244,
        //   "longitude": 3.3792,
        //   "altitude": 15,
        //   "speed": 45.0,
        //   "direction": 180,
        //   "gpsTime": "2026-02-21T10:30:00",
        //   "accOn": true,
        //   "positioned": true,
        //   "alarmFlag": 0,
        //   "statusFlag": 3,
        //   "satelliteCount": 8,
        //   "signalStrength": 24,
        //   "mileage": 12500,
        //   "timestamp": "2026-02-21T10:30:01"
        // }
        let deviceID = body.deviceId;
        let latitude = body.latitude;
        let longitude = body.longitude;
        let altitude = body.altitude;
        let speed = body.speed;
        let heading = body.direction;
        let gpsTime = body.gpsTime;
        let accOn = body.accOn;
        //validate the inputs
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        if (!latitude)
            return helpers_1.default.outputError(res, null, "Latitude is required");
        if (!longitude)
            return helpers_1.default.outputError(res, null, "Longitude is required");
        //validate the device ID
        if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
            return helpers_1.default.outputError(res, null, "Device ID must be a number between 10 and 20 digits");
        }
        //validate latitude and longitude
        if (latitude < -90 || latitude > 90) {
            return helpers_1.default.outputError(res, null, "Latitude must be between -90 and 90");
        }
        if (longitude < -180 || longitude > 180) {
            return helpers_1.default.outputError(res, null, "Longitude must be between -180 and 180");
        }
        //reply the gateway
        res.status(200).json({ success: true });
        let deviceData = await helpers_1.default.getConnectedDeviceData(deviceID);
        //if device data is not found, return
        if (!deviceData || !deviceData.device_id) {
            // console.log("Connected device data not found for device ID ", deviceID)
            return;
        }
        let logData = await device_data_1.DashcamLocationModel.create({
            device_id: deviceData.device_id, operator_id: deviceData.operator_id,
            latitude, longitude, speed, heading, gps_timestamp: gpsTime,
            acc_status: accOn ? 1 : 0,
        }).catch((e) => ({ error: e }));
        //if there's an error, return it
        if (logData && logData.error) {
            console.log("Error logging location update ", logData.error);
            return;
        }
        // log the location update event in the database for analytics and monitoring
        helpers_1.default.logDashcamActivity({
            device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
            activity_type: "LOCATION_UPDATE", activity_detail: body,
            message: `Location update received for device ${deviceID}.`,
            vehicle_id: deviceData.vehicle_id
        });
    }
}
exports.GatewayHookService = GatewayHookService;
