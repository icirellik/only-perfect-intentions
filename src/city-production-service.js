import { login, createRequest, hash, sessionRequest } from './request';
import upperFirst from 'lodash.upperfirst';
const Q = require('q');

export function startProduction(buildingId, time) {
  return Q.fcall(() => {
      if (!buildingId) {
        return null;
      }
      return login();
    })
    .then(auth => {
      let { csrf, sessionId } = auth;
      var payload = createRequest('CityProductionService', 'startProduction', [
        buildingId,
        time
      ]);
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
          })
          resolve(results);
        });
      });
  });
};

export function pickupProduction(buildingIds) {
  return Q.fcall(() => {
      if (!buildingIds || buildingIds.length === 0) {
        return null;
      }
      return login();
    })
    .then(auth => {
      let { csrf, sessionId } = auth;
      var payload = createRequest('CityProductionService', 'pickupProduction', [
        buildingIds
      ]);
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
          })
          resolve(results);
        });
      });
  });
}