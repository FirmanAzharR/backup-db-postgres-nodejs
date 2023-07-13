const { execute } = require("@getvim/execute");
const compress = require("gzipme");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const cron = require("node-cron");

const dotenv = require("dotenv");
dotenv.config();

const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const database = process.env.DB_NAME;
const port = process.env.PORT;

const date = new Date();

const currentDate = `${date.getFullYear()}.${
  date.getMonth() + 1
}.${date.getDate()}.${date.getHours()}.${date.getMinutes()}`;
const fileName = `database-backup-${currentDate}.tar`;
const fileNameGzip = `${fileName}.tar.gz`;

function backup() {
  execute(
    `pg_dump -U ${username} -p ${port} -d ${database} -f ${fileName} -F t`
  )
    .then(async () => {
      await compress(fileName);
      fs.unlinkSync(fileName);
      console.log("Finito");
    })
    .catch((err) => {
      console.log(err);
    });
}

function backupNew() {
  const backupPath = "./";
const command1 = `pg_dump -U ${username} -W ${password} -p ${port} -d ${database} -f ${backupPath}`
const command2 = `pg_dump postgres://firman:admin123@localhost:5432/tollaut_local_offline -f ${backupPath}`
  exec(
    command1,
    (error, stdout, stderr) => {
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
    .post("http://my.backupserver.org/private", form, {
      headers: form.getHeaders(),
    })
    .then((result) => {
      // Handle result…
      console.log(result.data);
      fs.unlinkSync(fileNameGzip);
    })
    .catch((err) => {
      // log error, send it to sentry... etc
      console.error(err);
    });
}

function startSchedule() {
  cron.schedule(
    "*/1 * * * *",
    () => {
    //   backup();
    backupNew()
    },
    {}
  );
}

module.exports = {
  startSchedule,
};
