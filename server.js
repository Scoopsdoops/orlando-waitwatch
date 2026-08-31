const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const PARKS = [
  { id: 6, name: "Magic Kingdom", emoji: "🏰" },
  { id: 5, name: "EPCOT", emoji: "🌐" },
  { id: 7, name: "Hollywood Studios", emoji: "🎬" },
  { id: 8, name: "Animal Kingdom", emoji: "🦁" },
  { id: 64, name: "Islands of Adventure", emoji: "🦖" },
  { id: 65, name: "Universal Studios", emoji: "🎬" },
  { id: 66, name: "Volcano Bay", emoji: "🌋" },
  { id: 67, name: "Epic Universe", emoji: "🌌" },
  { id: 21, name: "SeaWorld Orlando", emoji: "🐬" },
  { id: 23, name: "Aquatica Orlando", emoji: "💦" },
  { id: 28, name: "LEGOLAND Florida", emoji: "🧱" },
  { id: 316, name: "Peppa Pig Theme Park", emoji: "🐷" }
];

function getJSON(url) {
  return new Promise((resolve, reject) => {

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "OrlandoWaitWatch/1.0",
          "Accept": "application/json"
        }
      },
      response => {

        let body = "";

        response.setEncoding("utf8");

        response.on("data", chunk => {
          body += chunk;
        });

        response.on("end", () => {

          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(
                `Queue-Times returned HTTP ${response.statusCode}`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("Queue-Times returned invalid JSON"));
          }

        });

      }
    );

    request.setTimeout(15000, () => {
      request.destroy(new Error("Request timed out"));
    });

    request.on("error", reject);

  });
}


function convertPark(park, data) {

  const rides = [];

  if (Array.isArray(data.lands)) {

    for (const land of data.lands) {

      if (!Array.isArray(land.rides)) continue;

      for (const ride of land.rides) {

        rides.push({
          id: ride.id,
          name: ride.name,
          is_open: ride.is_open === true,
          wait_time: Number(ride.wait_time) || 0,
          last_updated: ride.last_updated || null,
          land: land.name || "Attraction"
        });

      }

    }

  }


  if (Array.isArray(data.rides)) {

    for (const ride of data.rides) {

      rides.push({
        id: ride.id,
        name: ride.name,
        is_open: ride.is_open === true,
        wait_time: Number(ride.wait_time) || 0,
        last_updated: ride.last_updated || null,
        land: "Attraction"
      });

    }

  }


  const unique = [];
  const seen = new Set();

  for (const ride of rides) {

    const key = `${ride.id}-${ride.name}`;

    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(ride);

  }


  return {
    ...park,
    success: true,
    rides: unique
  };

}


async function getPark(park) {

  const url =
    `https://queue-times.com/parks/${park.id}/queue_times.json`;

  try {

    console.log(`Getting ${park.name}...`);

    const data = await getJSON(url);

    return convertPark(park, data);

  } catch (error) {

    console.log(
      `Could not get ${park.name}: ${error.message}`
    );

    return {
      ...park,
      success: false,
      rides: [],
      error: error.message
    };

  }

}


async function getAllParks() {

  const parks = await Promise.all(
    PARKS.map(getPark)
  );

  return {
    generated_at: new Date().toISOString(),
    parks
  };

}


const server = http.createServer(async (request, response) => {

  const url = new URL(
    request.url,
    `http://localhost:${PORT}`
  );


  /*
   * LIVE DATA API
   */

  if (url.pathname === "/api/parks") {

    try {

      const data = await getAllParks();

      response.writeHead(
        200,
        {
          "Content-Type":
            "application/json; charset=utf-8",

          "Cache-Control":
            "no-store"
        }
      );

      response.end(
        JSON.stringify(data)
      );

    } catch (error) {

      response.writeHead(
        500,
        {
          "Content-Type":
            "application/json"
        }
      );

      response.end(
        JSON.stringify({
          error: error.message
        })
      );

    }

    return;

  }


  /*
   * WEBSITE
   */

  let requestedFile =
    url.pathname === "/"
      ? "index.html"
      : url.pathname.substring(1);


  const filePath =
    path.join(__dirname, requestedFile);


  if (!filePath.startsWith(__dirname)) {

    response.writeHead(403);
    response.end("Forbidden");

    return;

  }


  fs.readFile(
    filePath,
    (error, data) => {

      if (error) {

        response.writeHead(
          404,
          {
            "Content-Type":
              "text/plain"
          }
        );

        response.end(
          "File not found"
        );

        return;

      }


      const extension =
        path.extname(filePath);


      const contentTypes = {

        ".html":
          "text/html; charset=utf-8",

        ".css":
          "text/css; charset=utf-8",

        ".js":
          "text/javascript; charset=utf-8",

        ".json":
          "application/json"

      };


      response.writeHead(
        200,
        {
          "Content-Type":
            contentTypes[extension] ||
            "application/octet-stream"
        }
      );


      response.end(data);

    }
  );

});


server.listen(
  PORT,
  () => {

    console.log("");
    console.log("==============================");
    console.log(" ORLANDO WAITWATCH");
    console.log("==============================");
    console.log("");
    console.log(
      `Website: http://localhost:${PORT}`
    );
    console.log("");
    console.log(
      "Keep this window open while using the website."
    );
    console.log("");

  }
);