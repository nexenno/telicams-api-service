import { ObjectPayload } from "../../typings/general"

const optAssetDoc = {} as ObjectPayload

optAssetDoc.add_new_vehicle = {
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

optAssetDoc.update_vehicle_status = {
  title: "Update Vehicle Status",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Update Veh Status",
  comment: "",
  method: "PUT",
  url: "http(s)://base-url/operators/assets/vehicle-lists/",
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
      description: "Array of vehicle IDs to update",
    },
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
      description: "Reason for updating the vehicle status ",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssetDoc.get_vehicle = {
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
      field: "timezone",
      type: "String",
      status: "optional",
      description: "Required when filtering by date. Generate with Intl.DateTimeFormat().resolvedOptions().timeZone",
    },
    {
      field: "device_assigned",
      type: "String",
      status: "optional",
      description: "0=Not Assigned | 1=Assigned",
    },
    {
      field: "vehicle_status",
      type: "String",
      status: "optional",
      description: "0=Pending | 1=Active | 2=Suspended",
    },
    {
      field: "acc_status",
      type: "String",
      status: "optional",
      description: "0=Pending | 1=Active",
    },
    {
      field: "online_status",
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
      description: "count | count-status | count-profilestat",
    },

  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssetDoc.delete_vehicle = {
  title: "Delete Vehicle",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Delete Vehicle",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/vehicle-lists/",
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
      description: "Array of vehicle IDs to delete",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}


optAssetDoc.add_new_device = {
  title: "Add New Device",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Add New Device",
  comment: "For Update, use PUT with the deviceID in the URL",
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
      status: "optional",
      description: "",
    },
    {
      field: "device_oem",
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

optAssetDoc.assign_device_to_vehicle = {
  title: "Assign Device to Vehicle or Unassign Device from Vehicle",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Assign/Unassign Device",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/device-lists/{{device_id}}?component=assign|unassign",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "vehicle_id",
      type: "String",
      status: "optional",
      description: "ID of the vehicle to assign or unassign the device to/from",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssetDoc.get_device_list = {
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
      field: "assign_status",
      type: "String",
      status: "optional",
      description: "1=unassigned | 2=Assigned",
    },
    {
      field: "active_status",
      type: "String",
      status: "optional",
      description: "1=active | 2=suspended",
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

optAssetDoc.delete_device = {
  title: "Delete Device",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Delete Device",
  comment: "",
  method: "DELETE",
  url: "http(s)://base-url/operators/assets/device-lists/{{device_id}}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [

  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssetDoc.engine_shutdown = {
  title: "Shutdown or Activate Vehicle Enginw",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Shutdown/Activate Engine",
  comment: "",
  method: "PUT",
  url: "http(s)://base-url/operators/assets/vehicle-shutdowns",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "vehicle_id",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "status",
      type: "String",
      status: "required",
      description: "1=activate | 2=shutdown",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}


optAssetDoc.update_alarm_status = {
  title: "Update Alarm",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Update Alarm",
  comment: "",
  method: "PUT",
  url: "http(s)://base-url/operators/assets/alarm-lists/",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "alarm_ids",
      type: "Array",
      status: "required",
      description: "Array of alarm IDs to update",
    },
    {
      field: "status",
      type: "String",
      status: "optional",
      description: "0=unresolved | 1=resolved ",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssetDoc.get_alarm = {
  title: "Get Alarm Data",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Get Alarm",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/assets/alarm-lists/{vehicle_id}",
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
      description: "Search alarm reference or vehicle plate number",
    },
    {
      field: "status",
      type: "String",
      status: "optional",
      description: "0=unresolved | 1=resolved",
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
      field: "timezone",
      type: "String",
      status: "optional",
      description: "Required when filtering by date. Generate with Intl.DateTimeFormat().resolvedOptions().timeZone",
    },
    {
      field: "alarm_type",
      type: "String",
      status: "optional",
      description: "",
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

optAssetDoc.delete_alarm = {
  title: "Delete Alarm",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Delete Alarm",
  comment: "",
  method: "PATCH",
  url: "http(s)://base-url/operators/assets/alarm-lists/",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "alarm_ids",
      type: "Array",
      status: "required",
      description: "Array of alarm IDs to delete",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAssetDoc.get_vehlocation = {
  title: "Get Vehicle Location",
  header: "Header-> Authorization: Bearer token,",
  sidebar: "Get Locations",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/assets/location-lists/{vehicle_id}",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "start_time",
      type: "String",
      status: "required",
      description: "Format should be HH:mm. Required along with end_time, record_date and timezone",
    },
    {
      field: "end_time",
      type: "String",
      status: "required",
      description: "Format should be HH:mm. Required along with start_time, record_date and timezone",
    },
    {
      field: "record_date",
      type: "String",
      status: "required",
      description: "Must be in YYYY-MM-DD format. Required along with timezone and start & end time",
    },
    {
      field: "timezone",
      type: "String",
      status: "required",
      description: "Required when filtering by date. Generate with Intl.DateTimeFormat().resolvedOptions().timeZone",
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


const RouteContainer = [
  {
    name: "Vehicle & Devices",
    route: "operator",
    routes: [
      optAssetDoc.add_new_device,
      optAssetDoc.assign_device_to_vehicle,
      optAssetDoc.get_device_list,
      optAssetDoc.delete_device,
      optAssetDoc.add_new_vehicle,
      optAssetDoc.update_vehicle_status,
      optAssetDoc.get_vehicle,
      optAssetDoc.delete_vehicle,
    ]
  },
  {
    name: "Alarms & Locations",
    route: "operator",
    routes: [
      optAssetDoc.update_alarm_status,
      optAssetDoc.get_alarm,
      optAssetDoc.delete_alarm,
      optAssetDoc.get_vehlocation,
    ]
  },
]

export default RouteContainer