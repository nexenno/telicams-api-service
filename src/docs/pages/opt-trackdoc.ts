import { ObjectPayload } from "../../typings/general"

const optTrackDoc = {} as ObjectPayload

optTrackDoc.start_new_streams = {
  title: "Start Device Stream",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Start Stream",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/tracks/device-streams/{{vehicle_id}}?component=start",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "channel_id",
      type: "String",
      status: "required",
      description: "1 for front camera, 2 for rear camera, 3 for left camera, 4 for right camera",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optTrackDoc.stop_active_streams = {
  title: "Stop Device Stream",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Stop Stream",
  comment: "",
  method: "POST",
  url: "http(s)://base-url/operators/tracks/device-streams/{{vehicle_id}}?component=stop",
  doc_header: {
    field: "Field",
    type: "Type",
    status: "Status",
    description: "Description"
  },
  docs: [
    {
      field: "channel_id",
      type: "String",
      status: "required",
      description: "1 for front camera, 2 for rear camera, 3 for left camera, 4 for right camera",
    },
  ],
  response: `   {
      status: "ok",
      data: {}
   }`
}

optTrackDoc.device_signal = {
  title: "Get Device Signal",
  header: "Header-> Authorization: Bearer {{token}}",
  sidebar: "Device Signal",
  comment: "",
  method: "GET",
  url: "http(s)://base-url/operators/tracks/device-signals/{{vehicle_id}}",
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
    name: "Tracks & Streams",
    route: "operator",
    routes: Object.values(optTrackDoc)
  },
]
export default RouteContainer;