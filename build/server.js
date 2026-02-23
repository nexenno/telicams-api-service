"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simplenodejs_1 = require("@increase21/simplenodejs");
const sauth_1 = require("./sauth");
const file_config_1 = require("./src/assets/file-config");
const app = (0, simplenodejs_1.CreateSimpleJsHttpServer)({ controllersDir: __dirname + "/src/controllers" });
app.setTimeout(30000); //timeout after 30seconds
app.registerPlugin(app => (0, simplenodejs_1.SimpleJsSecurityPlugin)(app, {
    cors: {},
    helmet: {
        csp: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'"
        ].join("; ")
    }
}));
app.use((0, sauth_1.SetDocumentationMiddleware)());
app.use((0, sauth_1.SetJWTAuthMiddleware)());
app.use((0, simplenodejs_1.SetBodyParser)({ limit: "10mb" }));
app.useError((err, req, res) => {
    console.log(err);
    !err.code && console.log(err);
    if (res.headersSent)
        return;
    res.status(err.code || 503).json({
        error: err.code ? err.message : "Service unavailable at the moment",
        code: err.code || 503,
    });
});
app.listen(file_config_1.fileConfig.port, () => {
    console.log("Koova User Service running on port " + file_config_1.fileConfig.port);
});
