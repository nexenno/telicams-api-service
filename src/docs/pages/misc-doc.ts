import { ObjectPayload } from "../../typings/general"

const Miscellaneous = {} as ObjectPayload

Miscellaneous.get_country_list = {
  title: "Get Country List",
  header: "",
  sidebar: "Get Country list",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/zgateway/requests/country-lists",
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

export default [
  {
    name: "Miscellaneous",
    route: "operator",
    routes: Object.values(Miscellaneous)
  },
];