import helpers from "../assets/helpers"
import { DatabaseTableList } from "../assets/var-config"
import { mongoose } from "../models/dbConnector"
import { CollectionListModel } from "../models/device-lists"
import { OptVehicleListModel } from "../models/opt-vehlists"
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

    let createColl: SendDBQuery = id ? CollectionListModel.findOneAndUpdate({ _id: id, operator_id: optID },
      { $set: qBuilder }, { new: true, lean: true }).catch(e => ({ error: e })) :
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

    // helpers.logOperatorActivity({
    //   auth_id: userData.auth_id, operator_id: optID as string,
    //   operation: "create-collection", data: { id: String(createColl._id), name: createColl.name },
    //   body: id ? `Updated collection - ${createColl.name}` : `Created a new collection - ${createColl.name}`
    // }).catch(e => { })

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
      { $sort: { _id: -1 as -1 } },
      ...(component === "export" ? [
        { $limit: 20000 },
      ] : [
        { $skip: pageItem.data.page },
        { $limit: pageItem.data.item_per_page },
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

    return helpers.outputSuccess(res)
  }

  static async UpdateCollection({ body, res, req, id, customData: userData }: PrivateMethodProps) {
    let status = helpers.getInputValueString(body, "status")
    let optID = helpers.getOperatorAuthID(userData)

    if (!status) return helpers.outputError(res, null, "Status is required")
    if (["1", "2"].includes(status)) return helpers.outputError(res, null, "Invalid status")

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
      { $set: { status: parseInt(status) } }, { new: true }).catch(e => ({ error: e }))

    if (updateCol && updateCol.error) {
      console.log("Error updating collection status", updateCol.error)
      return helpers.outputError(res, 500)
    }

    if (!updateCol) return helpers.outputError(res, null, helpers.errorText.failedToProcess)

    return helpers.outputSuccess(res)

  }

}