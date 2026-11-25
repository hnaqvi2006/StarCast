const SUPABASE_URL = "https://tmwpccmwnajtdfixirvf.supabase.co";
const SUPABASE_KEY = "sb_publishable_GWc2EHCYA-dhEubo4cmPpA_znsFPpUk";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getSpots() {
  const { data, error } = await db
    .from("spots")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

async function addSpot(name, latitude, longitude) {
  const { error } = await db
    .from("spots")
    .insert({ name: name, latitude: latitude, longitude: longitude });

  if (error) {
    throw error;
  }
}

async function deleteSpot(id) {
  const { error } = await db.from("spots").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

async function getObservations() {
  const { data, error } = await db
    .from("observations")
    .select("*")
    .order("observed_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

async function addObservation(observation) {
  const { error } = await db.from("observations").insert(observation);

  if (error) {
    throw error;
  }
}

async function deleteObservation(id) {
  const { error } = await db.from("observations").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
