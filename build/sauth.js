"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetJWTAuthMiddleware = exports.SetDocumentationMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const file_config_1 = require("./src/assets/file-config");
const helpers_1 = __importDefault(require("./src/assets/helpers"));
const node_fs_1 = __importDefault(require("node:fs"));
const SetDocumentationMiddleware = () => {
    return (req, res, next) => {
        const endpointParts = req._end_point_path || [];
        //for loading documentation
        if (endpointParts.length <= 1 && req.method === "GET") {
            //if the user is live
            if (file_config_1.fileConfig.config.env === "live") {
                res.setHeader("Content-Type", "text/plain");
                res.end();
                return;
            }
            let checkFile = node_fs_1.default.existsSync(__dirname + '/src/docs');
            const fileData = checkFile ? require(__dirname + "/src/docs").default : "<div></div>";
            res.setHeader("Content-Type", "text/html");
            res.end(fileData);
            return;
        }
        return next();
    };
};
exports.SetDocumentationMiddleware = SetDocumentationMiddleware;
const SetJWTAuthMiddleware = () => {
    return (req, res, next) => {
        //check if required authentication is reuired
        let checkPath = file_config_1.fileConfig.noAuth ? file_config_1.fileConfig.noAuth.find(e => new RegExp(`^${e}`).test(req.url)) : null;
        if (checkPath)
            return next();
        // RUN AUTHENTICATION
        let header = req.headers.authorization;
        // if there's no auth
        if (!header)
            return helpers_1.default.outputError(res, 401);
        if (!header.match(/^Bearer /))
            return helpers_1.default.outputError(res, 401);
        //check the database here
        let token = header.substring(7);
        let checkUser;
        //verify the token
        try {
            checkUser = jsonwebtoken_1.default.verify(token, file_config_1.fileConfig.config.jwtSecret);
        }
        catch (e) {
            return helpers_1.default.outputError(res, 401);
        }
        //if there's not token
        if (!checkUser || !checkUser.auth_id || !checkUser.user_type) {
            return helpers_1.default.outputError(res, 401);
        }
        //@ts-ignore
        req._custom_data = checkUser;
        return next();
    };
};
exports.SetJWTAuthMiddleware = SetJWTAuthMiddleware;
