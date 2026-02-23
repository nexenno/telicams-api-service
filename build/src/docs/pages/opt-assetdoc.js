"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optAssets = {};
optAssets.add_new_vehicle = {
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
    ],
    response: `   {
      status: "ok",
      data: {}
   }`
};
optAssets.update_vehicle_status = {
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
};
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
};
optAssets.delete_vehicle = {
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
};
optAssets.add_new_device = {
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
};
optAssets.assign_device_to_vehicle = {
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
};
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
};
optAssets.delete_device = {
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
    docs: [],
    response: `   {
      status: "ok",
      data: {}
   }`
};
optAssets.update_alarm_status = {
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
};
optAssets.get_alarm = {
    title: "Get Alarm Data",
    header: "Header-> Authorization: Bearer token,",
    sidebar: "Get Alarm",
    comment: "",
    method: "GET",
    url: "http(s)://base-url/operators/assets/alarm-lists/{alarm_id}",
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
};
optAssets.delete_alarm = {
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
};
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
};
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
};
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
};
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
};
optAssets.assign_collection_to_personnel = {
    title: "Assign or Remove Collection from Team Member",
    header: "Header-> Authorization: Bearer {{token}}",
    sidebar: "Assign Admin Collection",
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
            field: "team_id",
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
};
optAssets.assign_collection_to_vehicle = {
    title: "Assign or Remove Collection from Vehicle",
    header: "Header-> Authorization: Bearer {{token}}",
    sidebar: "Assign vehicle Collection",
    comment: "",
    method: "PUT",
    url: "http(s)://base-url/operators/assets/collection-lists/{{collection_id}}",
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
};
const RouteContainer = [
    {
        name: "Vehicle List & Devices",
        route: "operator",
        routes: [
            optAssets.add_new_device,
            optAssets.assign_device_to_vehicle,
            optAssets.get_device_list,
            optAssets.delete_device,
            optAssets.add_new_vehicle,
            optAssets.update_vehicle_status,
            optAssets.get_vehicle,
            optAssets.delete_vehicle,
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
            optAssets.assign_collection_to_personnel,
            optAssets.assign_collection_to_vehicle,
        ]
    },
    {
        name: "Alarm List",
        route: "operator",
        routes: [
            optAssets.update_alarm_status,
            optAssets.get_alarm,
            optAssets.delete_alarm,
        ]
    },
];
exports.default = RouteContainer;
