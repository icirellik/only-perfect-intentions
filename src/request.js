import crypto from 'crypto';
import Q from 'q';
import request from 'request';

// The constant required to generate the hash.
const secret = 'forgeofempires';

// Default androing headers.
const headers = {
  'Accept': '*/*',
  'Host': 'us.forgeofempires.com',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6 Build/MMB29Q; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/48.0.2564.106 Mobile Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest'
}

function baseRequest() {
  return request.defaults({
    headers: headers,
    gzip: true
  });
};

export function sessionRequest(sessionId) {
  var sessionHeaders = Object.assign({
    'Cookie': `sid=${sessionId}`
  }, headers);

  return request.defaults({
    headers: sessionHeaders,
    gzip: true
  });
}

export function hash(csrf, json) {
  let jsonString = JSON.stringify(json);
  let md5 = crypto.createHash('md5');
  md5.update(`${csrf}${secret}${jsonString}`);
  let hash = md5.digest('hex');
  return hash.substring(0, 10);
};

let requestId = 1;

/**
 * The client id that is sent along with each request.
 */
function clientId() {
  return {
    '__class__': 'ClientIdentification',
    androidDeviceId: process.env.ANDROID_DEVICE_ID,
    appType: 'iforge',
    clientVersionNumber: '1.71.0',
    deviceId: process.env.DEVICE_ID,
    localeWithPlatform: '@and_google//us',
    osVersion: '',
    platform: 'and_google',
    platformType: '',
    platformVersion: 'pho',
    refMarketingId: '@and_google//us-en',
    registrationId: process.env.REGISTRATION_ID,
    requiredBackendVersion: '1.71',
  };
};

/**
 * The request payload.
 */
export function createRequest(service, method, requestData) {
  return [{
    "__class__": "ServerRequest",
    requestData: requestData,
    requestClass: service,
    requestMethod: method,
    requestId: requestId++,
    clientIdentification: clientId()
  }];
};

let loginPromise = null;

const loginUrl = 'https://us.forgeofempires.com/start/mobile';

export function login() {
  if (loginPromise) {
    return loginPromise;
  }

  let loginData = {
    client_identification: clientId(),
    name: process.env.FOE_NAME,
    world_id: 'us3',
  }

  if (process.env.FOE_PASSWORD) {
    loginData.password_hash = process.env.FOE_PASSWORD;
  }

  if (process.env.FOE_PASSWORD_RAW) {
    loginData.password = process.env.FOE_PASSWORD_RAW;
  }

  loginPromise = Q.Promise((resolve, reject) => {
    baseRequest().post({
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      uri: loginUrl,
      form: loginData,
      qs: {
        action: 'login'
      }
    }, (err, response, body) => {
      if (response.statusCode >= 400 || err) {
        reject(err);
      }
      let json = JSON.parse(body);
      console.log('Authenticated');
      resolve({
        csrf: json.csrf,
        sessionId: json.session_id,
        worldUrl: json.world_url
      });
    });
  });

  return loginPromise;
};
