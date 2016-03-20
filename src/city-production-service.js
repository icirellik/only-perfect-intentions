import upperFirst from 'lodash.upperfirst';
import Q from 'q';
import { createRequest, hash, login, sessionRequest } from './request';

export function startProduction(buildingId, time) {
  return Q.fcall(() => {
      if (!buildingId) {
        throw new Error('No building id supplied');
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
        throw new Error('No building id supplied');
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