async function sleep(ms){
    // console.log('Sleeping ' + ms/1000 + ' seconds')
    await new Promise(resolve => setTimeout(resolve, ms))
}
async function start_timer(){
    return Math.floor(+new Date())
}
async function end_timer(start_time){
    var end_time = Math.floor(+new Date())
    return end_time - start_time
}
function get_ISOString(seconds){
    let search_time = Math.floor(+new Date()) - seconds
    return new Date(search_time).toISOString();
}
function get_ISOString_now(){
    let search_time = Math.floor(+new Date())
    return new Date(search_time).toISOString();
}
module.exports = { sleep, get_ISOString, get_ISOString_now };