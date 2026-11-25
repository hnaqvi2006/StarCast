const LUNAR_CYCLE = 29.53;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z");

function getMoonAge(date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysSince = (date - KNOWN_NEW_MOON) / millisecondsPerDay;
  return daysSince % LUNAR_CYCLE;
}

function getMoonInfo(date) {
  const age = getMoonAge(date);
  const halfCycle = LUNAR_CYCLE / 2;

  let illumination = 0;
  if (age <= halfCycle) {
    illumination = (age / halfCycle) * 100;
  } else {
    illumination = ((LUNAR_CYCLE - age) / halfCycle) * 100;
  }
  illumination = Math.round(illumination);

  let name = "New Moon";
  let icon = "🌑";

  if (age >= 1.85 && age < 5.54) {
    name = "Waxing Crescent";
    icon = "🌒";
  } else if (age >= 5.54 && age < 9.23) {
    name = "First Quarter";
    icon = "🌓";
  } else if (age >= 9.23 && age < 12.92) {
    name = "Waxing Gibbous";
    icon = "🌔";
  } else if (age >= 12.92 && age < 16.61) {
    name = "Full Moon";
    icon = "🌕";
  } else if (age >= 16.61 && age < 20.3) {
    name = "Waning Gibbous";
    icon = "🌖";
  } else if (age >= 20.3 && age < 23.99) {
    name = "Last Quarter";
    icon = "🌗";
  } else if (age >= 23.99 && age < 27.68) {
    name = "Waning Crescent";
    icon = "🌘";
  }

  return { name: name, icon: icon, illumination: illumination };
}
