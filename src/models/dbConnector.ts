import mongoose, { InferSchemaType } from "mongoose"
import { fileConfig } from "../assets/file-config";

//create the connections
let dbConn = mongoose.createConnection(fileConfig.config.dbUrl)

export const CreateDBConnection = () => {
   dbConn = mongoose.createConnection(fileConfig.config.dbUrl)
   //adding error listening
   dbConn.on('error', () => {
      console.log('App database error occurred at ' + new Date());
   });

   //adding connection listening
   dbConn.on('open', () => {
      console.log('App database Connected at ' + new Date());
   });
}

type tableID = { _id: mongoose.Types.ObjectId }

export { dbConn, InferSchemaType, tableID, mongoose }