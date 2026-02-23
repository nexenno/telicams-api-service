"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoose = exports.dbConn = exports.CreateDBConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.mongoose = mongoose_1.default;
const file_config_1 = require("../assets/file-config");
//create the connections
let dbConn = mongoose_1.default.createConnection(file_config_1.fileConfig.config.dbUrl);
exports.dbConn = dbConn;
const CreateDBConnection = () => {
    exports.dbConn = dbConn = mongoose_1.default.createConnection(file_config_1.fileConfig.config.dbUrl);
    //adding error listening
    dbConn.on('error', () => {
        console.log('App database error occurred at ' + new Date());
    });
    //adding connection listening
    dbConn.on('open', () => {
        console.log('App database Connected at ' + new Date());
    });
};
exports.CreateDBConnection = CreateDBConnection;
