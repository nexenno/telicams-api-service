import fs from 'fs';

export const fileConfig = {
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
  ]
}

//the environment working on
fileConfig.config.env = __dirname.includes("home/servicelist/node-proxyapi") ? "live" : "staging"
// fileConfig.config.env = "local"
fileConfig.port = fileConfig.config.env === "live" ? 8000 : 8081


//load live credentials up
if (fileConfig.config.env === "live") {
  try {
    let smKeys: any = fs.readFileSync(`/home/servicelist/.credFolder/pmpCred.json`, 'utf-8')
    smKeys = smKeys ? JSON.parse(smKeys) : {}
    //add the live keys
    fileConfig.cred.live = (smKeys && smKeys.cred && smKeys.cred.live) ? smKeys.cred.live : {}
    fileConfig.config = { ...fileConfig.config, ...smKeys.config }
  } catch (e) {
    console.log("error getting keys", e)
  }
}

// the database url to connect
fileConfig.config.dbUrl = fileConfig.config.env === "local" ? `mongodb://${fileConfig.cred.local.host}:${fileConfig.cred.local.port}/${fileConfig.cred.local.dbName}?retryWrites=true&w=majority` :
  fileConfig.config.env === "staging" ? `mongodb+srv://${fileConfig.cred.staging.user}:${fileConfig.cred.staging.pass}@${fileConfig.cred.staging.host}/${fileConfig.cred.staging.dbName}?authSource=admin&readPreference=primary&retryWrites=true&w=majority` :
    `mongodb+srv://${fileConfig.cred.live.user}:${fileConfig.cred.live.pass}@${fileConfig.cred.live.host}/${fileConfig.cred.live.dbName}?authSource=admin&readPreference=primary&retryWrites=true&w=majority`