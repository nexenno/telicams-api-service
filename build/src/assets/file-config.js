"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileConfig = void 0;
const fs_1 = __importDefault(require("fs"));
exports.fileConfig = {
    cred: {
        local: {
            user: "",
            pass: "",
            host: "localhost",
            port: "27017",
            dbName: "koova_db"
        },
        staging: {
            user: "increase_21",
            pass: "QRudhu0Fsw0b166S",
            host: "cluster0-mszft.mongodb.net",
            port: "27017",
            dbName: "telicams_test_db"
        },
        live: {
            user: "",
            pass: "",
            host: "",
            port: "",
            dbName: ""
        }
    },
    config: {
        env: 'local',
        dbUrl: '',
        jwtSecret: '2a4b16a1c3b7d8e9f8c3e1bc0d7e5e4c2f7f9a3d9d6af4b09d4f2ac2c84e9fb7',
        gatewaySecret: "e9f8c3e18f7f9a3d9d6af4b0a2a4b16e94f7dac23b7d8f4b099d4f2ac2cd6d4f2b7ac2c87e59d4f2cd69e4c2f7f9a3d",
        superAdminAccount: {
            user: "superadmin@koova.ng",
            pass: "yu&5gK8789nhjk"
        },
    },
    port: 8000,
    noAuth: [
        "/zgateway/hooks/",
        "/operators/auths/",
        "/zgateway/requests/",
    ]
};
//the environment working on
exports.fileConfig.config.env = __dirname.includes("home/servicelist/node-proxyapi") ? "live" : "staging";
// fileConfig.config.env = "local"
exports.fileConfig.port = exports.fileConfig.config.env === "live" ? 8000 : 8081;
//load live credentials up
if (exports.fileConfig.config.env === "live") {
    try {
        let smKeys = fs_1.default.readFileSync(`/home/servicelist/.credFolder/pmpCred.json`, 'utf-8');
        smKeys = smKeys ? JSON.parse(smKeys) : {};
        //add the live keys
        exports.fileConfig.cred.live = (smKeys && smKeys.cred && smKeys.cred.live) ? smKeys.cred.live : {};
        exports.fileConfig.config = { ...exports.fileConfig.config, ...smKeys.config };
    }
    catch (e) {
        console.log("error getting keys", e);
    }
}
// the database url to connect
exports.fileConfig.config.dbUrl = exports.fileConfig.config.env === "local" ? `mongodb://${exports.fileConfig.cred.local.host}:${exports.fileConfig.cred.local.port}/${exports.fileConfig.cred.local.dbName}?retryWrites=true&w=majority` :
    exports.fileConfig.config.env === "staging" ? `mongodb+srv://${exports.fileConfig.cred.staging.user}:${exports.fileConfig.cred.staging.pass}@${exports.fileConfig.cred.staging.host}/${exports.fileConfig.cred.staging.dbName}?authSource=admin&readPreference=primary&retryWrites=true&w=majority` :
        `mongodb+srv://${exports.fileConfig.cred.live.user}:${exports.fileConfig.cred.live.pass}@${exports.fileConfig.cred.live.host}/${exports.fileConfig.cred.live.dbName}?authSource=admin&readPreference=primary&retryWrites=true&w=majority`;
