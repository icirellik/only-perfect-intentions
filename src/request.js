import crypto from 'crypto';
import Q from 'q';
import request from 'request';

const secret = 'forgeofempires';

const headers = {
  'Accept': '*/*',
  'Host': 'us.forgeofempires.com',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 6 Build/MRA58X; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/46.0.2490.76 Mobile Safari/537.36',
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

function clientId() {
  return {
    '__class__': 'ClientIdentification',
    androidDeviceId: process.env.ANDROID_DEVICE_ID,
    appType: 'iforge',
    clientVersionNumber: '1.65.0',
    deviceId: process.env.DEVICE_ID,
    localeWithPlatform: '@and_google//us',
    osVersion: '',
    platform: 'and_google',
    platformType: '',
    platformVersion: 'pho',
    refMarketingId: '@and_google//us-en',
    registrationId: process.env.REGISTRATION_ID,
    requiredBackendVersion: '1.65',
  };
};

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
export function login() {

  if (loginPromise) {
    return loginPromise;
  }

  const loginUrl = 'https://us.forgeofempires.com/start/mobile';
  const loginData = {
    client_identification: JSON.stringify(clientId()),
    name: process.env.FOE_NAME,
    password_hash: process.env.FOE_PASSWORD,
    world_id: 'us3',
  }

  loginPromise = Q.Promise((resolve, reject) => {
    baseRequest().post({
      uri: loginUrl,
      formData: loginData,
      qs: {
        action: 'login'
      }
    }, (err, response, body) => {
      if (err) {
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
