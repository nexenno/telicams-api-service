import { ObjectPayload } from "../../typings/general";

const optOtherDoc = {} as ObjectPayload

optOtherDoc.add_new_vehicle = {
  title: "Add New Vehicle",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Add New Vehicle",
  comment: "For Update, use POST with the vehicleID in the URL. For bulk upload, set the 'component' query parameter to 'bulk-upload' and provide a CSV file with the required vehicle details.",
  method: "POST",
  url: "http(s)://base-url/operators/assets/vehicle-lists",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "plate_number",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "vehicle_oem",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "year_purchase",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "vehicle_model",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "vehicle_vin",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "collection_id",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "vehspeed_limit",
      type: "String",
      status: "optional",
      description: "Vehicle speed limit should be a number between 10 and 250",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}


optOtherDoc.add_new_collection = {
  title: "Add New Collection",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Add New Collection",
  comment: "For Update, use PUT with the collection_id in the URL.",
  method: "POST|PUT",
  url: "http(s)://base-url/operators/assets/collection-lists",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "name",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "description",
      type: "String",
      status: "optional",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optOtherDoc.update_collection_status = {
  title: "Update Collection Status",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Update Col. Status",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/collection-lists/{{collection_id}}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "status",
      type: "String",
      status: "optional",
      description: "1=Active | 2=Archived",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optOtherDoc.get_collection_list = {
  title: "Get Collection List",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Get Collection",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/assets/collection-lists/{collection_id}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "q",
      type: "String",
      status: "optional",
      description: "Search name",
    },
    {
      field: "page",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "item_per_page",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "component",
      type: "String",
      status: "optional",
      description: "count | count-status",
    },

  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optOtherDoc.delete_collection = {
  title: "Delete Collection",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Delete Collection",
  comment: "",
  method: "DELETE",
  url: "http(s)://base-url/operators/assets/collection-lists/{{collection_id}}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [],
  response: `   {
      status: "ok",
      data: {}
   }`
}


optOtherDoc.assign_collection_to_personnel = {
  title: "Assign or Remove Collection from Team Member",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Assign Admin Collection",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/collection-assignments/{{collection_id}}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "auth_id",
      type: "String",
      status: "required",
      description: "ID of the team member to assign or remove collection access",
    },
    {
      field: "request_type",
      type: "String",
      status: "required",
      description: "1=Assign | 2=Remove",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optOtherDoc.assign_collection_to_vehicle = {
  title: "Assign or Remove Collection from Vehicle",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Assign vehicle Collection",
  comment: "",
  method: "PUT",
  url: "http(s)://base-url/operators/assets/collection-assignments/{{collection_id}}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "vehicle_ids",
      type: "Array",
      status: "required",
      description: "ID of the vehicle to assign or remove collection access",
    },
    {
      field: "request_type",
      type: "String",
      status: "required",
      description: "1=Assign | 2=Remove",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}


const RouteContainer = [
  {
    name: "Collection List",
    route: "operator",
    routes: [
      optOtherDoc.add_new_collection,
      optOtherDoc.update_collection_status,
      optOtherDoc.get_collection_list,
      optOtherDoc.delete_collection,
      optOtherDoc.assign_collection_to_personnel,
      optOtherDoc.assign_collection_to_vehicle,
    ]
  },
]
export default RouteContainer;