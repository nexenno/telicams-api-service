const optAccDoc: Record<string, any> = {}
const optOtherDoc: Record<string, any> = {}


optAccDoc.create_team_member = {
  title: "Create / Update team",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Create team member",
  comment: "For update, add team_id in the url and only include the fields you want to update in the body",
  method: "POST|PUT",
  url: "http(s)://base-url/operators/accounts/team-lists",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "email",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "first_name",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "last_name",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "phone_number",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "role_id",
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

optAccDoc.update_team_status = {
  title: "Update Team Status",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Update Team Status",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/accounts/team-lists/{{team_id}}",
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
      description: "1=active | 2=suspended",
    },
    {
      field: "suspend_reason",
      type: "String",
      status: "optional",
      description: "Required when status is 2",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAccDoc.get_team_member = {
  title: "Get team members",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Get team members",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/accounts/team-lists/{team_id}",
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
      description: "",
    },
    {
      field: "status",
      type: "String",
      status: "optional",
      description: "1=active | 2=suspended",
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
      description: "count",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAccDoc.delete_team_member = {
  title: "Delete team member",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Delete team member",
  comment: "",
  method: "DELETE",
  url: "http(s)://base-url/operators/accounts/team-lists/{{team_id}}",
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


optAccDoc.get_profile = {
  title: "Get Account",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Get Account",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/accounts",
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

optAccDoc.delete_account = {
  title: "Delete Account",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Delete Account",
  comment: "",
  method: "DELETE",
  url: "http(s)://base-url/operators/accounts",
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

optAccDoc.update_account = {
  title: "Update Account",
  header: "Header-> Authorization: Bearer token",
  sidebar: "Update Account",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/accounts",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "asset_type_ids",
      type: "Array",
      status: "optional",
      description: "Array of string. List of asset type IDs",
    },
    {
      field: "phone_number",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "business_number",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "country",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "state",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "bizcat_id",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "has_app",
      type: "String",
      status: "optional",
      description: "0 for no, 1 for yes",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optAccDoc.change_account_password = {
  title: "Change Account Password",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Change Password",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/accounts/change-password",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "old_password",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "new_password",
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


optOtherDoc.get_activity_logs = {
  title: "Get Activity Log",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Get Activity Log",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/accounts/activity-logs/{entity_id}",
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
      description: "count",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}


const RouteContainer = [
  {
    name: "Accounts",
    route: "operator",
    routes: Object.values(optAccDoc)
  },
  {
    name: "Others",
    route: "operator",
    routes: Object.values(optOtherDoc)
  },
]

export default RouteContainer