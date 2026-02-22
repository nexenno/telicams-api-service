import { ObjectPayload } from "../../typings/general"

const optAssets = {} as ObjectPayload

optAssets.add_new_vehicle = {
  title: "Add New Vehicle",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Add New Vehicle",
  comment: "For Update, use PUT with the vehicleID in the URL. For bulk upload, set the 'component' query parameter to 'bulk-upload' and provide a CSV file with the required vehicle details.",
  method: "POST|PUT",
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
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssets.update_vehicle_status = {
  title: "Update Vehicle Status",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Update Veh Status",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/vehicle-lists/{{vehicle_id}}?component=status",
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
      description: "1=Active | 2=Suspended",
    },
    {
      field: "reason",
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

optAssets.get_vehicle = {
  title: "Get Vehicle ",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Get Vehicle ",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/assets/vehicle-lists/{vehicle_id}",
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
      description: "Search plate number",
    },
    {
      field: "collection_id",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "start_date",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "end_date",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "device_assigned",
      type: "String",
      status: "optional",
      description: "0=Not Assigned | 1=Assigned",
    },
    {
      field: "status",
      type: "String",
      status: "optional",
      description: "0=Pending | 1=Active | 2=Suspended by operator | 3=Suspended by admin",
    },
    {
      field: "online",
      type: "String",
      status: "optional",
      description: "0=Not online | 1=Online",
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

optAssets.assign_vehicle = {
  title: "Assign Device to Vehicle",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Assign Device",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/vehicle-lists/{{vehicle_id}}?component=assign",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "device_id",
      type: "String",
      status: "required",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssets.unassign_vehicle = {
  title: "Unassign Device from Vehicle",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Unassign Device",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/vehicle-lists/{{vehicle_id}}?component=unassign",
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

optAssets.delete_vehicle = {
  title: "Delete Vehicle",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Delete Vehicle",
  comment: "",
  method: "DELETE",
  url: "http(s)://base-url/operators/assets/vehicle-lists/{{vehicle_id}}",
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


optAssets.add_new_device = {
  title: "Add New Device",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Add New Device",
  comment: "For Update, use PUT with the deviceID in the URL. For bulk upload, set the 'component' query parameter to 'bulk-upload' and provide a CSV file with the required device details.",
  method: "POST|PUT",
  url: "http(s)://base-url/operators/assets/device-lists",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "device_number",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "device_model",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "device_oem",
      type: "String",
      status: "required",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssets.update_device_status = {
  title: "Update Device Status",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Update Device Status",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/device-lists/{{device_id}}",
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
      description: "1=Active | 2=Suspended",
    },
    {
      field: "reason",
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

optAssets.get_device_list = {
  title: "Get Device List",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Get Device List",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/assets/device-lists/{device_id}",
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
      description: "Search device number",
    },
    {
      field: "status",
      type: "String",
      status: "optional",
      description: "0=Pending | 1=Active | 2=Suspended by operator | 3=Decommissioned by admin",
    },
    {
      field: "online",
      type: "String",
      status: "optional",
      description: "0=Not online | 1=Online",
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




optAssets.add_new_collection = {
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

optAssets.update_collection_status = {
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

optAssets.get_collection_list = {
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

optAssets.delete_collection = {
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


const RouteContainer = [
  {
    name: "Vehicle List & Devices",
    route: "operator",
    routes: [
      optAssets.add_new_vehicle,
      optAssets.update_vehicle_status,
      optAssets.get_vehicle,
      optAssets.assign_vehicle,
      optAssets.unassign_vehicle,
      optAssets.delete_vehicle,
      optAssets.add_new_device,
      optAssets.update_device_status,
      optAssets.get_device_list,
    ]
  },
  {
    name: "Collection List",
    route: "operator",
    routes: [
      optAssets.add_new_collection,
      optAssets.update_collection_status,
      optAssets.get_collection_list,
      optAssets.delete_collection,
    ]
  },
]

export default RouteContainer