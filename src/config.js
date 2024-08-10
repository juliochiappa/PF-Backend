import path from 'path';
import {Command} from 'commander';
import dotenv from 'dotenv';


//Parseo de variables de líneas de comando
const commandLine = new Command();
commandLine
      .option('--mode <mode>')
      .option('--port <port>')
commandLine.parse();
const clOptions = commandLine.opts();

//Parseo de variables de entorno
dotenv.config({ path: clOptions.mode === 'prod' ? '.env.prod' : '.env.devel' });
//dotenv.config(); //Se utiliza para .env solamente y lo toma por defecto

const config = {
  APP_NAME: 'coder_53160_be',
  SERVER: 'atlas',
  PORT: process.env.PORT || clOptions.port || 8080,
  //DIRNAME: url.fileURLToPath(new URL('.', import.meta.url)),
  DIRNAME: path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/, '$1')),
  get UPLOAD_DIR() { return `${this.DIRNAME}/public/img` },
  MONGODB_ID_REGEX: /^[a-fA-F0-9]{24}$/,
  MONGODB_URI: process.env.MONGODB_URI,
  PRODUCTS_PER_PAGE: 5,
  SECRET: process.env.SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
  MODE: 'dev',
  GMAIL_APP_USER: 'juliochiappa43@gmail.com',
  GMAIL_APP_PASS: process.env.GMAIL_APP_PASS,
  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_TOKEN: process.env.TWILIO_TOKEN,
  TWILIO_PHONE: process.env.TWILIO_PHONE
}

export const errorsDictionary = {
  UNHANDLED_ERROR: { code: 0, status: 500, message: 'Error no identificado' },
  ROUTING_ERROR: { code: 1, status: 404, message: 'No se encuentra el endpoint solicitado' },
  FEW_PARAMETERS: { code: 2, status: 400, message: 'Faltan parámetros obligatorios o se enviaron vacíos' },
  INVALID_MONGOID_FORMAT: { code: 3, status: 400, message: 'El ID no contiene un formato válido de MongoDB' },
  INVALID_PARAMETER: { code: 4, status: 400, message: 'El parámetro ingresado no es válido' },
  INVALID_TYPE_ERROR: { code: 5, status: 400, message: 'No corresponde el tipo de dato' },
  ID_NOT_FOUND: { code: 6, status: 400, message: 'No existe registro con ese ID' },
  PAGE_NOT_FOUND: { code: 7, status: 404, message: 'No se encuentra la página solicitada' },
  DATABASE_ERROR: { code: 8, status: 500, message: 'No se puede conectar a la base de datos' },
  INTERNAL_ERROR: { code: 9, status: 500, message: 'Error interno de ejecución del servidor' },
  RECORD_CREATION_ERROR: { code: 10, status: 500, message: 'Error al intentar crear el registro' },    
  RECORD_CREATION_OK: { code: 11, status: 200, message: 'Registro creado' }
}


export default config;