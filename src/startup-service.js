import { login, createRequest, hash, sessionRequest } from './request';
import Q from 'q';

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
          let json = JSON.parse(body);
          let results = {};
          json.forEach(response => {
            results[response.requestClass + ':' + response.requestMethod] = response.responseData;
          })
          resolve(results);
        });
      });
  });
};