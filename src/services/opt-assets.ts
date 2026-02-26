import helpers from "../assets/helpers";
import { ObjectPayload, PipelineQuery, PrivateMethodProps, SendDBQuery } from "../typings/general";
import { mongoose } from "../models/dbConnector";
import { CollectionListModel, DashcamDeviceModel, DashcamDeviceTypes } from "../models/device-lists";
import { OptVehicleListModel, OptVehicleListTypes } from "../models/opt-vehlists";
import { DatabaseTableList } from "../assets/var-config";
import { DashcamAlarmModel, DashcamAlarmTypes, DashcamLocationModel, LocationSummaryModel } from "../models/device-data";
import { UserOperatorModel } from "../models/user-operators";
import { GlobalTimeZones } from "../assets/var-param";

export class OperatorAssetService {


  //========**************DEVICE  SECTION***********=========================/
  static async GetDevices({ query, body, id, res, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let page = helpers.getInputValueString(query, "page")
    let activeStatus = helpers.getInputValueString(query, "active_status")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = { operator_id: new mongoose.Types.ObjectId(optID), } as DashcamDeviceTypes

    if (id) {
      qBuilder._id = new mongoose.Types.ObjectId(id)
    }

    if (activeStatus) {
      if (!["0", "1", "2", "3"].includes(activeStatus)) {
        return helpers.outputError(res, null, "Invalid active status")
      }
      qBuilder.active_status = parseInt(activeStatus)
    } else {
      //@ts-ignore
      qBuilder.active_status = { $ne: 3 }
    }

    if (q) {
      if (!helpers.isNumber({ input: q, type: "int", minLength: 10, maxLength: 20 })) {
        return helpers.outputError(res, null, "Search must be a number between 10 and 20 digits")
      }
      qBuilder.device_number = q
    }

    let getPage = helpers.getPageItemPerPage(itemPerPage, page)

    if (getPage.status !== true) return helpers.outputError(res, null, getPage.msg)

    let pipLine: PipelineQuery = [
      { $match: qBuilder },
      { $project: { created_by: 0, gateway_status: 0, operator_id: 0, } },
      { $sort: { _id: -1 } },
      { $skip: getPage.data.page },
      { $limit: getPage.data.item_per_page },
      {
        $lookup: {
          from: DatabaseTableList.vehicle_lists,
          let: { deviceID: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$device_id", "$$deviceID"] } } },
            { $project: { plate_number: 1, online_status: 1, } }
          ],
          as: "vehicle_data"
        }
      },
      { $unwind: { path: "$vehicle_data", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          online_status: { $ifNull: ["$vehicle_data.online_status", 0] },
          device_id: "$_id"
        }
      },
      { $unset: ["vehicle_data", "_id", "__v", "operator_id"] }
    ]

    if (component) {
      switch (component) {
        case "count":
          pipLine = [
            { $match: qBuilder },
            { $count: "total" },
            { $unset: ["__v", "_id"] }
          ]
          break;
        case "count-status":
          pipLine = [
            { $match: qBuilder },
            {
              $group: {
                _id: null,
                total_count: { $sum: 1 },
                total_inactive: { $sum: { $cond: [{ $eq: ["$status", 0] }, 1, 0] } },
                total_active: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                total_suspended: { $sum: { $cond: [{ $eq: ["$status", 2] }, 1, 0] } },
              }
            },
          ]
          break;

        default:
          return helpers.outputError(res, null, "Component is invalid")
      }
    }

    let getData: SendDBQuery = await DashcamDeviceModel.aggregate(pipLine).catch(e => ({ error: e }))

    if (getData && getData.error) {
      console.log("Error getting device count by status", getData.error)
      return helpers.outputError(res, 500)
    }

    if (component) {
      getData = getData.length ? getData[0] : {}
    }

    return helpers.outputSuccess(res, getData)
  }

  static async AssignDeviceToVehicle({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let vehicleID = helpers.getInputValueString(body, "vehicle_id")
    let optID = helpers.getOperatorAuthID(userData)

    if (!vehicleID) return helpers.outputError(res, null, "Vehicle id is required")

    //validating the ID
    if (helpers.isInvalidID(vehicleID)) return helpers.outputError(res, null, "Invalid vehicle id")

    //get the vehicle
    let getOpt: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      _id: vehicleID, operator_id: optID
    }).lean().catch(e => ({ error: e }))

    //check for error
    if (getOpt && getOpt.error) {
      console.log("Error checking vehicle for assign device by operator", getOpt.error)
      return helpers.outputError(res, 500)
    }

    if (!getOpt) return helpers.outputError(res, null, "Vehicle not found")

    //if the vehicle is not active, cannot assign device
    if (getOpt && getOpt.vehicle_status !== 1) return helpers.outputError(res, null, "Vehicle is not active")

    //if the vehicle is already assigned with a device, return error
    if (getOpt.device_assigned || getOpt.device_id) {
      return helpers.outputError(res, null, "Vehicle is already assigned with a device")
    }

    //get the device data
    let getDevice: SendDBQuery<DashcamDeviceTypes> = await DashcamDeviceModel.findOne({
      _id: id, operator_id: optID
    }).lean().catch(e => ({ error: e }))

    //check for error
    if (getDevice && getDevice.error) {
      console.log("Error checking device for operator assign vehicle", getDevice.error)
      return helpers.outputError(res, 500)
    }

    if (!getDevice) return helpers.outputError(res, null, "Device not found")

    //if the device is not active
    if (getDevice.active_status !== 1) return helpers.outputError(res, null, "Device is not active for assignment")

    //update the device with the vehicle id and assign status
    let Assignveh: SendDBQuery = await OptVehicleListModel.findByIdAndUpdate(vehicleID, {
      $set: { device_id: id, device_assigned: 1 }
    }, { lean: true, returnDocument: "after" }).catch((e: object) => ({ error: e }));

    if (Assignveh && Assignveh.error) {
      console.log("Error assigning vehicle to device operator", Assignveh.error)
      return helpers.outputError(res, 500)
    }

    //if the query does not execute
    if (!Assignveh) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    //log activity
    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string, operation: "assign-device",
      data: { id: vehicleID, plate_number: getOpt.plate_number },
      body: `Assigned device with number ${getDevice.device_number} to vehicle ${getOpt.plate_number}`
    }).catch(e => { })

    return helpers.outputSuccess(res)
  }

  static async UnassignDeviceFromVehicle({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    //get the device data
    let getDevice: SendDBQuery<DashcamDeviceTypes> = await OptVehicleListModel.findOne({
      device_id: id, operator_id: optID
    }).lean().catch(e => ({ error: e }))

    //check for error
    if (getDevice && getDevice.error) {
      console.log("Error checking device for operator unassign device", getDevice.error)
      return helpers.outputError(res, 500)
    }

    if (!getDevice) return helpers.outputError(res, null, "Device not found or not assigned to any vehicle")

    //remove the device id from the vehicle and change assign status
    let unAssign: SendDBQuery = await OptVehicleListModel.findByIdAndUpdate(getDevice._id, {
      $unset: { device_id: 1 }, $set: { device_assigned: 0 }
    }, { lean: true, returnDocument: "after" }).catch((e: object) => ({ error: e }));

    if (unAssign && unAssign.error) {
      console.log("Error unassigning device from vehicle", unAssign.error)
      return helpers.outputError(res, 500)
    }

    //if the query does not execute
    if (!unAssign) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    //log activity
    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string, operation: "unassign-device",
      data: { id: getDevice._id, plate_number: getDevice.plate_number },
      body: `Unassigned device with number ${getDevice.device_number} from vehicle ${getDevice.plate_number}`
    }).catch(e => { })

    return helpers.outputSuccess(res)
  }

  static async DeleteDevice({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    //if method is not delete
    let getData: SendDBQuery<DashcamDeviceTypes> = await DashcamDeviceModel.findOne({
      _id: new mongoose.Types.ObjectId(id), operator_id: optID
    }).lean().catch((e) => ({ error: e }));

    //check for error
    if (getData && getData.error) {
      console.log("Error finding device by admin to delete", getData.error)
      return helpers.outputError(res, 500)
    }

    if (!getData) return helpers.outputError(res, null, "Device not found")

    //if the device is link, request for unlinking
    if (getData.vehicle_id) return helpers.outputError(res, null, "Device is currently assigned to a vehicle.")

    let deleteResult: SendDBQuery = await DashcamDeviceModel.findByIdAndDelete(id).lean().catch((e) => ({ error: e }));

    if (deleteResult && deleteResult.error) {
      console.log("Error deleting device by operator", deleteResult.error)
      return helpers.outputError(res, 500)
    }

    if (!deleteResult) return helpers.outputError(res, null, helpers.errorText.failedToProcess);

    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: "device-delete", body: `Deleted a device - ${getData.device_model}`,
      data: {},
    }).catch(e => { })

    return helpers.outputSuccess(res, {})
  }

  static async RegisterDevice({ body, id, res, req, customData: userData }: PrivateMethodProps) {
    let deviceID = helpers.getInputValueString(body, "device_number")
    let deviceModel = helpers.getInputValueString(body, "device_model")
    let deviceOEM = helpers.getInputValueString(body, "device_oem")
    let optID = helpers.getOperatorAuthID(userData)
    let qBuilder = {} as DashcamDeviceTypes

    if (!id) {
      if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
      // if (!deviceModel) return helpers.outputError(res, null, "Device model is required")
      // if (!deviceOEM) return helpers.outputError(res, null, "Device OEM is required")
      qBuilder.created_by = "operator"
      qBuilder.operator_id = new mongoose.Types.ObjectId(optID)
      qBuilder.assign_status = 1
    }

    if (deviceModel) {
      if (!helpers.isAllowedCharacters(deviceModel)) {
        return helpers.outputError(res, null, "Device model has invalid characters")
      }
      //if the length is too long or short
      if (deviceModel.length < 2 || deviceModel.length > 120) {
        return helpers.outputError(res, null, deviceModel.length < 2 ? "Device model is too short" : "Device model is too long")
      }
      qBuilder.device_model = deviceModel
    }

    if (deviceOEM) {
      if (!helpers.isAllowedCharacters(deviceOEM)) {
        return helpers.outputError(res, null, "Device OEM has invalid characters")
      }
      //if the length is too long or short
      if (deviceOEM.length < 2 || deviceOEM.length > 120) {
        return helpers.outputError(res, null, deviceOEM.length < 2 ? "Device OEM is too short" : "Device OEM is too long")
      }
      qBuilder.device_oem = deviceOEM
    }

    if (deviceID) {
      if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
        return helpers.outputError(res, null, "Device ID must be a number with length between 10 and 20")
      }
      //check if the device ID already exist
      let checkDevice: SendDBQuery = await DashcamDeviceModel.findOne({ device_number: deviceID }).catch(e => ({ error: e }))
      //check for error
      if (checkDevice && checkDevice.error) {
        console.log("Error checking existing device for registration", checkDevice.error)
        return helpers.outputError(res, 500)
      }
      //if a record is found
      if (checkDevice) return helpers.outputError(res, null, "Device ID already registered")

      qBuilder.device_number = deviceID
    }

    if (Object.keys(qBuilder).length === 0) return helpers.outputError(res, null, "Nothing to update")

    let saveDevice: SendDBQuery<DashcamDeviceTypes> = id ? await DashcamDeviceModel.findOneAndUpdate({ _id: id, operator_id: optID }, { $set: qBuilder },
      { lean: true, returnDocument: "after" }).catch(e => ({ error: e })) : await DashcamDeviceModel.create(qBuilder).catch(e => ({ error: e }))

    //check for error
    if (saveDevice && saveDevice.error) {
      console.log("Error registering device by admin", saveDevice.error)
      return helpers.outputError(res, 500)
    }

    if (!saveDevice) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: "device-register", body: id ? `Updated device - ${saveDevice.device_number} information` : `Registered a new device - ${deviceID}`,
      data: { id: String(saveDevice._id), device_number: saveDevice.device_number },
    }).catch(e => { })

    return helpers.outputSuccess(res, {})
  }

  //========**************VEHICLE SECTION***********=========================/

  static async AddVehicles({ body, id, res, customData: userData }: PrivateMethodProps) {
    let plateNo = helpers.getInputValueString(body, "plate_number");
    let vehOEM = helpers.getInputValueString(body, "vehicle_oem");
    let vehModel = helpers.getInputValueString(body, "vehicle_model");
    let vehVin = helpers.getInputValueString(body, "vehicle_vin");
    let yearPurchase = helpers.getInputValueString(body, "year_purchase");
    let speedLimit = helpers.getInputValueString(body, "vehspeed_limit");
    let collectionID = helpers.getInputValueString(body, "collection_id")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = {} as OptVehicleListTypes
    let logMsg = "Updated"

    //if there's no ID for update
    if (!id) {
      if (!plateNo) return helpers.outputError(res, null, "Plate number is required")
      if (!vehOEM) return helpers.outputError(res, null, "Vehicle OEM is required")
      if (!vehModel) return helpers.outputError(res, null, "Vehicle model is required")
      //check if the account is not approved yet
      let getData: SendDBQuery = await UserOperatorModel.findById(optID).catch(e => ({ error: e }))
      //check for error
      if (getData && getData.error) {
        console.log("Error getting operator account to add vehicle", getData.error);
        return helpers.outputError(res, 500);
      }
      //if no data found or the account is not active
      if (!getData || getData.account_status !== 1) return helpers.outputError(res, null, "Only approved account can add vehicles");
      qBuilder.operator_id = new mongoose.Types.ObjectId(optID)
    }

    if (speedLimit) {
      //check if it's number
      if (!helpers.isNumber({ input: speedLimit, type: "int", length: 3, min: 10, max: 250 })) {
        return helpers.outputError(res, null, "Vehicle speed limit should be a number between 10 and 250")
      }
      qBuilder.vehspeed_limit = parseInt(speedLimit)
      logMsg += logMsg.length > 7 ? `, speed limit to ${speedLimit}` : ` speed limit to ${speedLimit}`
    }

    //year you bought the vehicle
    if (yearPurchase) {
      if (!helpers.isNumber({ input: yearPurchase, type: "int", unit: "positive", length: 4 })) {
        return helpers.outputError(res, null, "Invalid year of purchase");
      }
      qBuilder.year_purchase = yearPurchase
      logMsg += logMsg.length > 7 ? `, year of purchase to ${yearPurchase}` : ` year of purchase to ${yearPurchase}`
    }

    //VIN of the vehicle
    if (vehVin) {
      //if the value is invalid
      if (!helpers.isAllowedCharacters(vehVin)) {
        return helpers.outputError(res, null, "Vehicle vin contains invalid characters")
      }
      if (vehVin.length < 3 || vehVin.length > 45) {
        return helpers.outputError(res, null, vehVin.length < 3 ? "Vehicle vin is too short" : "Vehicle vin is too long")
      }
      qBuilder.vehicle_vin = vehVin
      logMsg += logMsg.length > 7 ? `, vin to ${vehVin}` : ` vin to ${vehVin}`
    }

    if (vehModel) {
      if (vehModel.length < 3 || vehModel.length > 45) {
        return helpers.outputError(res, null, vehModel.length < 3 ? "Vehicle model is too short" : "Vehicle model is too long")
      }

      qBuilder.vehicle_model = vehModel
      logMsg += logMsg.length > 7 ? `, model to ${vehModel}` : ` model to ${vehModel}`
    }

    if (vehOEM) {
      if (vehOEM.length < 3 || vehOEM.length > 45) {
        return helpers.outputError(res, null, vehOEM.length < 3 ? "Vehicle OEM is too short" : "Vehicle OEM is too long")
      }
      qBuilder.vehicle_oem = vehOEM
      logMsg += logMsg.length > 7 ? `, OEM to ${vehOEM}` : ` OEM to ${vehOEM}`
    }

    if (collectionID) {
      //if not valid
      let getCol: SendDBQuery = await CollectionListModel.findOne({ operator_id: optID, _id: collectionID }).catch(e => ({ error: e }))
      //check for error
      if (getCol && getCol.error) {
        console.log("Error checking collection for vehicle", getCol.error)
        return helpers.outputError(res, 500)
      }
      if (!getCol) return helpers.outputError(res, null, "Collection not found")

      qBuilder.collection_id = new mongoose.Types.ObjectId(collectionID)
      logMsg += logMsg.length > 7 ? `, collection to ${getCol.collection_name}` : ` collection to ${getCol.collection_name}`
    }

    //validate the data
    if (plateNo) {
      if (plateNo.length < 5 || plateNo.length > 15) {
        return helpers.outputError(res, null, "Plate number must be between 5 and 15 characters");
      }
      //check for invalid characters
      if (!helpers.isAllowedCharacters(plateNo)) {
        return helpers.outputError(res, null, "Plate number contains invalid characters")
      }
      qBuilder.plate_number = plateNo.toUpperCase();

      //check if user exist
      let checkvehicle: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
        plate_number: qBuilder.plate_number, operator_id: optID
      }, null, { lean: true }).catch((e) => ({ error: e }));

      //check for error
      if (checkvehicle && checkvehicle.error) {
        console.log("Error checking vehicle unique plate no", checkvehicle.error)
        return helpers.outputError(res, 500);
      }
      //if not exist
      if (checkvehicle && (!id || String(checkvehicle._id) !== id)) {
        return helpers.outputError(res, null, "Vehicle already exist with this plate number");
      }
      logMsg += logMsg.length > 7 ? `, plate number to ${qBuilder.plate_number}` : ` plate number to ${qBuilder.plate_number}`
    }

    if (Object.keys(qBuilder).length === 0) return helpers.outputError(res, null, "No data to process");

    let createVehicle: SendDBQuery = id ? await OptVehicleListModel.findOneAndUpdate({ _id: id, operator_id: optID },
      { $set: qBuilder }, { returnDocument: "after", lean: true }).catch(e => ({ error: e })) :
      await OptVehicleListModel.create(qBuilder).catch(e => ({ error: e }));

    //if there's error in creating the account
    if (createVehicle && createVehicle.error) {
      console.log("Error creating operator vehicle", createVehicle.error)
      return helpers.outputError(res, 500)
    }
    //if query failed
    if (!createVehicle) {
      return helpers.outputError(res, null, helpers.errorText.failedToProcess)
    }

    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: "create-vehicle", data: {
        id: String(createVehicle._id),
        plate_number: (qBuilder.plate_number || createVehicle.plate_number)
      },
      body: id ? logMsg : `Created a new vehicle with plate number ${qBuilder.plate_number}`
    }).catch(e => { })


    return helpers.outputSuccess(res);
  }

  static async BulkUploadVehicle({ body, res, customData: userData }: PrivateMethodProps) {

    const regex = /Content-Type: text\/csv\r?\n\r?\n([\s\S]*?)\r?\n--/i;

    const match = String(body).match(regex);

    //when the csv content is not found
    if (!match || !match[1]) {
      return helpers.outputError(res, null, 'The file is empty or invalid. It should be a .csv file.')
    }

    const csvContent = match[1];

    //when the csv content is empty
    if (!csvContent || !csvContent.length) {
      return helpers.outputError(res, null, 'The file is empty! It should contain at least one record.')
    }
    //convert to Object
    const data: any = helpers.csvToJsonArray(csvContent);
    let optID = helpers.getOperatorAuthID(userData)

    if (!data) {
      return helpers.outputError(res, null, 'Please upload your csv file again')
    }

    if (data.length === 0) {
      return helpers.outputError(res, null, 'Looks like your file is empty')
    }

    let errorItem: ObjectPayload[] = []
    let newVehicles: ObjectPayload[] = []
    //run validation
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      //if vehicle model is not provided
      if (!item.vehicle_model || item.vehicle_model.length < 2 || item.vehicle_model.length > 45) {
        item.message = item.message ? item.message + ", " : ""
        item.message += "A valid vehicle model is required"
      }

      if (!item.vehicle_oem || item.vehicle_oem.length < 3 || item.vehicle_oem.length > 45) {
        item.message = item.message ? item.message + ", " : ""
        item.message += "A valid vehicle OEM is required"
      }
      //if plate number is not provided

      if (!item.plate_number || !helpers.isAllowedCharacters(item.plate_number)) {
        item.message = item.message ? item.message + ", " : ""
        item.message += "A valid plate number is required"
      }

      if (item.vehicle_vin) {
        if (item.vehicle_vin.length < 3 || item.vehicle_vin.length > 45) {
          item.message = item.message ? item.message + ", " : ""
          item.message += "Vehicle vin is not valid"
        }
      }

      if (item.year_purchase) {
        if (!helpers.isNumber({ input: item.year_purchase, type: "int", unit: "positive", length: 4 })) {
          item.message = item.message ? item.message + ", " : ""
          item.message += "Purchase year is not valid"
        }
      }

      //if there's any error, add to error list
      if (item.message) {
        errorItem.push(item)
        continue;
      }

      let getData: SendDBQuery = await OptVehicleListModel.findOne({
        plate_number: item.plate_number.toUpperCase(), operator_id: optID
      }).lean().catch(e => ({ error: e }));

      //check for error
      if (getData && getData.error) {
        console.error('Error while checking if operator vehicle exist - bulkupload', getData.error)
        return helpers.outputError(res, 500);
      }

      //if vehicle exist
      if (getData) {
        if (getData.plate_number === item.plate_number.toUpperCase()) {
          item.message = item.message ? item.message + ", " : ""
          item.message += "vehicle plate number already registered"
        } else {
          item.message = item.message ? item.message + ", " : ""
          item.message += "vehicle already registered"
        }
        errorItem.push(item)
        continue;
      }
      //if valid, add to new vehicles
      newVehicles.push({
        operator_id: new mongoose.Types.ObjectId(optID),
        plate_number: item.plate_number.toUpperCase(),
        vehicle_model: item.vehicle_model || "",
        vehicle_oem: item.vehicle_oem || "",
        vehicle_vin: item.vehicle_vin || "",
        year_purchase: item.year_purchase ? parseInt(item.year_purchase) : null,
      })
    }

    //if there's nothing to process
    if (!newVehicles || newVehicles.length === 0) {
      return res.json({
        message: 'No valid data to process. Please check the errors and try again.',
        error: errorItem
      })
    }

    //save only the valid vehicle
    let saveVehs: SendDBQuery = await OptVehicleListModel.insertMany(newVehicles).catch(e => ({ error: e }))

    //if there's an error
    if (saveVehs && saveVehs.error) {
      //if the account already exist
      if (saveVehs.error.code === 11000) {
        return helpers.outputError(res, null, "Plate number already exist")
      }
      console.error('Error while saving the operator veh - bulkupload', saveVehs.error)
      return helpers.outputError(res, 500)
    }

    //if failed
    if (!saveVehs) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    return res.json({
      message: errorItem.length ? 'Some vehicles were added, some were not. See below errors.' :
        'All vehicles were added successfully.', error: errorItem,
    })
  }

  static async GetVehicles({ query, id, res, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let deviceAssigned = helpers.getInputValueString(query, "device_assigned")
    let startDate = helpers.getInputValueString(query, "start_date")
    let endDate = helpers.getInputValueString(query, "end_date")
    let onlineStatus = helpers.getInputValueString(query, "online_status")
    let accStatus = helpers.getInputValueString(query, "acc_status")
    let vehicleStatus = helpers.getInputValueString(query, "vehicle_status")
    let timezone = helpers.getInputValueString(query, "timezone")
    let collectionID = helpers.getInputValueString(query, "collection_id")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = { operator_id: new mongoose.Types.ObjectId(optID) } as OptVehicleListTypes

    if (id) {
      qBuilder._id = new mongoose.Types.ObjectId(id)
    }

    if (collectionID) {
      //if not valid
      if (helpers.isInvalidID(collectionID)) return helpers.outputError(res, null, "Invalid collection ID")
      qBuilder.collection_id = new mongoose.Types.ObjectId(collectionID)
    }

    //chek start date if submitted
    if (startDate) {
      if (helpers.isDateFormat(startDate)) {
        return helpers.outputError(res, null, 'Invalid start date. must be in the formate YYYY-MM-DD');
      }
      //if there's no end time
      if (!endDate) return helpers.outputError(res, null, 'end_date is required when using start_date');
    }

    //chek end date if submitted
    if (endDate) {
      //if start date is not submitted
      if (helpers.isDateFormat(endDate)) {
        return helpers.outputError(res, null, 'Invalid end date. must be in the formate YYYY-MM-DD');
      }
      if (!startDate) return helpers.outputError(res, null, 'end_date can only be used with start_date');

      //if there's no timezone, return
      if (!timezone) return helpers.outputError(res, null, "Timezone is required when using start_date or end_date")

      //check if the date are wrong
      if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
        return helpers.outputError(res, null, 'start date can not be greater than end date');
      }

      //valida the timezone
      if (!GlobalTimeZones.includes(timezone)) return helpers.outputError(res, null, "Submitted timezone is invalid")

      let getUTCStart = helpers.convertDateTimeZone({
        dateString: `${startDate}T00:00:00`,
        fromTimeZone: timezone, toTimeZone: "utc"
      })
      let getUTCEnd = helpers.convertDateTimeZone({
        dateString: `${endDate}T23:59:59`,
        fromTimeZone: timezone, toTimeZone: "utc"
      })
      // @ts-expect-error
      qBuilder.createdAt = { $gte: getUTCStart.dateObj, $lt: getUTCEnd.dateObj }
    }

    if (vehicleStatus) {
      if (!["0", "1", "2"].includes(vehicleStatus)) {
        return helpers.outputError(res, null, "Invalid vehicle status.")
      }
      qBuilder.vehicle_status = parseInt(vehicleStatus)
    }

    //when online status is provided
    if (onlineStatus) {
      if (!["0", "1"].includes(onlineStatus)) {
        return helpers.outputError(res, null, "Invalid online status.")
      }
      qBuilder.online_status = parseInt(onlineStatus)
    }

    //when ACC status is provided
    if (accStatus) {
      if (!["0", "1"].includes(accStatus)) {
        return helpers.outputError(res, null, "Invalid ACC status.")
      }
      qBuilder.acc_status = parseInt(accStatus)
    }

    //when device assigned status is provided
    if (deviceAssigned) {
      if (!["0", "1"].includes(deviceAssigned)) {
        return helpers.outputError(res, null, "Invalid device assigned status.")
      }
      qBuilder.device_assigned = parseInt(deviceAssigned)
    }

    //validate the data one after the other
    if (q) {
      if (helpers.hasInvalidSearchChar(q)) {
        return helpers.outputError(res, null, "Special characters not allowed on search.")
      }
      qBuilder.plate_number = { $regex: q, $options: 'i' } as any
    }

    let pageItem = helpers.getPageItemPerPage(itemPerPage, page)
    if (!pageItem.status) return helpers.outputError(res, null, pageItem.msg)

    let pipLine: PipelineQuery = [
      { $match: qBuilder },
      { $addFields: { vehicle_id: "$_id" } },
      { $sort: { _id: -1 as -1 } },
      { $skip: pageItem.data.page },
      { $limit: pageItem.data.item_per_page },
      {
        $lookup: {
          from: DatabaseTableList.collection_lists,
          let: { collID: "$collection_id" },
          pipeline: [{
            $match: { $expr: { $eq: ["$_id", "$$collID"] } },
          }],
          as: "collection_data"
        }
      },
      { $unwind: { path: "$collection_data", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: DatabaseTableList.dashcam_devices,
          let: { deviceID: "$device_id" },
          pipeline: [{
            $match: { $expr: { $eq: ["$_id", "$$deviceID"] } },
          }],
          as: "device_data"
        }
      },
      { $unwind: { path: "$device_data", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          collection_name: "$collection_data.name",
          device_number: "$device_data.device_number",
        }
      },
      { $unset: ["__v", "_id", "collection_data", "device_data"] },
    ]

    //if there's ID
    if (id) {
      //handle ID fetch later for other component if needed
    }

    if (component) {
      switch (component) {
        case "count":
          pipLine = [
            { $match: qBuilder },
            { $count: "total" },
            { $unset: "_id" }
          ]
          break;
        case "count-status":
          pipLine = [
            { $match: qBuilder },
            {
              $group: {
                _id: null,
                total_count: { $sum: 1 },
                total_active: { $sum: { $cond: [{ $eq: ["$online_status", 1] }, 1, 0] } },
                total_suspended: { $sum: { $cond: [{ $eq: ["$status", 2] }, 1, 0] } },
                total_with_device: { $sum: { $cond: [{ $ifNull: ["$device_assigned", 1] }, 1, 0] } },
              }
            },
            {
              $lookup: {
                from: DatabaseTableList.dashcam_devices,
                let: { optID: new mongoose.Types.ObjectId(optID) },
                pipeline: [
                  { $match: { $expr: { $eq: ["$operator_id", "$$optID"] }, online: true } },
                  { $count: "total" }
                ],
                as: "device_data"
              }
            },
            { $unwind: { path: "$device_data", preserveNullAndEmptyArrays: true } },
            { $addFields: { total_online: "$device_data.total" } },
            { $unset: ["_id", "device_data"] }
          ]
          break;
        case "count-profilestat":
          pipLine = [
            { $match: qBuilder },
            { $project: { _id: 1 } },
            {
              $lookup: {
                from: DatabaseTableList.dashcam_locations,
                let: { vehID: "$_id", optID: new mongoose.Types.ObjectId(optID) },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$vehicle_id", "$$vehID"] },
                          { $eq: ["$operator_id", "$$optID"] }
                        ]
                      }
                    }
                  },
                  { $count: "total" }
                ],
                as: "total_location"
              }
            },
            {
              $lookup: {
                from: DatabaseTableList.dashcam_alarms,
                let: { vehID: "$_id", optID: new mongoose.Types.ObjectId(optID) },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$vehicle_id", "$$vehID"] },
                          { $eq: ["$operator_id", "$$optID"] }
                        ]
                      }
                    }
                  },
                  { $count: "total" }
                ],
                as: "total_alarms"
              }
            },
            { $unwind: { path: "$total_location", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$total_alarms", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                total_alarm: { $ifNull: ["$total_alarms.total", 0] },
                total_location: { $ifNull: ["$total_location.total", 0] },
                total_media: { $ifNull: ["$total_media.total", 0] },
              }
            },
            { $unset: ["_id"] }
          ]
          break;
        case "export":
          return helpers.outputError(res, null, "Not Ready Yet!")
        default:
          return helpers.outputError(res, null, "invalid component")
      }

    }

    let getData: SendDBQuery = await OptVehicleListModel.aggregate(pipLine).catch(e => ({ error: e }))

    //check error
    if (getData && getData.error) {
      console.log("Error getting operator vehicle list", getData.error)
      return helpers.outputError(res, 500)
    }

    if (component || id) {
      getData = getData.length ? getData[0] : {}
    }

    return helpers.outputSuccess(res, getData)
  }

  static async DeleteVehicle({ res, body, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    let vehicleIDs = helpers.getInputValueArray(body, "vehicle_ids")
    let isSyncReq = vehicleIDs.length <= 10

    //if there's no ID or array of IDs
    if (!vehicleIDs || vehicleIDs.length === 0) {
      return helpers.outputError(res, null, "Vehicle ID is required")
    }
    //if the ID greater than 100
    if (vehicleIDs.length > 100) {
      return helpers.outputError(res, null, "You can only delete up to 100 vehicles at once")
    }

    //if length request is less than 10, delete as sync, otherwise return and delete in background
    if (!isSyncReq) helpers.outputSuccess(res, { msg: "Vehicle deletion is in progress. Refresh the page to see the updates." })
    //remove duplicates
    vehicleIDs = [...new Set(vehicleIDs)]

    for (let vehID of vehicleIDs) {
      //if the ID is not valid
      if (helpers.isInvalidID(vehID)) {
        if (isSyncReq) {
          return helpers.outputError(res, null, `Invalid vehicle ID ${vehID}`)
        } else {
          continue;
        }
      }
      //if there's no schedule data
      let getData: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
        _id: vehID, operator_id: optID
      }, null, { lean: true }).catch(e => ({ error: e }))

      //if there's error
      if (getData && getData.error) {
        if (isSyncReq) {
          return helpers.outputError(res, 500)
        } else { continue; }
      }

      if (!getData) {
        if (isSyncReq) {
          return helpers.outputError(res, null, "Vehicle not found")
        } else {
          continue;
        }
      }

      let deleteData: SendDBQuery = await OptVehicleListModel.findByIdAndDelete(vehID).catch((e) => ({ error: e }));

      //check for error
      if (!deleteData || deleteData.error) {
        if (isSyncReq) {
          return helpers.outputError(res, 500)
        } else {
          continue;
        }
      }
      //log activity
      helpers.logOperatorActivity({
        auth_id: userData.auth_id, operator_id: optID as string,
        operation: "delete-vehicle", data: { id: String(getData._id), plate_number: getData.plate_number },
        body: `Deleted ${getData.plate_number} vehicle from the system`
      }).catch(e => { })
    }

    if (!res.headersSent) return helpers.outputSuccess(res, { msg: "Vehicle(s) deleted successfully" });
  }

  static async SuspendedVehicles({ body, res, customData: userData }: PrivateMethodProps) {
    let status = helpers.getInputValueString(body, "status")
    let reason = helpers.getInputValueString(body, "reason")
    let vehicleIDs = helpers.getInputValueArray(body, "vehicle_ids")
    let optID = helpers.getOperatorAuthID(userData)
    let qBuilder = {} as OptVehicleListTypes
    let isSyncReq = vehicleIDs.length <= 10

    //if there's no ID or array of IDs
    if (!vehicleIDs || vehicleIDs.length === 0) {
      return helpers.outputError(res, null, "Vehicle ID is required")
    }
    //if the ID greater than 100
    if (vehicleIDs.length > 100) {
      return helpers.outputError(res, null, "You can only perform this action on up to 100 vehicles at once")
    }
    //if the status is not provided
    if (!status) return helpers.outputError(res, null, "Status is required")
    if (!['1', '2'].includes(status)) return helpers.outputError(res, null, "Invalid vehicle status")

    if (status === '2') {
      //if there's no suspend reason
      if (!reason) return helpers.outputError(res, null, "Suspend reason is required when suspending a vehicle")
      qBuilder.vehicle_status = parseInt(status)
      qBuilder.suspend_date = new Date().toISOString()
    } else {
      qBuilder.vehicle_status = parseInt(status)
    }

    if (reason) {
      if (reason.length < 10 || reason.length > 500) {
        return helpers.outputError(res, null, reason.length < 10 ? "suspend reason is too short" : "suspend reason is too long")
      }
      qBuilder.suspend_reason = reason
    }

    //if length request is less than 10, delete as sync, otherwise return and delete in background
    if (!isSyncReq) helpers.outputSuccess(res, { msg: "Action is in progress. Refresh the page to see the updates." })

    //remove duplicates
    vehicleIDs = [...new Set(vehicleIDs)]

    for (let vehID of vehicleIDs) {
      //if the ID is not valid
      if (helpers.isInvalidID(vehID)) {
        if (isSyncReq) {
          return helpers.outputError(res, null, `Invalid vehicle ID ${vehID}`)
        } else {
          continue;
        }
      }

      let updateStatus: SendDBQuery = await OptVehicleListModel.findOneAndUpdate({ _id: vehID, operator_id: optID },
        { $set: qBuilder }, { returnDocument: "after" }).catch(e => ({ error: e }))

      //check for error
      if (updateStatus && updateStatus.error) {
        if (isSyncReq) {
          return helpers.outputError(res, 500)
        } else {
          continue;
        }
      }
      //if the query does not execute
      if (!updateStatus) {
        if (isSyncReq) {
          return helpers.outputError(res, null, helpers.errorText.failedToProcess)
        } else {
          continue;
        }
      }
      // //log activity
      helpers.logOperatorActivity({
        auth_id: userData.auth_id, operator_id: optID as string,
        operation: "update-vehicle", data: { id: String(updateStatus._id), plate_number: updateStatus.plate_number },
        body: `${status === "1" ? "Activated" : "Suspended"} ${updateStatus.plate_number} vehicle`
      }).catch(e => { })
    }

    if (!res.headersSent) return helpers.outputSuccess(res, { msg: "Action completed successfully" });
  }

  static async ShutDownOrActivateEngine({ body, res, customData: userData }: PrivateMethodProps) {
    let status = helpers.getInputValueString(body, "status")
    let id = helpers.getInputValueString(body, "vehicle_id")

    if (!id) return helpers.outputError(res, null, "Vehicle ID is required")
    if (helpers.isInvalidID(id)) return helpers.outputError(res, null, "Invalid vehicle ID")

    //if there's no status
    if (!status) return helpers.outputError(res, null, "Status is required")
    if (!["1", "2"].includes(status)) return helpers.outputError(res, null, "Invalid status value")

    //update the database
    await OptVehicleListModel.findByIdAndUpdate(id, {
      $set: { engine_shutdown: parseInt(status) }
    }).catch(e => ({ error: e }))

    return helpers.outputSuccess(res)
  }

  //========**************ALARM SECTION***********=========================/
  static async GetAlarmData({ query, id: vehicleID, res, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let status = helpers.getInputValueString(query, "status")
    let startDate = helpers.getInputValueString(query, "start_date")
    let endDate = helpers.getInputValueString(query, "end_date")
    let timezone = helpers.getInputValueString(query, "timezone")
    let alarmType = helpers.getInputValueString(query, "alarm_type")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = { operator_id: new mongoose.Types.ObjectId(optID) } as DashcamAlarmTypes

    // if (id) {
    //   qBuilder._id = new mongoose.Types.ObjectId(id)
    // }

    if (vehicleID) {
      if (helpers.isInvalidID(vehicleID)) {
        return helpers.outputError(res, null, "Invalid vehicle ID")
      }
      qBuilder.vehicle_id = new mongoose.Types.ObjectId(vehicleID)
    }

    if (alarmType) {
      //check if the value is valid
      qBuilder.alarm_type = alarmType
    }

    //chek start date if submitted
    if (startDate) {
      if (helpers.isDateFormat(startDate)) {
        return helpers.outputError(res, null, 'Invalid start date. must be in the formate YYYY-MM-DD');
      }
      //if there's no end time
      if (!endDate) return helpers.outputError(res, null, 'end_date is required when using start_date');
    }

    //chek end date if submitted
    if (endDate) {
      //if start date is not submitted
      if (helpers.isDateFormat(endDate)) {
        return helpers.outputError(res, null, 'Invalid end date. must be in the formate YYYY-MM-DD');
      }
      if (!startDate) return helpers.outputError(res, null, 'end_date can only be used with start_date');

      //if there's no timezone, return
      if (!timezone) return helpers.outputError(res, null, "Timezone is required when using start_date or end_date")

      //check if the date are wrong
      if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
        return helpers.outputError(res, null, 'start date can not be greater than end date');
      }

      //valida the timezone
      if (!GlobalTimeZones.includes(timezone)) return helpers.outputError(res, null, "Submitted timezone is invalid")

      let getUTCStart = helpers.convertDateTimeZone({
        dateString: `${startDate}T00:00:00`,
        fromTimeZone: timezone, toTimeZone: "utc"
      })
      let getUTCEnd = helpers.convertDateTimeZone({
        dateString: `${endDate}T23:59:59`,
        fromTimeZone: timezone, toTimeZone: "utc"
      })
      // @ts-expect-error
      qBuilder.createdAt = { $gte: getUTCStart.dateObj, $lt: getUTCEnd.dateObj }
    }

    //when online status is provided
    if (status || status === "0") {
      if (isNaN(parseFloat(status))) {
        return helpers.outputError(res, null, "Invalid vehicle status.")
      }
      qBuilder.status = parseInt(status)
    }

    //validate the data one after the other
    if (q) {
      if (helpers.hasInvalidSearchChar(q)) {
        return helpers.outputError(res, null, "Special characters not allowed on search.")
      }
      //get the vehicle with the plate number
      let getVeh: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
        plate_number: q, operator_id: optID
      }, null, { lean: true }).catch(e => ({ error: e }))

      //check for error
      if (getVeh && getVeh.error) {
        console.log("Error getting vehicle for alarm search", getVeh.error)
        return helpers.outputError(res, 500)
      }

      if (getVeh) {
        qBuilder.vehicle_id = getVeh._id
      } else {
        qBuilder.alarm_ref = q
      }
    }

    let pageItem = helpers.getPageItemPerPage(itemPerPage, page)
    if (!pageItem.status) return helpers.outputError(res, null, pageItem.msg)

    let pipLine: PipelineQuery = [
      { $match: qBuilder },
      { $addFields: { alarm_id: "$_id" } },
      { $sort: { _id: -1 as -1 } },
      { $skip: pageItem.data.page },
      { $limit: pageItem.data.item_per_page },
      {
        $lookup: {
          from: DatabaseTableList.vehicle_lists,
          let: { vehID: "$vehicle_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$vehID"] } }, },
            { $project: { plate_number: 1 } }
          ],
          as: "vehicle_data"
        }
      },
      { $unwind: { path: "$vehicle_data", preserveNullAndEmptyArrays: true } },
      { $addFields: { plate_number: "$vehicle_data.plate_number" } },
      { $unset: ["__v", "_id", "vehicle_data"] },
    ]

    if (component) {
      switch (component) {
        case "count":
          pipLine = [
            { $match: qBuilder },
            { $count: "total" },
            { $unset: "_id" }
          ]
          break;
        case "count-status":
          pipLine = [
            { $match: qBuilder },
            {
              $group: {
                _id: null,
                total_count: { $sum: 1 },
                total_critical: { $sum: { $cond: [{ $eq: ["$severity", "CRITICAL"] }, 1, 0] } },
                total_resolved: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                total_unresolved: { $sum: { $cond: [{ $ne: ["$status", 1] }, 1, 0] } },
              }
            },
            { $unset: ["_id"] }
          ]
          break;
        case "export":
          return helpers.outputError(res, null, "Not Ready Yet!")
        default:
          return helpers.outputError(res, null, "invalid component")
      }

    }

    let getData: SendDBQuery = await DashcamAlarmModel.aggregate(pipLine).catch(e => ({ error: e }))

    //check error
    if (getData && getData.error) {
      console.log("Error getting operator alarm list", getData.error)
      return helpers.outputError(res, 500)
    }

    if (component) {
      getData = getData.length ? getData[0] : {}
    }
    return helpers.outputSuccess(res, getData);
  }

  static async UpdateAlarmStatus({ body, res, id, customData: userData }: PrivateMethodProps) {
    let status = helpers.getInputValueString(body, "status")
    let alarmIDs = helpers.getInputValueArray(body, "alarm_ids")
    let optID = helpers.getOperatorAuthID(userData)
    let isSyncReq = alarmIDs.length <= 10

    //if there's no ID or array of IDs
    if (!alarmIDs || alarmIDs.length === 0) {
      return helpers.outputError(res, null, "Alarm ID is required")
    }

    //if the ID greater than 100
    if (alarmIDs.length > 100) {
      return helpers.outputError(res, null, "You can only perform this action on up to 100 alarms at once")
    }

    if (!status) return helpers.outputError(res, null, "Status is required")
    if (!['0', '1'].includes(status)) return helpers.outputError(res, null, "Invalid alarm status")

    //if length request is less than 10, delete as sync, otherwise return and delete in background
    if (!isSyncReq) helpers.outputSuccess(res, { msg: "Action is in progress. Refresh the page to see the updates." })

    //remove duplicates
    alarmIDs = [...new Set(alarmIDs)]

    for (let alarmID of alarmIDs) {
      if (helpers.isInvalidID(alarmID)) {
        if (isSyncReq) {
          return helpers.outputError(res, null, `Invalid alarm ID ${alarmID}`)
        } else {
          continue;
        }
      }

      let updateStatus: SendDBQuery<DashcamAlarmTypes> = await DashcamAlarmModel.findOneAndUpdate({ _id: alarmID, operator_id: optID },
        { $set: { status: parseInt(status) } }, { returnDocument: "after" })
        .populate("vehicle_id", "plate_number", OptVehicleListModel).catch(e => ({ error: e }))

      //check for error
      if (updateStatus && updateStatus.error) {
        if (isSyncReq) {
          return helpers.outputError(res, 500)
        } else {
          continue;
        }
      }

      //if the query does not execute
      if (!updateStatus) {
        if (isSyncReq) {
          return helpers.outputError(res, null, helpers.errorText.failedToProcess)
        } else {
          continue;
        }
      }
      // //log activity
      helpers.logOperatorActivity({
        auth_id: userData.auth_id, operator_id: optID as string,
        operation: "update-alarmstatus", data: {
          id: String((updateStatus.vehicle_id || {})._id),
          plate_number: (updateStatus.vehicle_id || {}).plate_number
        },
        body: `${status === "1" ? "Resolved" : "Reopened"} alarm status for ${(updateStatus.vehicle_id || {}).plate_number} vehicle`
      }).catch(e => { })
    }

    if (!res.headersSent) return helpers.outputSuccess(res, { msg: "Selected alarms have been updated successfully" });
  }

  static async DeleteAlarm({ res, body, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    let alarmIDs = helpers.getInputValueArray(body, "alarm_ids")
    let isSyncReq = alarmIDs.length <= 10

    //if there's no ID or array of IDs
    if (!alarmIDs || alarmIDs.length === 0) {
      return helpers.outputError(res, null, "Alarm ID is required")
    }
    //if the ID greater than 100
    if (alarmIDs.length > 100) {
      return helpers.outputError(res, null, "You can only delete up to 100 alarms at once")
    }

    //if length request is less than 10, delete as sync, otherwise return and delete in background
    if (!isSyncReq) helpers.outputSuccess(res, { msg: "Alarm deletion is in progress. Refresh the page to see the updates." })
    //remove duplicates
    alarmIDs = [...new Set(alarmIDs)]

    for (let alarmID of alarmIDs) {
      //if the ID is not valid
      if (helpers.isInvalidID(alarmID)) {
        if (isSyncReq) {
          return helpers.outputError(res, null, `Invalid alarm ID ${alarmID}`)
        } else {
          continue;
        }
      }
      let deleteData: SendDBQuery = await DashcamAlarmModel.findOneAndDelete({ _id: alarmID, operator_id: optID })
        .populate("vehicle_id", "plate_number", OptVehicleListModel).catch((e) => ({ error: e }));

      //check for error
      if (deleteData && deleteData.error) {
        if (isSyncReq) {
          return helpers.outputError(res, 500)
        } else {
          continue;
        }
      }

      if (!deleteData) {
        if (isSyncReq) {
          return helpers.outputError(res, null, helpers.errorText.failedToProcess)
        } else {
          continue;
        }
      }
      // //log activity
      helpers.logOperatorActivity({
        auth_id: userData.auth_id, operator_id: optID as string,
        operation: "delete-alarmstatus", data: {
          id: String((deleteData.vehicle_id || {})._id),
          plate_number: (deleteData.vehicle_id || {}).plate_number
        },
        body: `Deleted alarm record for ${(deleteData.vehicle_id || {}).plate_number} vehicle`
      }).catch(e => { })
    }

    if (!res.headersSent) return helpers.outputSuccess(res, { msg: "Selected alarms have been deleted successfully" });
  }

  //========**************LOCATION SECTION***********=========================/
  static async GetLocationData({ query, res, id: vehicleID, customData: userData }: PrivateMethodProps) {
    let startTime = helpers.getInputValueString(query, "start_time")
    let endTime = helpers.getInputValueString(query, "end_time")
    let recordDate = helpers.getInputValueString(query, "record_date")
    let timezone = helpers.getInputValueString(query, "timezone")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = {
      operator_id: new mongoose.Types.ObjectId(optID),
      vehicle_id: new mongoose.Types.ObjectId(vehicleID)
    } as DashcamAlarmTypes

    if (!recordDate || !startTime || !endTime) {
      return helpers.outputError(res, null, "Kindly select the date and time range for the location data you want to retrieve")
    }

    //chek end date if submitted
    //if start date is not submitted
    if (helpers.isDateFormat(recordDate)) {
      return helpers.outputError(res, null, 'Invalid Date. must be in the formate YYYY-MM-DD');
    }

    //validate start and end time
    if (!helpers.isTimeFormat(startTime)) {
      return helpers.outputError(res, null, 'Invalid start time. must be in the formate HH:mm');
    }

    if (!helpers.isTimeFormat(endTime)) {
      return helpers.outputError(res, null, 'Invalid end time. must be in the formate HH:mm');
    }
    //if there's no timezone, return
    if (!timezone) return helpers.outputError(res, null, "Timezone is required when using start_date or end_date")

    //valida the timezone
    if (!GlobalTimeZones.includes(timezone)) return helpers.outputError(res, null, "Submitted timezone is invalid")

    let getUTCStart = helpers.convertDateTimeZone({
      dateString: `${recordDate}T${startTime}:00`,
      fromTimeZone: timezone, toTimeZone: "utc"
    })
    let getUTCEnd = helpers.convertDateTimeZone({
      dateString: `${recordDate}T${endTime}:59`,
      fromTimeZone: timezone, toTimeZone: "utc"
    })

    //if the start time is greater than end time
    if (getUTCStart.dateObj.getTime() > getUTCEnd.dateObj.getTime()) {
      return helpers.outputError(res, null, 'Start time can not be greater than end time');
    }

    // @ts-expect-error
    qBuilder[component === "count-status" ? "start_time" : "gps_timestamp"] = { $gte: getUTCStart.dateObj, $lt: getUTCEnd.dateObj }

    let pageItem = helpers.getPageItemPerPage(itemPerPage, page)
    if (!pageItem.status) return helpers.outputError(res, null, pageItem.msg)

    let pipLine: PipelineQuery = [
      { $match: qBuilder },
      { $addFields: { location_id: "$_id" } },
      { $sort: { _id: -1 as -1 } },
      { $skip: pageItem.data.page },
      { $limit: pageItem.data.item_per_page },
      { $unset: ["__v", "_id"] },
    ]

    if (component) {
      switch (component) {
        case "count":
          pipLine = [
            { $match: qBuilder },
            { $count: "total" },
            { $unset: "_id" }
          ]
          break;
        case "count-status":
          pipLine = [
            { $match: qBuilder },
            {
              $group: {
                _id: null,
                average_speed: { $avg: "$average_speed" },
                max_speed: { $max: "$max_speed" },
                distance_covered: { $sum: "$distance" },
                parking_duration: { $sum: "$parking_time" },
                driving_time: { $sum: "$driving_time" },
                stationary_time: { $sum: "$stationary_time" },
                speed_violations: { $sum: "$speed_violations" },
                alarm_total: { $sum: "$alarms" },
                alarm_mild: { $sum: "$mild_alarms" },
                alarm_critical: { $sum: "$critical_alarms" },
              }
            },
            {
              $lookup: {
                from: DatabaseTableList.vehicle_lists,
                let: { vehID: new mongoose.Types.ObjectId(vehicleID), optID: new mongoose.Types.ObjectId(optID) },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$vehID"] }, { $eq: ["$operator_id", "$$optID"] }] } } },
                  { $project: { plate_number: 1, vehspeed_limit: 1, online_status: 1 } }
                ],
                as: "vehicle_data"

              }
            },
            { $unwind: { path: "$vehicle_data", preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                speed_limit: "$vehicle_data.vehspeed_limit",
                plate_number: "$vehicle_data.plate_number",
                online_status: "$vehicle_data.online_status"
              }
            },
            { $unset: ["_id", "vehicle_data"] }
          ]
          break;
        case "export":
          return helpers.outputError(res, null, "Not Ready Yet!")
        default:
          return helpers.outputError(res, null, "invalid component")
      }

    }

    let getData: SendDBQuery = component === "count-status" ? await LocationSummaryModel.aggregate(pipLine).catch(e => ({ error: e })) :
      await DashcamLocationModel.aggregate(pipLine).catch(e => ({ error: e }))

    //check error
    if (getData && getData.error) {
      console.log("Error getting operator location list", getData.error)
      return helpers.outputError(res, 500)
    }

    if (component) {
      getData = getData.length ? getData[0] : {}
    }

    return helpers.outputSuccess(res, getData);
  }


}