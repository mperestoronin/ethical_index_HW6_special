import apiRequest from "../apiRequest";

export async function fetchDocument(id) {
  try {
    return await apiRequest(`documents/${id}/`, "GET");
  } catch (error) {
    console.error(error);
    throw new Error("Fetch failed");
  }
}

export async function fetchClassifiers(id) {
  try {
    return await apiRequest(`classifiers/${id}/`, "GET");
  } catch (error) {
    console.error(error);
    throw new Error("Fetch failed");
  }
}

export async function updateClassifier(id, field, value) {
  try {
    return await apiRequest(`classifiers/${id}/`, "PATCH", { [field]: value });
  } catch (error) {
    console.error(error);
    throw new Error("Update failed");
  }
}

export const updateStatus = async (id, status) => {
  return await apiRequest(`update_status/${id}/`, "PATCH", { status });
};
