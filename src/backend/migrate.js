const fs = require("fs")
const path = require("path")
const sqlite3 = require("sqlite3").verbose()

const dbFile = "testdb.sqlite3"
const db = new sqlite3.Database(dbFile)

const command = process.argv[2]
const id = process.argv[3]

const folder = path.join("migrations", id)

const upFile = path.join(folder, "up.sql")
const downFile = path.join(folder, "down.sql")

if (!fs.existsSync(folder)) {
  console.error("Migration not found: " + id)
  return -1
}

switch (command) {
  case "up":
    upAsync().then()
    break
  case "down":
    downAsync().then()
    break
  case "redo":
    redo()
    break
  default:
    console.error("Command not found: " + command)
    return -2
}

async function runAsync(file) {

  if (!fs.existsSync(file)) {
    console.error(`No file ${file} in migration`)
    throw Error("Not found")
  }
  console.log(`Running ${file}`)
  const script = fs.readFileSync(file).toString()
  const subscripts = script.split(";")
  const promises = subscripts.map((subscript) => {
    return new Promise((resolve, reject) => {
      db.run(subscript, (res, err) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  })
  let i = 1
  for (let promise of promises) {
    console.log(`Running query #${i++}`)
    await promise
  }
}

function upAsync() {
  return runAsync(upFile)
}

function downAsync() {
  return runAsync(downFile)
}

function redo() {
  downAsync()
    .then(upAsync)
}