const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server Running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const query = `select * from state;`;
  const dbResponse = await db.all(query);
  let result = [];
  dbResponse.forEach((element) => {
    const { state_id, state_name, population } = element;
    let obj = {
      stateId: state_id,
      stateName: state_name,
      population: population,
    };
    result.push(obj);
  });
  response.send(result);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `select * from state where state_id=${stateId};`;

  let dbResponse = await db.get(query);
  const { state_id, state_name, population } = dbResponse;
  let obj = {
    stateId: state_id,
    stateName: state_name,
    population: population,
  };
  response.send(obj);
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const query = `
  insert into
   district (district_name, state_id, cases, cured, active, deaths)
   values
   (
       '${districtName}',
       ${stateId},
       ${cases},
       ${cured},
       ${active},
       ${deaths}
    );`;

  await db.run(query);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `select * from district where district_id=${districtId};`;

  let dbResponse = await db.get(query);
  const {
    district_id,
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths,
  } = dbResponse;
  let obj = {
    districtId: district_id,
    districtName: district_name,
    stateId: state_id,
    cases: cases,
    cured: cured,
    active: active,
    deaths: deaths,
  };
  response.send(obj);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `delete from district where district_id=${districtId}`;
  await db.run(query);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const query = `
  update
   district 
  set 
  district_name='${districtName}',
   state_id=${stateId},
    cases=${cases},
     cured=${cured},
      active=${active}, 
    deaths=${deaths} 
    where district_id=${districtId}
  ;`;

  await db.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const query = `select sum(cases) as totalCases,
  sum(cured) as totalCured,
  sum(active) as totalActive, 
  sum(deaths) as totalDeaths 
  from district 
  where state_id=${stateId};
  ;`;
  const dbResponse = await db.get(query);

  response.send(dbResponse);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const query = `select state_name from state where state_id=
  (select state_id from district where district_id=${districtId})
  ;`;
  const dbResponse = await db.get(query);
  let { state_name } = dbResponse;
  let obj = {
    stateName: state_name,
  };

  response.send(obj);
});

module.exports = app;
