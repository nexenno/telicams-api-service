const userDoc: Record<string, any> = {};
const userAuthDoc: Record<string, any> = {};


userAuthDoc.start_registration = {
  title: "User signup",
  sidebar: "User signup",
  header: "Header: Bearer {token}",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/users/auths/start-signup",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "full_name",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "email",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "phone_number",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "referral_code",
      type: "String",
      status: "optional",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userAuthDoc.start_login = {
  title: "Start Login",
  sidebar: "Start Login",
  header: "Header: Bearer {{token}}",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/users/auths/start-login",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "phone_number",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "user_type",
      type: "String",
      status: "required",
      description: "user or rider",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
}

userAuthDoc.complete_start = {
  title: "complete Action",
  sidebar: "complete Action",
  header: "Header: Bearer {token}",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/users/auths/complete-start",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "otp_code",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "otp_request_id",
      type: "String",
      status: "required",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.update_account = {
  title: "Update Account",
  sidebar: "Update Account",
  header: "Header: Bearer {token}",
  comment: "",
  method: "PUT",
  url: "http(s)://base-url/users/accounts",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "full_name",
      type: "String",
      status: "optoinal",
      description: "",
    },
    {
      field: "gender",
      type: "String",
      status: "optoinal",
      description: "male | female",
    },
    {
      field: "email",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "nin_id",
      type: "String",
      status: "optional",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.getAccount = {
  title: "Get Account",
  sidebar: "Get Account",
  header: "Authorization token",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/users/accounts",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.getAccountSearch = {
  title: "Get Account by search",
  sidebar: "Get Account by search",
  header: "Authorization token",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/users/accounts/filter-user",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "email",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "phone_number",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "user_type",
      type: "String",
      status: "optional",
      description: "user, rider",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.deleteAccount = {
  title: "Delete Account",
  sidebar: "Delete Account",
  header: "Authorization token",
  comment: "",
  method: "DELETE",
  url: "http(s)://base-url/users/accounts",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [

  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.getReferrals = {
  title: "Get Referrals",
  sidebar: "Get Referrals",
  header: "Authorization token",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/users/accounts/referral",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
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
   }`,
};

userDoc.emailVerification = {
  title: "Start Email Verification",
  sidebar: "Start Email Verification",
  header: "Authorization token",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/users/accounts/start-email-verification",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "email",
      type: "String",
      status: "required",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.emailVerificationComplete = {
  title: "Complete Email Verification",
  sidebar: "Complete Email Verification",
  header: "Authorization token",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/users/accounts/complete-email-verification",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "otp_request_id",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "otp_code",
      type: "String",
      status: "required",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};


userDoc.send_notification_msg = {
  title: "Send Notification",
  sidebar: "Send Notification",
  header: "Header->Authorization Bearer {{token}}",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/user/accounts/notification",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
    {
      field: "notification_data",
      type: "String",
      status: "optional",
      description: "",
    },
    {
      field: "auth_id",
      type: "String",
      status: "optional",
      description: "",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.get_notification_msg = {
  title: "Get Notification",
  sidebar: "Get Notification",
  header: "Header->Authorization Bearer {{token}}",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/user/accounts/notification",
  doc_header: {
    field: "Query Params",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [
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
      description: "count | count-unread",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

userDoc.update_notification_msg = {
  title: "Update Notification to Read",
  sidebar: "Update Notification to Read",
  header: "Header->Authorization Bearer {{token}}",
  comment: "",
  method: "PUT",
  url: "http(s)://base-url/user/accounts/notification/{{notification_id}}",
  doc_header: {
    field: "Fields",
    type: "Type",
    status: "Status",
    description: "Description",
  },
  docs: [],
  response: `   {
      status: "ok",
      data: {}
   }`,
};

const RouteContainer = [
  {
    name: "User Service",
    route: "user",
    routes: Object.values(userDoc)
  },
  {
    name: "User Auth",
    route: "user",
    routes: Object.values(userAuthDoc)
  },
]


export default RouteContainer;
