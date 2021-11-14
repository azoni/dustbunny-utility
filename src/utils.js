const request = require("request");

async function get_current_offers(COLLECTION_NAME) {
    var slugs = [COLLECTION_NAME];
    var assets = {}

    var promises = []
    var delay = 0
    slugs.forEach((element) => {
        let slug = element
        assets[slug] = {}
        let url = "https://api.opensea.io/api/v1/collection/" + slug
        promises.push(
            sleep(delay)
            .then(() => {
                return get_request(url)
            })
            .then(body => {
                assets[slug]["floor"] = JSON.parse(body)["collection"]["stats"]["floor_price"]
            })
            .then(() => {
                assets[slug]["slug"] = slug
                assets[slug]["tokens"] = {}

                let search_time = Math.floor(+new Date() / 1000) - 900
                search_time = new Date(search_time).toISOString();
                let event_url = "https://api.opensea.io/api/v1/events?collection_slug=" + slug + "&only_opensea=false&offset=0&limit=300&occurred_after=" + search_time
                return get_request(event_url)
            })
            .then(body => {
                // console.log(body)
                let res = JSON.parse(body)
                res["asset_events"].forEach((event) => {
                    if (event["event_type"] === "bid_entered" || event["event_type"] === "offer_entered") {
                        var token = event["asset"]["token_id"]
                        if (!Object.keys(assets).includes(token) || event["bid_amount"] / 1000000000000000000 > assets[slug]["tokens"][token]["bid_amount"]) {
                            assets[slug]["tokens"][token] = {}
                            assets[slug]["tokens"][token]["bid_amount"] = event["bid_amount"] / 1000000000000000000
                            assets[slug]["tokens"][token]["from"] = event["from_account"]
                            assets[slug]["tokens"][token]["address"] = event["contract_address"]
                            assets[slug]["tokens"][token]["schema_name"] = event["asset"]["asset_contract"]["schema_name"]
                        }
                    }
                })
            })
            // .then(() => {console.log(assets)})
            .catch(err => { console.log(err) })
        )
        delay += 500
    })

    return Promise.all(promises)
        .then(res => {return assets})
        // .catch(err => { console.log(err) })
}

async function get_current_offers_v2(COLLECTION_NAME) {
    var slugs = [COLLECTION_NAME]
    var assets = {}

    // var promises = []
    // var delay = 0
    for (const slug of slugs) {
        assets[slug] = {}
        assets[slug]["tokens"] = {}
        var events = await get_all_events(slug)
        console.log(slug, events.length)
        events.forEach((event) => {
            if (event["event_type"] === "bid_entered" || event["event_type"] === "offer_entered") {
                var token = event["asset"]["token_id"]
                if (!Object.keys(assets).includes(token) || event["bid_amount"] / 1000000000000000000 > assets[slug]["tokens"][token]["bid_amount"]) {
                    assets[slug]["tokens"][token] = {}
                    assets[slug]["tokens"][token]["bid_amount"] = event["bid_amount"] / 1000000000000000000
                    assets[slug]["tokens"][token]["from"] = event["from_account"]
                    assets[slug]["tokens"][token]["address"] = event["contract_address"]
                    assets[slug]["tokens"][token]["schema_name"] = event["asset"]["asset_contract"]["schema_name"]
                }
            }
        })
    }
    return assets
}

async function get_all_events(slug) {
    let start_time = Math.floor(+new Date()) - 180000
    let finish_time = Math.floor(+new Date())
    start_time = new Date(start_time).toISOString();
    finish_time = new Date(finish_time).toISOString();
    console.log(start_time, finish_time)
    let offset = 0
    let limit = 300
    let result_length = 0
    let asset_events = []
    do {
        let event_url = "https://api.opensea.io/api/v1/events?collection_slug=" + slug + "&only_opensea=false&offset=" + offset + "&limit=" + limit + "&occurred_after=" + start_time + "&occurred_before=" + finish_time
        let res = await get_request(event_url).catch(err => console.log(err))
        res = JSON.parse(res)
        // console.log(res, res['asset_events'].length)
        result_length = res['asset_events'].length
        asset_events = asset_events.concat(res['asset_events'])
        offset += limit
        // console.log(asset_events.length)
    } while (result_length === 300)

    return asset_events
}

async function get_request(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode !== 200) {
                reject("Invalid status code <" + response.statusCode + ">");
            }
            resolve(body);
        });
    });
}

async function sleep(delay) {
    // console.log(delay)
    await new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = { get_current_offers, get_current_offers_v2 };