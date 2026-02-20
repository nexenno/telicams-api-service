import JWT from "jsonwebtoken"
import { SimpleJsMiddleware } from "@increase21/simplenodejs"
import { fileConfig } from "./src/assets/file-config"
import helpers from "./src/assets/helpers"
import { JWTTokenPayload } from "./src/typings/general"
import fs from "node:fs"

export const SetDocumentationMiddleware = (): SimpleJsMiddleware => {
  return (req, res, next) => {
    const endpointParts = req._end_point_path || []
    //for loading documentation
    if (endpointParts.length <= 1 && req.method === "GET") {
      //if the user is live
      if (fileConfig.config.env === "live") {
        res.setHeader("Content-Type", "text/plain")
        res.end()
        return
      }
      let checkFile = fs.existsSync(__dirname + '/src/docs')
      const fileData = checkFile ? require(__dirname + "/src/docs").default : "<div></div>"
      res.setHeader("Content-Type", "text/html")
      res.end(fileData)
      return
    }
    return next()
  }
}

export const SetJWTAuthMiddleware = (): SimpleJsMiddleware => {
  return (req, res, next) => {

    //check if required authentication is reuired
    let checkPath = fileConfig.noAuth ? fileConfig.noAuth.find(e => new RegExp(`^${e}`).test(req.url as string)) : null
    if (checkPath) return next()
    // RUN AUTHENTICATION
    let header = req.headers.authorization
    // if there's no auth
    if (!header) return helpers.outputError(res, 401)
    if (!header.match(/^Bearer /)) return helpers.outputError(res, 401)

    //check the database here
    let token = header.substring(7)
    let checkUser: JWTTokenPayload
    //verify the token
    try {
      checkUser = JWT.verify(token, fileConfig.config.jwtSecret) as JWTTokenPayload
    } catch (e) {
      return helpers.outputError(res, 401)
    }
    //if there's not token
    if (!checkUser || !checkUser.auth_id || !checkUser.user_type) {
      return helpers.outputError(res, 401)
    }
    //@ts-ignore
    req._custom_data = checkUser

    return next()
  }
}