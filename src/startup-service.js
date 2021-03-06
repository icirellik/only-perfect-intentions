import { login, createRequest, hash, sessionRequest } from './request';
const Q = require('q');
import upperFirst from 'lodash.upperfirst';

export function getData() {
  return login()
    .then(auth => {
      let { csrf, sessionId } = auth;
      var payload = createRequest('StartupService', 'getData', []);
      let checksum = hash(csrf, payload);

      return Q.Promise((resolve, reject) => {
        sessionRequest(sessionId).post({
          uri: 'https://us3.forgeofempires.com/game/mobile',
          'Content-Type': 'application/x-www-form-urlencoded',
          body: checksum + JSON.stringify(payload),
          qs: {
            h: csrf
          }
        }, (err, response, body) => {
          if (err) {
            throw reject(err);
          }
          let json = null;
          try {
            json = JSON.parse(body);
          } catch (ex) {
            return reject(ex);
          }
          let results = {};
          json.forEach(response => {
            results[response.requestClass + upperFirst(response.requestMethod)] = response.responseData;
          });
          if (results['StartupServiceGetData']['__class__'] === 'UnsupportedClient') {
            console.log(`${results['StartupServiceGetData'].message}`);
          }
          resolve(results);
        });
      });
  });
};