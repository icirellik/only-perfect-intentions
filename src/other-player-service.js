import { login, createRequest, hash, sessionRequest } from './request';
import upperFirst from 'lodash.upperfirst';
import Q from 'q';

export const BUILDING_CULTURE = 'culture';
export const BUILDING_DECORATION = 'decoration';
export const BUILDING_GREAT_BUILDING = 'greatBuilding';
export const BUILDING_PRODUCTION = 'production';
export const BUILDING_RESIDENTIAL = 'residential';

export const BUILDING_STATE_IDLE = 'IdleState';
export const BUILDING_STATE_POLISHED = 'PolishedState';
export const BUILDING_STATE_PLUNDERED = 'PlunderedState';
export const BUILDING_STATE_PRODUCTION_FINISHED = 'ProductionFinishedState';
export const BULDING_STATE_UNCONNECTED = 'UnconnectedState';

export function polish(otherPlayerId, entity, entityConfig) {
  let building = entity.raw;
  building.entityConfig = entityConfig;
  return login()
    .then(auth => {
      let { csrf, sessionId } = auth;
      var payload = createRequest('OtherPlayerService', 'polish', [ building, otherPlayerId ]);
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
    })
    .then(results => {

      const otherPlayerResults = results['OtherPlayerServicePolish'];
      const questService = results['QuestServiceGetUpdates']
      const timeService = results['TimeServiceUpdateTime'];

      if (otherPlayerResults['__class__'] === 'Error') {
        throw new Error(`City Entity Id ${building.entityConfig.id} -> ${otherPlayerResults.message}`);
      }

      return results;
    })
    .catch(err => {
      console.log(`polish(): Failed to polish(${otherPlayerId})`);
      throw err;
    });
};

export function motivate(otherPlayerId, entity, entityConfig) {
  let building = entity.raw;
  building.entityConfig = entityConfig;
  return login()
    .then(auth => {
      let { csrf, sessionId } = auth;
      var payload = createRequest('OtherPlayerService', 'motivate', [ building, otherPlayerId ]);
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
    })
    .then(results => {

      const otherPlayerResults = results['OtherPlayerServiceMotivate'];
      const questService = results['QuestServiceGetUpdates']
      const timeService = results['TimeServiceUpdateTime'];

      if (otherPlayerResults['__class__'] === 'Error') {
        throw new Error(`City Entity Id ${building.entityConfig.id} -> ${otherPlayerResults.message}`);
      }

      return results;
    })
    .catch(err => {
      console.log(`motivate(): Failed to motivate(${otherPlayerId})`);
      throw err;
    });
};

export function visitPlayer(otherPlayerId) {
  return login()
    .then(auth => {
      let { csrf, sessionId } = auth;
      var payload = createRequest('OtherPlayerService', 'visitPlayer', [ otherPlayerId ]);
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
             return reject(err);
          }
          let json = null;
          try {
            json = JSON.parse(body);
          } catch (err) {
            return reject('Could not parse response');
          }
          let results = {};
          json.forEach(response => {
            results[response.requestClass + upperFirst(response.requestMethod)] = response.responseData;
          })
          resolve(results);
        });
      });
    })
    .then(results => {

      const otherPlayerResults = results['OtherPlayerServiceVisitPlayer'];
      const timeService = results['TimeServiceUpdateTime'];

      let otherPlayer = {
        id: otherPlayerResults.other_player.player_id,
        buildings: {
          culture: [],
          decoration: [],
          greatBuilding: [],
          production: [],
          residential: []
        },
        cityName: otherPlayerResults.city_name,
        name: otherPlayerResults.other_player.name,
        profileText: otherPlayerResults.other_player.profile_text,
        rank: otherPlayerResults.other_player.rank,
        score: otherPlayerResults.other_player.score,
        tiles: otherPlayerResults.city_map.unlocked_areas
      };

      otherPlayerResults.city_map.entities.forEach(building => {
        const newBuilding = createBuilding(building);
        if (newBuilding) {
          otherPlayer.buildings[newBuilding.type].push(newBuilding);
        } else {
          if (!otherPlayer.buildings[building.type]) {
            otherPlayer.buildings[building.type] = [];
          }
          otherPlayer.buildings[building.type].push(building);
        }
      });

      return otherPlayer;
    })
    .catch(err => {
      console.log(`visitPlayer(): Failed to visitPlayer(${otherPlayerId})`);
      throw err;
    });
};

// *culture
// *decoration
// goods
// *greatbuilding
// main_building
// military
// *production
// *random_production
// *residential
// street
// tower
function createBuilding(building) {
  switch (building.type) {
    case 'culture':
      return new Culture({
        id: building.id,
        cityEntityId: building.cityentity_id,
        raw: building,
        state: building.state['__class__'],
        type: BUILDING_CULTURE,
        polished: building.state['__class__'] === BUILDING_STATE_POLISHED
      });
    case 'decoration':
      return new Culture({
        id: building.id,
        cityEntityId: building.cityentity_id,
        raw: building,
        state: building.state['__class__'],
        type: BUILDING_DECORATION,
        polished: building.state['__class__'] === BUILDING_STATE_POLISHED
      });
    case 'greatbuilding':
      return new GreatBuilding({
        id: building.id,
        cityEntityId: building.cityentity_id,
        raw: building,
        state: building.state['__class__'],
        type: BUILDING_GREAT_BUILDING,
        level: building.level,
        maxLevel: building.max_level,
        investedPoints: building.state.invested_forge_points,
        requiredPoints: building.state.forge_points_for_level_up
      });
    case 'production':
    case 'random_production':
      return new Production({
        id: building.id,
        cityEntityId: building.cityentity_id,
        raw: building,
        state: building.state['__class__'],
        type: BUILDING_PRODUCTION,
        motivated: building.state.is_motivated
      });
    case 'residential':
      return new Residential({
        id: building.id,
        cityEntityId: building.cityentity_id,
        raw: building,
        state: building.state['__class__'],
        type: BUILDING_RESIDENTIAL,
        motivated: building.state.is_motivated
      });
  }
}

class Culture {
  constructor({id, cityEntityId, raw, state, type, polished}) {
    this.id = id;
    this.cityEntityId = cityEntityId;
    this.raw = raw;
    this.state = state;
    this.type = type;
    this.polished = !!polished;
  }
}

class Decoration {
  constructor({id, cityEntityId, raw, state, type, polished}) {
    this.id = id;
    this.cityEntityId = cityEntityId;
    this.raw = raw;
    this.state = state;
    this.type = type;
    this.polished = !!polished;
  }
}

class GreatBuilding {
  constructor({id, cityEntityId, raw, state, type, level, maxLevel, investedPoints, requiredPoints}) {
    this.id = id;
    this.cityEntityId = cityEntityId;
    this.raw = raw;
    this.state = state;
    this.type = type;
    this.level = level;
    this.maxLevel = maxLevel;
    this.investedPoints = investedPoints;
    this.requiredPoints = requiredPoints;
  }
}

class Production {
  constructor({id, cityEntityId, raw, state, type, motivated}) {
    this.id = id;
    this.cityEntityId = cityEntityId;
    this.raw = raw;
    this.state = state;
    this.type = type;
    this.motivated = !!motivated;
  }
}

class Residential {
  constructor({id, cityEntityId, raw, state, type, motivated}) {
    this.id = id;
    this.cityEntityId = cityEntityId;
    this.raw = raw;
    this.state = state;
    this.type = type;
    this.motivated = !!motivated;
  }
}