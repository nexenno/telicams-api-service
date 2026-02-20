const operatorAuthDoc: Record<string, any> = {}

operatorAuthDoc.register_account = {
  title: "Register Account",
  header: "Header-> Authorization: Bearer token",
  sidebar: "Register Account",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/auths/register",
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
      field: "password",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "business_name",
      type: "String",
      status: "required",
      description: "",
    },

    {
      field: "business_type",
      type: "String",
      status: "required",
      description: "1=Individual, 2=Company",
    },
    {
      field: "country",
      type: "String",
      status: "required",
      description: "",
    },
    {
      field: "fleet_size",
      type: "String",
      status: "required",
      description: "Estimated number of devices;",
    },
    {
      field: "state",
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
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

operatorAuthDoc.login_account = {
  title: "Login to Account",
  header: "Header-> Authorization: Bearer token",
  sidebar: "Login Account",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/auths/login",
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
      field: "password",
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

operatorAuthDoc.forgot_password = {
  title: "Forgot Password Request",
  header: "Header-> Authorization: Bearer token",
  sidebar: "Forgot Password",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/auths/forgot-password",
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
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

operatorAuthDoc.password_reset = {
  title: "Password Set/Reset",
  header: "Header-> Authorization: Bearer token",
  sidebar: "Set New Password",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/auths/reset-assword",
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
      field: "otp_code",
      type: "String",
      status: "required",
      description: "Otp sent to the email during forgot password request",
    },
    {
      field: "new_password",
      type: "String",
      status: "required",
      description: "The new password to set. Must be 6 characters or more, include a number, lowercase, and uppercase letter",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

operatorAuthDoc.confirm_otpcode = {
  title: "Confirm OTP for Password Reset",
  header: "Header-> Authorization: Bearer token",
  sidebar: "Confirm OTP",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/auths/confirm-otp",
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
      field: "otp_code",
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

const RouteContainer = [
  {
    name: "Authentication",
    route: "operator",
    routes: Object.values(operatorAuthDoc)
  },
]
export default RouteContainer;