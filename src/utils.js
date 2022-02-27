async function sleep(ms){
    console.log('Sleeping ' + ms/1000 + ' seconds')
    await new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { sleep };