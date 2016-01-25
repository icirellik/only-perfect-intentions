import { pickupProduction, startProduction } from './city-production-service';
import { getResources } from './city-resources-service';
import { getOwnClanData } from './clan-service';
import { motivate, polish, visitPlayer } from './other-player-service';
import { getData } from './startup-service';
const commander = require('commander');
const chalk = require('chalk');
const Q = require('q');

import { boo } from './services/test';

const BuildingTypes = {
  MAIN_BUILDING: 'main_building',
  RESIDENTIAL: 'residential',
  GOODS: 'goods',
  CULTURE: 'culture',
  DECORATION: 'decoration',
  PRODUCTION: 'production',
  MILITARY: 'military',
  STREET: 'street',
};

const ProductionStates = {
  CONSTRUCTION: 'ConstructionState',
  IDLE: 'IdleState',
  FINISHED: 'ProductionFinishedState',
  POLISHED: 'PolishedState',
  PRODUCING: 'ProducingState',
};

commander
  .version('0.0.1')
  .command('status')
  .action(function () {
    getResources()
      .then(results => {
        let supplies = results['CityResourcesServiceGetResources'];
        console.log(`${chalk.yellow('Goods')}`);
        console.log(`${chalk.yellow('-------------------------')}`);
        console.log(`money:      ${chalk.blue(supplies.money)}`);
        console.log(`supplies:   ${chalk.blue(supplies.supplies)}`);
        console.log(`population: ${chalk.blue(supplies.population)}`);
        console.log(`medals:     ${chalk.blue(supplies.medals)}`);
        console.log(`diamonds:   ${chalk.blue(supplies.premium)}`);
        console.log(`${chalk.yellow('-------------------------')}`);
        supplies.goods.forEach(good => {
          console.log(`${chalk.green(good.good_id)}:   ${chalk.blue(good.value)}`);
        });
      });
  });

commander
  .command('clan')
  .action(function () {
      getOwnClanData()
        .then(results => {
          let clanData = results["ClanServiceGetOwnClanData"];
          let members = clanData.members;

          members.forEach(member => {
            console.log(member.player_id);
          })

          return visitPlayer(members[0].player_id)
            .then(results => {

              let playerData = results["OtherPlayerServiceVisitPlayer"];
              let cityMap = playerData.city_map;
              let entities = cityMap.entities;

              let decorations = entities.filter(entity => (entity.type == BuildingTypes.CULTURE || entity.type == BuildingTypes.DECORATION))
                .filter(entity => entity.state['__class__'] != ProductionStates.POLISHED);

              console.log(decorations)
            });

        });
  });

function visit(otherPlayerId, cityEntities) {
  return visitPlayer(otherPlayerId)
    .then(results => {
      let otherPlayer = {
        buildings: {},
        tiles: results['OtherPlayerServiceVisitPlayer'].city_map.unlocked_areas
      };

      results['OtherPlayerServiceVisitPlayer'].city_map.entities.forEach(building => {
        if (!otherPlayer.buildings[building.type]) {
          otherPlayer.buildings[building.type] = [];
        }
        otherPlayer.buildings[building.type].push(building);
      });

      // Residential first
      var unmotivatedBuildings = otherPlayer.buildings.residential.filter(building => {
        return building.state.is_motivated === false;
      });

      if (unmotivatedBuildings.length !== 0) {
        return motivate(otherPlayerId, unmotivatedBuildings[0], cityEntities[unmotivatedBuildings[0].cityentity_id]);
      }
    })
    .then(results => {
      console.log(results);
    })
    .catch(err => {
      console.error(`Failed to visit ${otherPlayerId}, ${err}`);
    });
}

commander
  .command('visit')
  .action(function () {
    let cityEntities = {};

    // Social Bar
    let visitablePeople = {};

    // Clan member next_interaction_in = 0 means can get polish motivate
    let clanMembers = {};
    getData()
      .then(startupData => {
        startupData.StartupServiceGetData.city_map.city_entities.forEach(entity => {
          cityEntities[entity.id] = entity;
        });

        startupData.StartupServiceGetData.socialbar_list.forEach(player => {
          visitablePeople[player.player_id] = player;
        });

        startupData.StartupServiceGetData.city_map.city_entities.forEach(entity => {
          cityEntities[entity.id] = entity;
        });

        return getOwnClanData();
      })
      .then(clanData => {
        clanData.ClanServiceGetOwnClanData.members.forEach(member => {
          clanMembers[member.player_id] = member;
          visitablePeople[member.player_id] = member;
        });

        let visitPromises = Object.keys(visitablePeople).filter(otherPlayerId => {
          return visitablePeople[otherPlayerId].next_interaction_in === 0;
        })
        .map(otherPlayerId => {
          return visit(otherPlayerId, cityEntities);
        });

        return Q.allSettled(visitPromises);
      })
      .then(() => {
        console.log('Done visiting');
      });
  });

commander
  .command('capacity')
  .action(function () {
    getData()
      .then(results => {
        let userData = results["StartupServiceGetData"];
        let cityMap = userData["city_map"];

        let buildings = cityMap.entities;
        let cityBuildings = new Map();

        buildings.forEach(building => {
          if (!cityBuildings.has(building.type)) {
            cityBuildings.set(building.type, []);
          }
          cityBuildings.get(building.type).push(building);
        });

        console.log(cityBuildings.get(BuildingTypes.PRODUCTION)[0].state.current_product.revenue);

      });
  });

commander
  .command('collect')
    .action(function () {
      getData()
        .then(results => {
          let userData = results["StartupServiceGetData"];
          let cityMap = userData["city_map"];

          let buildings = cityMap.entities;
          let cityBuildings = new Map();

          buildings.forEach(building => {
            if (!cityBuildings.has(building.type)) {
              cityBuildings.set(building.type, []);
            }
            cityBuildings.get(building.type).push(building);
          });

          let gains = {
            money: 0,
            supplies: 0
          }

          cityBuildings.get(BuildingTypes.PRODUCTION)
            .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
            .forEach(building => {
              gains.supplies += building.state.current_product.revenue.supplies;
            });

          cityBuildings.get(BuildingTypes.RESIDENTIAL)
            .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
            .forEach(building => {
              gains.money += building.state.current_product.revenue.money;
            });

          let collectableBuildings = [].concat(
            cityBuildings.get(BuildingTypes.PRODUCTION)
              .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
              .map(building => building.id),
            cityBuildings.get(BuildingTypes.RESIDENTIAL)
              .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
              .map(building => building.id),
            cityBuildings.get(BuildingTypes.GOODS)
              .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
              .map(building => building.id));

          let startableBuildings = [].concat(
            cityBuildings.get(BuildingTypes.PRODUCTION)
              .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
              .map(building => building.id),
            cityBuildings.get(BuildingTypes.PRODUCTION)
              .filter(building => building.state['__class__'] === ProductionStates.IDLE)
              .map(building => building.id),
            cityBuildings.get(BuildingTypes.GOODS)
              .filter(building => building.state['__class__'] === ProductionStates.FINISHED)
              .map(building => building.id),
            cityBuildings.get(BuildingTypes.GOODS)
              .filter(building => building.state['__class__'] === ProductionStates.IDLE)
              .map(building => building.id));

          console.log(`Gains ${JSON.stringify(gains)}`);
          console.log(`Collectable Buildings ${collectableBuildings.length}`);

          pickupProduction(collectableBuildings)
            .then(results => {
              let productionResults = results["CityResourcesServiceGetResources"];
              console.log('Supplies' , productionResults[0].supplies);
              startableBuildings.forEach(buildingId => {
                startProduction(buildingId, 1)
                  .then(results => {
                    console.log('Started Production', buildingId);
                  });
              });
            });

          if (collectableBuildings.length == 0 && startableBuildings.length !== 0) {
            startableBuildings.forEach(buildingId => {
                startProduction(buildingId, 1)
                  .then(results => {
                    console.log('Started Production', buildingId);
                  });
              });
          }
        })
        .then(() => {
          console.log(chalk.green('Collecting complete'));
        });
  });

commander.parse(process.argv);
