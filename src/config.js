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
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL
}

export default config;