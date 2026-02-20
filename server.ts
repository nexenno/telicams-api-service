import { CreateSimpleJsHttpServer, SetBodyParser, SimpleJsSecurityPlugin } from "@increase21/simplenodejs";
import { SetDocumentationMiddleware, SetJWTAuthMiddleware } from "./sauth"
import { fileConfig } from "./src/assets/file-config";

const app = CreateSimpleJsHttpServer({ controllersDir: __dirname + "/src/controllers" })

app.setTimeout(30000) //timeout after 30seconds

app.registerPlugin(app => SimpleJsSecurityPlugin(app, {
  cors: {},
  helmet: {
    csp: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'"
    ].join("; ")
  }
}))

// app.use(SetDocumentationMiddleware())
// app.use(SetJWTAuthMiddleware())
app.use(SetBodyParser({ limit: "10mb" }))
app.useError((err, req, res) => {
  !err.code && console.log(err)
  if (res.headersSent) return
  res.status(err.code || 503).json({
    error: err.code ? err.message : "Service unavailable at the moment",
    code: err.code || 503,
  })
})

app.listen(fileConfig.port, () => {
  console.log("Koova User Service running on port " + fileConfig.port)
})
