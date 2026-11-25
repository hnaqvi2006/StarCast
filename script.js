const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const locationButton = document.getElementById("location-button");
const statusText = document.getElementById("status");
const results = document.getElementById("results");

const saveSpotForm = document.getElementById("save-spot-form");
const spotNameInput = document.getElementById("spot-name");
const spotMessage = document.getElementById("spot-message");
const spotsList = document.getElementById("spots-list");
const spotOptions = document.getElementById("spot-options");

const logForm = document.getElementById("log-form");
const logObject = document.getElementById("log-object");
const logSpot = document.getElementById("log-spot");
const logDate = document.getElementById("log-date");
const logRating = document.getElementById("log-rating");
const logNotes = document.getElementById("log-notes");
const logMessage = document.getElementById("log-message");
const logCount = document.getElementById("log-count");
const logList = document.getElementById("log-list");

let currentPlace = null;

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (city === "") {
    showStatus("Type a city first.", true);
    return;
  }

  showStatus("Looking up " + city + "...");

  try {
    const place = await findCity(city);

    if (place === null) {
      showStatus("City not found. Check the spelling and try again.", true);
      return;
    }

    await loadForecast(place);
  } catch (error) {
    console.error(error);
    showStatus("Something went wrong. Please try again.", true);
  }
});

locationButton.addEventListener("click", function () {
  if (!navigator.geolocation) {
    showStatus("Your browser can't share your location. Search a city instead.", true);
    return;
  }

  showStatus("Finding your location...");

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const place = {
        name: "My location",
        latitude: Number(position.coords.latitude.toFixed(4)),
        longitude: Number(position.coords.longitude.toFixed(4))
      };
      cityInput.value = "";
      loadForecast(place);
    },
    function () {
      showStatus("Location access was blocked. Search a city instead.", true);
    }
  );
});

async function findCity(city) {
  const url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const data = await response.json();
  console.log("Geocoding data:", data);

  if (!data.results) {
    return null;
  }

  const result = data.results[0];
  let region = result.country;
  if (result.admin1) {
    region = result.admin1;
  }

  return {
    name: result.name + ", " + region,
    latitude: result.latitude,
    longitude: result.longitude
  };
}

async function loadForecast(place) {
  showStatus("Checking the sky over " + place.name + "...");

  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude +
    "&longitude=" + place.longitude +
    "&hourly=cloud_cover,temperature_2m&daily=sunset" +
    "&temperature_unit=fahrenheit&timezone=auto&forecast_days=8";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Forecast request failed");
    }

    const weather = await response.json();
    console.log("Weather data:", weather);

    const nights = buildNights(weather);

    currentPlace = place;
    showTonight(place, nights[0]);
    showHourly(weather);
    showWeek(nights);

    spotNameInput.value = place.name;
    spotMessage.textContent = "";
    localStorage.setItem("lastPlace", JSON.stringify(place));

    showStatus("");
    results.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    showStatus("Couldn't load the forecast. Please try again.", true);
  }
}

function buildNights(weather) {
  const nights = [];

  for (let i = 0; i < 7; i++) {
    const date = weather.daily.time[i];
    const nextDate = weather.daily.time[i + 1];
    const darkHours = [
      date + "T21:00", date + "T22:00", date + "T23:00",
      nextDate + "T00:00", nextDate + "T01:00", nextDate + "T02:00"
    ];

    let total = 0;
    let count = 0;

    for (const hour of darkHours) {
      const index = weather.hourly.time.indexOf(hour);
      if (index !== -1) {
        total = total + weather.hourly.cloud_cover[index];
        count = count + 1;
      }
    }

    const clouds = Math.round(total / count);
    const moon = getMoonInfo(new Date(date + "T22:00"));
    const tenPm = weather.hourly.time.indexOf(date + "T22:00");

    nights.push({
      date: date,
      clouds: clouds,
      moon: moon,
      score: getSkyScore(clouds, moon.illumination),
      sunset: weather.daily.sunset[i],
      temp: weather.hourly.temperature_2m[tenPm]
    });
  }

  return nights;
}

function getSkyScore(clouds, moonlight) {
  const score = 100 - clouds * 0.7 - moonlight * 0.3;
  return Math.round(score);
}

function getRating(score) {
  if (score >= 70) {
    return "good";
  } else if (score >= 40) {
    return "okay";
  }
  return "bad";
}

function showTonight(place, tonight) {
  const sunset = new Date(tonight.sunset);
  const verdict = document.getElementById("verdict");
  const rating = getRating(tonight.score);

  document.getElementById("location").textContent = place.name;
  document.getElementById("score").textContent = tonight.score + " / 100";
  document.getElementById("clouds").textContent = tonight.clouds + "%";
  document.getElementById("temp").textContent = Math.round(tonight.temp) + "°F";
  document.getElementById("sunset").textContent = sunset.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  document.getElementById("moon").textContent =
    tonight.moon.icon + " " + tonight.moon.name + ", " + tonight.moon.illumination + "% lit";

  if (rating === "good") {
    verdict.textContent = "Great night for stargazing!";
  } else if (rating === "okay") {
    verdict.textContent = "Fair night. You'll catch bright stars and planets.";
  } else if (tonight.clouds > 60) {
    verdict.textContent = "Too cloudy tonight. Check the week below.";
  } else {
    verdict.textContent = "The moon is too bright for faint stars tonight.";
  }

  verdict.className = rating;
}

function showHourly(weather) {
  const hourly = document.getElementById("hourly");
  hourly.innerHTML = "";

  const start = weather.hourly.time.indexOf(weather.daily.time[0] + "T18:00");

  for (let i = start; i < start + 12; i++) {
    const clouds = weather.hourly.cloud_cover[i];
    const hourNumber = Number(weather.hourly.time[i].slice(11, 13));
    const hour = formatHour(hourNumber);

    const column = document.createElement("div");
    column.className = "hour";
    column.title = hour + ": " + clouds + "% clouds";

    const value = document.createElement("span");
    value.className = "hour-value";
    value.textContent = clouds + "%";

    const track = document.createElement("div");
    track.className = "bar-track";

    let barHeight = clouds;
    if (barHeight < 3) {
      barHeight = 3;
    }

    const bar = document.createElement("div");
    bar.className = "bar " + getCloudLevel(clouds);
    bar.style.height = barHeight + "%";

    const label = document.createElement("span");
    label.className = "hour-label";
    label.textContent = hour;

    track.appendChild(bar);
    column.append(value, track, label);
    hourly.appendChild(column);
  }
}

function formatHour(hourNumber) {
  if (hourNumber === 0) {
    return "12a";
  } else if (hourNumber < 12) {
    return hourNumber + "a";
  } else if (hourNumber === 12) {
    return "12p";
  }
  return (hourNumber - 12) + "p";
}

function getCloudLevel(clouds) {
  if (clouds <= 20) {
    return "clear";
  } else if (clouds <= 60) {
    return "partly";
  }
  return "cloudy";
}

function showWeek(nights) {
  const week = document.getElementById("week");
  week.innerHTML = "";

  let bestIndex = 0;
  for (let i = 1; i < nights.length; i++) {
    if (nights[i].score > nights[bestIndex].score) {
      bestIndex = i;
    }
  }

  nights.forEach(function (night, index) {
    const date = new Date(night.date + "T12:00");

    const card = document.createElement("div");
    card.className = "night " + getRating(night.score);
    if (index === bestIndex) {
      card.classList.add("best");
    }

    const day = document.createElement("p");
    day.className = "day";
    if (index === 0) {
      day.textContent = "Tonight";
    } else {
      day.textContent = date.toLocaleDateString([], { weekday: "short" });
    }

    const shortDate = document.createElement("p");
    shortDate.className = "short-date";
    shortDate.textContent = date.toLocaleDateString([], { month: "short", day: "numeric" });

    const score = document.createElement("p");
    score.className = "night-score";
    score.textContent = night.score;

    const details = document.createElement("p");
    details.className = "night-details";
    details.textContent = night.moon.icon + " " + night.clouds + "% clouds";

    card.append(day, shortDate, score, details);

    if (index === bestIndex) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "Best night";
      card.prepend(badge);
    }

    week.appendChild(card);
  });
}

saveSpotForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const name = spotNameInput.value.trim();

  if (currentPlace === null) {
    return;
  }

  if (name === "") {
    showMessage(spotMessage, "Give this spot a name first.", true);
    return;
  }

  try {
    await addSpot(name, currentPlace.latitude, currentPlace.longitude);
    showMessage(spotMessage, "Saved " + name + " to your spots.", false);
    loadSpots();
  } catch (error) {
    console.error(error);
    showMessage(spotMessage, "Couldn't save this spot. Please try again.", true);
  }
});

async function loadSpots() {
  try {
    const spots = await getSpots();
    spotsList.innerHTML = "";
    spotOptions.innerHTML = "";

    if (spots.length === 0) {
      spotsList.innerHTML = "<li class='empty'>No saved spots yet. Search a place and save it.</li>";
      return;
    }

    for (const spot of spots) {
      const item = document.createElement("li");

      const openButton = document.createElement("button");
      openButton.className = "spot-name";
      openButton.textContent = spot.name;
      openButton.addEventListener("click", function () {
        cityInput.value = "";
        loadForecast({ name: spot.name, latitude: spot.latitude, longitude: spot.longitude });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const removeButton = document.createElement("button");
      removeButton.className = "remove";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", "Remove " + spot.name);
      removeButton.addEventListener("click", async function () {
        try {
          await deleteSpot(spot.id);
          loadSpots();
        } catch (error) {
          console.error(error);
        }
      });

      item.append(openButton, removeButton);
      spotsList.appendChild(item);

      const option = document.createElement("option");
      option.value = spot.name;
      spotOptions.appendChild(option);
    }
  } catch (error) {
    console.error(error);
    spotsList.innerHTML = "<li class='empty'>Couldn't load saved spots.</li>";
  }
}

logForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  let notes = logNotes.value.trim();
  if (notes === "") {
    notes = null;
  }

  const observation = {
    object_seen: logObject.value.trim(),
    spot_name: logSpot.value.trim(),
    observed_on: logDate.value,
    rating: Number(logRating.value),
    notes: notes
  };

  if (observation.object_seen === "" || observation.spot_name === "" || observation.observed_on === "") {
    showMessage(logMessage, "Fill in what you saw, where, and the date.", true);
    return;
  }

  if (observation.observed_on > getToday()) {
    showMessage(logMessage, "The date can't be in the future.", true);
    return;
  }

  try {
    await addObservation(observation);
    showMessage(logMessage, "Added " + observation.object_seen + " to your log.", false);
    logObject.value = "";
    logNotes.value = "";
    logDate.value = getToday();
    loadObservations();
  } catch (error) {
    console.error(error);
    showMessage(logMessage, "Couldn't save that. Please try again.", true);
  }
});

async function loadObservations() {
  try {
    const observations = await getObservations();
    logList.innerHTML = "";

    if (observations.length === 1) {
      logCount.textContent = "1 observation logged";
    } else {
      logCount.textContent = observations.length + " observations logged";
    }

    for (const entry of observations) {
      const item = document.createElement("li");

      const top = document.createElement("div");
      top.className = "log-top";

      const title = document.createElement("strong");
      title.textContent = entry.object_seen;

      const stars = document.createElement("span");
      stars.className = "stars";
      stars.textContent = "★".repeat(entry.rating) + "☆".repeat(5 - entry.rating);

      top.append(title, stars);

      const meta = document.createElement("p");
      meta.className = "log-meta";
      const date = new Date(entry.observed_on + "T12:00");
      meta.textContent = entry.spot_name + " · " + date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

      item.append(top, meta);

      if (entry.notes) {
        const notes = document.createElement("p");
        notes.className = "log-notes";
        notes.textContent = entry.notes;
        item.appendChild(notes);
      }

      const removeButton = document.createElement("button");
      removeButton.className = "remove";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", "Delete " + entry.object_seen);
      removeButton.addEventListener("click", async function () {
        try {
          await deleteObservation(entry.id);
          loadObservations();
        } catch (error) {
          console.error(error);
        }
      });
      item.appendChild(removeButton);

      logList.appendChild(item);
    }
  } catch (error) {
    console.error(error);
    logCount.textContent = "Couldn't load your log.";
  }
}

function showStatus(text, isError) {
  statusText.textContent = text;
  if (isError) {
    statusText.className = "error";
  } else {
    statusText.className = "";
  }
}

function showMessage(element, text, isError) {
  element.textContent = text;
  if (isError) {
    element.className = "message error";
  } else {
    element.className = "message success";
  }
}

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

logDate.value = getToday();
logDate.max = getToday();

loadSpots();
loadObservations();

const savedPlace = localStorage.getItem("lastPlace");
if (savedPlace) {
  const place = JSON.parse(savedPlace);
  if (place.name !== "My location") {
    cityInput.value = place.name;
  }
  loadForecast(place);
}
