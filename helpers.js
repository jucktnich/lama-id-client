const configResponse = await fetch('./config.json');
let config = await configResponse.json();

function parseToBool(string) {
    if (string === 'true') return true;
    if (string === 'false') return false;
    return undefined;
}

const params = new URLSearchParams(window.location.search);
const paramsLogLevel = params.get('logLevel');
if (paramsLogLevel) config.client.logLevel = paramsLogLevel;
const paramsDisableCrop = parseToBool(params.get('disableCrop'));
if (paramsDisableCrop !== undefined) config.client.disableCrop = paramsDisableCrop;
const paramsIgnoreCampaignStatus = parseToBool(params.get('ignoreCampaignStatus'));
if (paramsIgnoreCampaignStatus !== undefined) config.client.ignoreCampaignStatus = paramsIgnoreCampaignStatus;
config.client.login = {
        id: params.get('id'),
        password: params.get('password')
}
config.client.context = params.get('context')

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

export { config, uuidv4, formatDate };