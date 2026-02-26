import helpers, { GlobalTimeZones } from "../assets/helpers"
import { DatabaseTableList } from "../assets/var-config"
import { OperatorLogModel } from "../models/activity-logs"
import { mongoose } from "../models/dbConnector"
import { CollectionListModel } from "../models/device-lists"
import { OptVehicleListModel } from "../models/opt-vehlists"
import { UserOperatorModel, UserOperatorTypes } from "../models/user-operators"
import { ObjectPayload, PipelineQuery, PrivateMethodProps, SendDBQuery } from "../typings/general"


export class OperatorOtherService {


  //========**************COLLECTION SECTION***********=========================/
  static async CreateCollection({ body, id, res, req, customData: userData }: PrivateMethodProps) {
    let name = helpers.getInputValueString(body, "name")
    let description = helpers.getInputValueString(body, "description")
    let optID = helpers.getOperatorAuthID(userData)
    let qBuilder = {} as ObjectPayload

    if (!id) {
      if (!name) return helpers.outputError(res, null, "Collection name is required")
      qBuilder.operator_id = new mongoose.Types.ObjectId(optID)
    }

    if (name) {
      //if the length is invalid
      if (name.length < 2 || name.length > 45) {
        return helpers.outputError(res, null, "Collection name must be between 2 and 45 characters")
      }
      //if the characters are invalid
      if (!helpers.isAllowedCharacters(name)) {
        return helpers.outputError(res, null, "Collection name contains invalid characters")
      }
      qBuilder.name = name
    }

    if (description) {
      if (description.length < 5 || description.length > 300) {
        return helpers.outputError(res, null, "Collection description must be between 5 and 300 characters")
      }
      qBuilder.description = description
    }

    if (Object.keys(qBuilder).length === 0) return helpers.outputError(res, null, "No data to process")

    let createColl: SendDBQuery = id ? await CollectionListModel.findOneAndUpdate({ _id: id, operator_id: optID },
      { $set: qBuilder }, { returnDocument: "after", lean: true }).catch(e => ({ error: e })) :
      await CollectionListModel.create(qBuilder).catch(e => ({ error: e }));

    //if there's error in creating the account
    if (createColl && createColl.error) {
      console.log("Error creating collection", createColl.error)
      return helpers.outputError(res, 500)
    }
    //if query failed
    if (!createColl) {
      return helpers.outputError(res, null, helpers.errorText.failedToProcess)
    }

    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: "create-collection", data: { id: String(createColl._id), name: createColl.name },
      body: id ? `Updated collection - ${createColl.name}` : `Created a new collection - ${createColl.name}`
    }).catch(e => { })

    return helpers.outputSuccess(res);
  }

  static async GetCollections({ query, body, id, res, req, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let qBuilder = { operator_id: new mongoose.Types.ObjectId(optID) } as ObjectPayload

    if (id) {
      qBuilder._id = new mongoose.Types.ObjectId(id)
    }

    if (q) {
      if (helpers.hasInvalidSearchChar(q)) {
        return helpers.outputError(res, null, "Special characters not allowed on search.")
      }
      qBuilder.name = { $regex: q, $options: 'i' } as any
    }

    let pageItem = helpers.getPageItemPerPage(itemPerPage, page)
    if (!pageItem.status) return helpers.outputError(res, null, pageItem.msg)

    let pipLine: PipelineQuery = [
      { $match: qBuilder },
      ...(component === "count" ? [
        { $count: "total" },
      ] : [
        { $sort: { _id: -1 as -1 } },
        { $skip: pageItem.data.page },
        { $limit: pageItem.data.item_per_page },
        { $addFields: { collection_id: "$_id" } },
      ]),
      {
        $lookup: {
          from: DatabaseTableList.vehicle_lists,
          let: { collID: "$_id" },
          pipeline: [{
            $match: { $expr: { $eq: ["$collection_id", "$$collID"] } },
          }, {
            $count: "total"
          }],
          as: "vehicle_count"
        }
      },
      { $unwind: { path: "$vehicle_count", preserveNullAndEmptyArrays: true } },
      { $addFields: { total_vehicle: { $ifNull: ["$vehicle_count.total", 0] } } },
      { $unset: ["__v", "_id", "vehicle_count"] }
    ]

    let getData: SendDBQuery = await CollectionListModel.aggregate(pipLine).catch(e => ({ error: e }))

    //check error
    if (getData && getData.error) {
      console.log("Error getting collection list", getData.error)
      return helpers.outputError(res, 500)
    }

    if (component || id) {
      getData = getData.length ? getData[0] : {}
    }

    return helpers.outputSuccess(res, getData)
  }

  static async DeleteCollection({ query, body, id, res, req, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)

    //check if the collection exist
    let getCol: SendDBQuery = await CollectionListModel.findOneAndDelete({
      _id: id, operator_id: optID
    }).catch(e => ({ error: e }))

    //check for error
    if (getCol && getCol.error) {
      console.log("Error checking collection for delete", getCol.error)
      return helpers.outputError(res, 500)
    }

    if (!getCol) return helpers.outputError(res, null, "Collection not found")

    // TODO://remove the collection id from all the vehicles under this collection
    // TODO://remove all users on collection off
    // //log activity
    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: "delete-collectionstatus", data: {},
      body: `Deleted a collection - ${getCol.name}`
    }).catch(e => { })

    return helpers.outputSuccess(res)
  }

  static async UpdateCollection({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let status = helpers.getInputValueString(body, "status")
    let optID = helpers.getOperatorAuthID(userData)

    if (!status) return helpers.outputError(res, null, "Status is required")
    if (!["1", "2"].includes(status)) return helpers.outputError(res, null, "Invalid status")

    //if status is 2, check if there's any active vehicle under the collection
    if (status === "2") {
      let activeVeh: SendDBQuery = await OptVehicleListModel.findOne({
        collection_id: id, operator_id: optID
      }).catch(e => ({ error: e }))

      if (activeVeh && activeVeh.error) {
        console.log("Error checking active vehicle on collection update", activeVeh.error)
        return helpers.outputError(res, 500)
      }

      if (activeVeh) return helpers.outputError(res, null, "There are vehicles under this collection. Action Aborted!")
    }

    let updateCol: SendDBQuery = await CollectionListModel.findOneAndUpdate({ _id: id, operator_id: optID },
      { $set: { status: parseInt(status) } }, { lean: true, returnDocument: "after" }).catch(e => ({ error: e }))

    if (updateCol && updateCol.error) {
      console.log("Error updating collection status", updateCol.error)
      return helpers.outputError(res, 500)
    }

    if (!updateCol) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    // //log activity
    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: "update-collectionstatus", data: {},
      body: `${status === "1" ? "Activated" : "Archived"} a collection - ${updateCol.name}`
    }).catch(e => { })

    return helpers.outputSuccess(res)

  }

  //========**************ASSIGNING COLLECTION SECTION***********=========================/

  static async AssignVehicleToCollection({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let vehicleIDs = helpers.getInputValueArray(body, "vehicle_ids")
    let requestType = helpers.getInputValueString(body, "request_type")
    let optID = helpers.getOperatorAuthID(userData)
    let isSyncReq = vehicleIDs.length <= 10
    let collName = ""

    if (!requestType) return helpers.outputError(res, null, "Request type is required")
    if (!["1", "2"].includes(requestType)) return helpers.outputError(res, null, "Invalid request type")

    //if there's no ID or array of IDs
    if (!vehicleIDs || vehicleIDs.length === 0) {
      return helpers.outputError(res, null, "Vehicle ID is required")
    }

    //if the ID greater than 100
    if (vehicleIDs.length > 100) {
      return helpers.outputError(res, null, "You can only perform this action on up to 100 vehicles at once")
    }

    //if length request is less than 10, delete as sync, otherwise return and delete in background
    if (!isSyncReq) helpers.outputSuccess(res, { msg: "Action is in progress. Refresh the page to see the updates." })

    //check if the collection exist
    if (requestType === "1") {
      let getCol: SendDBQuery = await CollectionListModel.findOne({ _id: id, operator_id: optID }).lean().catch(e => ({ error: e }))

      //check for error
      if (getCol && getCol.error) {
        console.log("Error checking collection for assign collection", getCol.error)
        return helpers.outputError(res, 500)
      }

      if (!getCol) return helpers.outputError(res, null, "Collection not found")

      //if the collection is archived, return error
      if (getCol.status === 2) return helpers.outputError(res, null, "Collection is archived. Action aborted!")
      collName = getCol.name
    }

    //remove duplicates
    vehicleIDs = [...new Set(vehicleIDs)]

    for (let vehicleID of vehicleIDs) {
      if (helpers.isInvalidID(vehicleID)) {
        if (isSyncReq) {
          return helpers.outputError(res, null, `Invalid vehicle ID ${vehicleID}`)
        } else {
          continue;
        }
      }

      //check if the vehicle exist and belong to the operator
      let checkVeh: SendDBQuery = await OptVehicleListModel.findOneAndUpdate({ _id: vehicleID, operator_id: optID },
        requestType === "1" ? { $set: { collection_id: id } } : { $unset: { collection_id: 1 } },
        { lean: true, returnDocument: "after" }).catch(e => ({ error: e }))

      //check for error
      if (!checkVeh || checkVeh.error) {
        if (isSyncReq) {
          return helpers.outputError(res, null, requestType === "1" ? "Vehicle not found" : "Vehicle not found in collection")
        } else {
          continue;
        }
      }

      // //log activity
      helpers.logOperatorActivity({
        auth_id: userData.auth_id, operator_id: optID as string,
        operation: requestType === "1" ? "assign-collection" : "remove-collection",
        data: { id: String(vehicleID), plate_number: checkVeh.plate_number },
        body: requestType === "1" ? `Assigned ${checkVeh.plate_number} vehicle to ${collName} collection` :
          `Removed ${checkVeh.plate_number} vehicle a collection`
      }).catch(e => { })
    }

    if (!isSyncReq) return helpers.outputSuccess(res, { msg: "Action completed successfully!" })
  }

  static async AssignCollectionToPersonnel({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let teamID = helpers.getInputValueString(body, "team_id")
    let requestType = helpers.getInputValueString(body, "request_type")
    let optID = helpers.getOperatorAuthID(userData)

    if (!requestType) return helpers.outputError(res, null, "Request type is required")
    if (!["1", "2"].includes(requestType)) return helpers.outputError(res, null, "Invalid request type")

    //if there's no team ID
    if (!teamID) return helpers.outputError(res, null, "Team ID is required")
    //if the team ID is invalid
    if (helpers.isInvalidID(teamID)) return helpers.outputError(res, null, "Invalid team ID")

    //check if the collection exist
    let teamData: SendDBQuery<UserOperatorTypes> = await UserOperatorModel.findOne({
      _id: teamID, operator_id: optID
    }).lean().catch(e => ({ error: e }))
    //check for error
    if (teamData && teamData.error) {
      console.log("Error checking team for assign collection", teamData.error)
      return helpers.outputError(res, 500)
    }

    if (!teamData) return helpers.outputError(res, null, "Team member not found")

    //check if the team member is active
    if (teamData.account_status !== 1) return helpers.outputError(res, null, "Team member is not active")

    //check if the collection exist
    let getCol: SendDBQuery = await CollectionListModel.findOne({ _id: id, operator_id: optID }).lean().catch(e => ({ error: e }))

    //check for error
    if (getCol && getCol.error) {
      console.log("Error checking collection for assign collection personnel", getCol.error)
      return helpers.outputError(res, 500)
    }

    if (!getCol) return helpers.outputError(res, null, "Collection not found")

    //if the collection is archived, return error
    if (getCol.status === 2) return helpers.outputError(res, null, "Collection is archived. Action aborted!")

    let updateData: SendDBQuery = await UserOperatorModel.findOneAndUpdate({ _id: teamID, operator_id: optID },
      requestType === "1" ? { $addToSet: { collection_access: id } } : { $pull: { collection_access: id } },
      { lean: true, returnDocument: "after" }).catch(e => ({ error: e }))

    if (updateData && updateData.error) {
      console.log("Error updating team collection access", updateData.error)
      return helpers.outputError(res, 500)
    }

    if (!updateData) return helpers.outputError(res, null, requestType === "1" ? "Team member not found" : "Team member not found in collection access")

    // //log activity
    helpers.logOperatorActivity({
      auth_id: userData.auth_id, operator_id: optID as string,
      operation: requestType === "1" ? "assign-collection" : "remove-collection",
      data: { id: String(userData.auth_id) },
      body: requestType === "1" ? `Assigned ${teamData.business_name} to ${getCol.name} collection` :
        `Removed ${teamData.business_name} from ${getCol.name} collection`
    }).catch(e => { })

    return helpers.outputSuccess(res)
  }

  //========**************ACTIVITY LOGS SECTION***********=========================/
  static async ActivityLogs({ query, res, req, id, customData: userData }: PrivateMethodProps) {
    let q = helpers.getInputValueString(query, "q")
    let startDate = helpers.getInputValueString(query, "start_date")
    let endDate = helpers.getInputValueString(query, "end_date")
    let timezone = helpers.getInputValueString(query, "timezone")
    let page = helpers.getInputValueString(query, "page")
    let itemPerPage = helpers.getInputValueString(query, "item_per_page")
    let component = helpers.getInputValueString(query, "component")
    let optID = helpers.getOperatorAuthID(userData)

    let queryBuilder: ObjectPayload = { operator_id: new mongoose.Types.ObjectId(optID) }
    let nameQuery = {} as ObjectPayload

    if (q) {
      if (!helpers.isAllowedCharacters(q)) {
        return helpers.outputError(res, null, "Search query has invalid characters")
      }
      nameQuery.first_name = { $regex: q, $options: "i" }
      nameQuery.last_name = { $regex: q, $options: "i" }
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

    if (id) {
      queryBuilder["data.id"] = id
    }

    let getPage = helpers.getPageItemPerPage(itemPerPage, page)
    if (getPage.status !== true) return helpers.outputError(res, null, getPage.msg)

    let lookup = [{
      $lookup: {
        from: DatabaseTableList.user_operators,
        let: { authID: "$auth_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$authID"] }, ...nameQuery } },
          { $project: { business_name: 1 } }
        ],
        as: "operator_data"
      }
    }, {
      $unwind: "$operator_data"
    }, {
      $addFields: {
        operator_name: "$operator_data.business_name"
      }
    }]


    let pipeline: PipelineQuery = [
      { $match: queryBuilder },
      ...(q ? lookup : []),
      { $sort: { _id: -1 } },
      { $skip: getPage.data.page },
      { $limit: getPage.data.item_per_page },
      ...(q ? [] : lookup),
      { $unset: ["_id", "__v", "operator_data"] }
    ];


    if (component) {
      switch (component) {
        case "count":
          pipeline = [
            { $match: queryBuilder },
            { $count: "total" },
            { $unset: "_id" }
          ]
          break;
        default:
          return helpers.outputError(res, null, "Invalid component")

      }
    }

    let getLogs: SendDBQuery = await OperatorLogModel.aggregate(pipeline).catch(e => ({ error: e }))

    //if there's an error
    if (getLogs && getLogs.error) {
      console.log("error while fetching operator logs", getLogs.error)
      return helpers.outputError(res, 500)
    }

    // manual unwind
    if (component) {
      getLogs = getLogs.length ? getLogs[0] : { total: 0 }
    }

    return helpers.outputSuccess(res, getLogs)
  }

  // static async Dashboard({ res, req, id, customData: userData }: PrivateMethodProps) {
}