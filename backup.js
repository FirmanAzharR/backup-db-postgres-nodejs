const { execute } = require("@getvim/execute");
const compress = require("gzipme");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const cron = require("node-cron");
const {exec} = require('child_process')

const dotenv = require("dotenv");
dotenv.config();

const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const database = process.env.DB_NAME;
const port = process.env.DB_PORT;
const host = process.env.DB_HOST;


const date = new Date();

const currentDate = `${date.getFullYear()}.${
  date.getMonth() + 1
}.${date.getDate()}.${date.getHours()}.${date.getMinutes()}`;
const fileName = `./database-backup/database-backup-${currentDate}.tar`;
const fileNameGzip = `${fileName}.tar.gz`;

function backupDatabase() {
  execute(
    `pg_dump -U ${username} -p ${port} -d ${database} -f ${fileName} -F t`
  )
    .then(async () => {
      await compress(fileName);
      fs.unlinkSync(fileName);
      console.log("Backup Successfully");
    })
    .catch((err) => {
      console.log(err);
    });
}

function backupDatabaseAlternative() {
const backupPath = `./database-backup/${currentDate}.sql`;
const command = `pg_dump -U ${username} -W ${password} -p ${port} -d ${database} -f ${backupPath}`
const command2 = `pg_dump postgres://${username}:${password}@${host}:${port}/${database} -f ${backupPath}`

  exec(
    command2,
    async (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup failed: ${error.message}`);
      } else {
        console.log("Backup completed successfully");
      }
    }
  );
}

function restore() {
  execute(`pg_restore -cC -d ${database} ${fileNameGzip}`)
    .then(async () => {
      console.log("Restored");
    })
    .catch((err) => {
      console.log(err);
    });
}

function sendToBackupServer(fileName = fileNameGzip) {
  const form = new FormData();
  form.append("file", fileName);
  axios
    .post("server private backup ex: http://mybackup.com", form, {
      headers: form.getHeaders(),
    })
    .then((result) => {
      console.log(result.data);
      fs.unlinkSync(fileNameGzip);
    })
    .catch((err) => {
      console.error(err);
    });
}

function startSchedule() {
  //every day at 16:00
  cron.schedule(
    "0 16 * * *",
    () => {
      backupDatabase()
      // backupDatabaseAlternative()
    }
  );
}

module.exports = {
  startSchedule,
};
