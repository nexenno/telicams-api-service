"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adminAssetDoc = {};
adminAssetDoc.add_new_device = {
    title: "Add New Device",
    header: "Header-> Authorization: Bearer {{token}}",
    sidebar: "Add New Device",
    comment: "For Update, use PUT with the deviceID in the URL. For bulk upload, set the 'component' query parameter to 'bulk-upload' and provide a CSV file with the required device details.",
    method: "POST|PUT",
    url: "http(s)://base-url/admins/assets/device-lists",
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
adminAssetDoc.update_device_status = {
    title: "Update Device Status",
    header: "Header-> Authorization: Bearer token,",
    sidebar: "Update Device Status",
    comment: "",
    method: "PATCH",
    url: "http(s)://base-url/admins/assets/device-lists/{{device_id}}",
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
};
adminAssetDoc.get_device_list = {
    title: "Get Device List",
    header: "Header-> Authorization: Bearer token,",
    sidebar: "Get Device List",
    comment: "",
    method: "GET",
    url: "http(s)://base-url/admins/assets/device-lists/{device_id}",
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
};
exports.default = [
    {
        name: "Miscellaneous",
        route: "admin",
        routes: Object.values(adminAssetDoc)
    },
];
