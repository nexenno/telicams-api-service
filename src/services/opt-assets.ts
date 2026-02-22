import helpers from "../assets/helpers";
import { ObjectPayload, PipelineQuery, PrivateMethodProps, SendDBQuery } from "../typings/general";
import { mongoose } from "../models/dbConnector";
import { CollectionListModel, DashcamDeviceModel, DashcamDeviceTypes } from "../models/device-lists";
import { OptVehicleListModel, OptVehicleListTypes } from "../models/opt-vehlists";
import { DatabaseTableList, varConfig } from "../assets/var-config";
import { DashcamAlarmModel, DashcamAlarmTypes } from "../models/device-data";

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
      { $project: { created_by: 0, operator_id: 0, } },
      { $sort: { _id: -1 } },
      { $skip: getPage.data.page },
      { $limit: getPage.data.item_per_page },
      { $unset: ["__v", "_id", "operator_id"] },
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

  }


  //========**************VEHICLE SECTION***********=========================/

  static async AddVehicles({ body, id, res, customData: userData }: PrivateMethodProps) {
    let plateNo = helpers.getInputValueString(body, "plate_number");
    let vehOEM = helpers.getInputValueString(body, "vehicle_oem");
    let vehModel = helpers.getInputValueString(body, "vehicle_model");
    let vehVin = helpers.getInputValueString(body, "vehicle_vin");
    let yearPurchase = helpers.getInputValueString(body, "year_purchase");
    let collectionID = helpers.getInputValueString(body, "collection_id")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = {} as OptVehicleListTypes
    let logMsg = "Updated"

    //if there's no ID for update
    if (!id) {
      if (!plateNo) return helpers.outputError(res, null, "Plate number is required")
      if (!vehOEM) return helpers.outputError(res, null, "Vehicle OEM is required")
      if (!vehModel) return helpers.outputError(res, null, "Vehicle model is required")
      qBuilder.operator_id = new mongoose.Types.ObjectId(optID)
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

    let createVehicle: SendDBQuery = id ? OptVehicleListModel.findOneAndUpdate({ _id: id, operator_id: optID },
      { $set: qBuilder }, { new: true, lean: true }).catch(e => ({ error: e })) :
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

    // helpers.logOperatorActivity({
    //   auth_id: userData.auth_id, operator_id: optID as string,
    //   operation: "create-vehicle", data: {
    //     id: String(createVehicle._id),
    //     plate_number: (qBuilder.plate_number || createVehicle.plate_number)
    //   },
    //   body: id ? logMsg : `Created a new vehicle with plate number ${qBuilder.plate_number}`
    // }).catch(e => { })


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

  static async GetVehicles({ query, body, id, res, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let deviceAssigned = helpers.getInputValueString(query, "device_assigned")
    let status = helpers.getInputValueString(query, "status")
    let startDate = helpers.getInputValueString(query, "start_date")
    let endDate = helpers.getInputValueString(query, "end_date")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = { operator_id: new mongoose.Types.ObjectId(optID) } as OptVehicleListTypes

    if (id) {
      qBuilder._id = new mongoose.Types.ObjectId(id)
    }

    //chek start date if submitted
    if (startDate) {
      if (helpers.isDateFormat(startDate)) {
        return helpers.outputError(res, null, 'Invalid start date. must be in the formate YYYY-MM-DD');
      }
      let sDate = new Date(startDate + "T00:00:00.000Z")
      sDate.setHours(sDate.getHours() - 1)
      // @ts-expect-error
      qBuilder.createdAt = { $gte: sDate };
    }

    //chek end date if submitted
    if (endDate) {
      //if start date is not submitted
      if (helpers.isDateFormat(endDate)) {
        return helpers.outputError(res, null, 'Invalid end date. must be in the formate YYYY-MM-DD');
      }
      if (!startDate) {
        return helpers.outputError(res, null, 'end_date can only be used with start_date');
      }

      //check if the date are wrong
      if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
        return helpers.outputError(res, null, 'start date can not be greater than end date');
      }
      // @ts-expect-error
      qBuilder.createdAt.$lt = new Date(endDate + "T23:00:00.000Z")
    }

    //when online status is provided
    if (status || status === "0") {
      if (isNaN(parseFloat(status))) {
        return helpers.outputError(res, null, "Invalid vehicle status.")
      }
      qBuilder.status = parseInt(status)
    }

    //when online status is provided
    if (deviceAssigned || deviceAssigned === "0") {
      if (isNaN(parseFloat(deviceAssigned))) {
        return helpers.outputError(res, null, "Invalid deviceAssigned.")
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
      ...(component === "export" ? [
        { $limit: 20000 },
        { $sort: { _id: -1 as -1 } }
      ] : [
        { $sort: { _id: -1 as -1 } },
        { $skip: pageItem.data.page },
        { $limit: pageItem.data.item_per_page },
      ]),
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
      { $addFields: { collection_name: "$collection_data.name" } },
      { $unset: ["__v", "_id", "device_data._id", "device_data.__v", "collection_data", "device_data.operator_id", "device_data.created_by"] },
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
              $lookup: {
                from: DatabaseTableList.dashcam_devices,
                let: { deviceID: "$device_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$deviceID"] } } },
                  { $project: { online: 1 } }
                ],
                as: "device_data"
              }
            },
            { $unwind: { path: "$device_data", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: null,
                total_count: { $sum: 1 },
                total_online: { $sum: { $cond: [{ $eq: ["$device_data.online", 1] }, 1, 0] } },
                total_offline: { $sum: { $cond: [{ $ne: ["$device_data.online", 1] }, 1, 0] } },
                total_with_device: { $sum: { $cond: [{ $ifNull: ["$device_assigned", 1] }, 1, 0] } },
                total_shutdown: { $sum: { $cond: [{ $eq: ["$device_data.ioi", 1] }, 1, 0] } },
              }
            },
            { $unset: ["_id", "device_data"] }
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

  static async DeleteVehicle({ body, res, id, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    //if there's no schedule data
    let getData: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      _id: id, operator_id: optID
    }, null, { lean: true }).catch(e => ({ error: e }))

    //if there's error
    if (getData && getData.error) {
      console.log("Error vehicle delete req operator", getData.error)
      return helpers.outputError(res, 500)
    }

    if (!getData) return helpers.outputError(res, null, "Vehicle not found")

    //if there's are users on the vehicle
    if (getData.device_assigned || getData.device_id) {
      return helpers.outputError(res, null, "All the assigned devices must be removed first.")
    }

    let deleteData: SendDBQuery = await OptVehicleListModel.findByIdAndDelete(id).catch((e) => ({ error: e }));

    //check for error
    if (deleteData && deleteData.error) {
      console.log("Error deleting operator vehicle", deleteData.error)
      return helpers.outputError(res, 500)
    }

    if (!deleteData) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    //remove all related documents
    // await OptVehicleDocModel.deleteMany({ vehicle_id: new mongoose.Types.ObjectId(id) }).catch(() => null);

    // //log activity
    // helpers.logOperatorActivity({
    //   auth_id: userData.auth_id, operator_id: optID as string,
    //   operation: "delete-vehicle", data: { id: String(getData._id), plate_number: getData.plate_number },
    //   body: `Deleted ${getData.plate_number} vehicle from the system`
    // }).catch(e => { })

    return helpers.outputSuccess(res)
  }

  static async SuspendedVehicles({ body, res, id, customData: userData }: PrivateMethodProps) {
    let status = helpers.getInputValueString(body, "status")
    let reason = helpers.getInputValueString(body, "reason")
    let optID = helpers.getOperatorAuthID(userData)
    let qBuilder = {} as OptVehicleListTypes

    if (!status) return helpers.outputError(res, null, "Status is required")

    if (!['1', '2'].includes(status)) {
      return helpers.outputError(res, null, "Invalid vehicle status")
    }

    if (status === '2') {
      //if there's no suspend reason
      if (!reason) return helpers.outputError(res, null, "Suspend reason is required when suspending a vehicle")
      qBuilder.status = parseInt(status)
      qBuilder.suspend_date = new Date().toISOString()
    } else {
      qBuilder.status = parseInt(status)
    }

    if (reason) {
      if (reason.length < 10 || reason.length > 500) {
        return helpers.outputError(res, null, reason.length < 10 ? "suspend reason is too short" : "suspend reason is too long")
      }
      qBuilder.suspend_reason = reason
    }

    //getting the vehicle data
    let getVeh: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      _id: id, operator_id: optID
    }).lean().catch(e => ({ error: e }))

    //check for error
    if (getVeh && getVeh.error) {
      console.log("Error getting vehicle for suspend", getVeh.error)
      return helpers.outputError(res, 500)
    }

    if (!getVeh) return helpers.outputError(res, null, "Vehicle not found")

    //if the vehicle is under suspension by the admin
    if (getVeh.status === 3) {
      return helpers.outputError(res, null, "This vehicle is suspended by the admin. Contact the admin for more info")
    }

    let updateStatus: SendDBQuery = await OptVehicleListModel.findByIdAndUpdate(id, { $set: qBuilder },
      { new: true }).catch(e => ({ error: e }))

    //check for error
    if (updateStatus && updateStatus.error) {
      console.log("Error updating vehicle status by operator", updateStatus.error)
      return helpers.outputError(res, 500)
    }
    //if the query does not execute
    if (!updateStatus) {
      return helpers.outputError(res, null, helpers.errorText.failedToProcess)
    }

    // //log activity
    // helpers.logOperatorActivity({
    //   auth_id: userData.auth_id, operator_id: optID as string,
    //   operation: "update-vehicle", data: { id: String(updateStatus._id), plate_number: updateStatus.plate_number },
    //   body: `${status === "1" ? "Activated" : "Suspended"} ${updateStatus.plate_number} vehicle`
    // }).catch(e => { })

    return helpers.outputSuccess(res);
  }

  //========**************ALARM SECTION***********=========================/
  static async GetAlarmData({ query, body, id, res, req, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let status = helpers.getInputValueString(query, "status")
    let startDate = helpers.getInputValueString(query, "start_date")
    let endDate = helpers.getInputValueString(query, "end_date")
    let alarmType = helpers.getInputValueString(query, "alarm_type")
    let vehicleID = helpers.getInputValueString(query, "vehicle_id")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = { operator_id: new mongoose.Types.ObjectId(optID) } as DashcamAlarmTypes

    if (id) {
      qBuilder._id = new mongoose.Types.ObjectId(id)
    }

    if (vehicleID) {
      if (helpers.isInvalidID(vehicleID)) {
        return helpers.outputError(res, null, "Invalid vehicle ID")
      }
      qBuilder.vehicle_id = new mongoose.Types.ObjectId(vehicleID)
    }

    //chek start date if submitted
    if (startDate) {
      if (helpers.isDateFormat(startDate)) {
        return helpers.outputError(res, null, 'Invalid start date. must be in the formate YYYY-MM-DD');
      }
      let sDate = new Date(startDate + "T00:00:00.000Z")
      sDate.setHours(sDate.getHours() - 1)
      // @ts-expect-error
      qBuilder.createdAt = { $gte: sDate };
    }

    if (alarmType) {
      //check if the value is valid
      qBuilder.alarm_type = alarmType
    }

    //chek end date if submitted
    if (endDate) {
      //if start date is not submitted
      if (helpers.isDateFormat(endDate)) {
        return helpers.outputError(res, null, 'Invalid end date. must be in the formate YYYY-MM-DD');
      }
      if (!startDate) {
        return helpers.outputError(res, null, 'end_date can only be used with start_date');
      }

      //check if the date are wrong
      if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
        return helpers.outputError(res, null, 'start date can not be greater than end date');
      }
      // @ts-expect-error
      qBuilder.createdAt.$lt = new Date(endDate + "T23:00:00.000Z")
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
          from: DatabaseTableList.operator_vehicle_docs,
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
                total_resolved: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                total_unresolved: { $sum: { $cond: [{ $ne: ["$status", 0] }, 1, 0] } },
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

    if (component || id) {
      getData = getData.length ? getData[0] : {}
    }
    return helpers.outputSuccess(res, getData);
  }

}