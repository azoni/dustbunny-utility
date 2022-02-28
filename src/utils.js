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
module.exports = { sleep };