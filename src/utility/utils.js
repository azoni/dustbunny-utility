async function sleep(ms) {
  await new Promise((resolve) => { setTimeout(resolve, ms); });
}

function get_ISOString(seconds) {
  const search_time = Math.floor(+new Date()) - seconds;
  return new Date(search_time).toISOString();
}
function get_ISOString_now() {
  const search_time = Math.floor(+new Date());
  return new Date(search_time).toISOString();
}
module.exports = { sleep, get_ISOString, get_ISOString_now };
