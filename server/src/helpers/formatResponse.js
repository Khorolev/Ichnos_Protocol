/**
 
Only to be tested and pass server CI test 

* Builds a consistent API response object.
 * Shape: { data, error, message }
 */
export function formatResponse(data = null, message = "", error = null) {
  return { data, error, message };
}
