import { pickupProduction, startProduction } from './city-production-service';
import { getResources } from './city-resources-service';
import { getData } from './startup-service';
import commander from 'commander';
import chalk from 'chalk';

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
        let supplies = results['CityResourcesService:getResources'];
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
  .command('collect')
    .action(function () {
      getData()
    .then(results => {
      let userData = results["StartupService:getData"];
      let cityMap = userData["city_map"];

      let buildings = cityMap.entities;
      let cityBuildings = new Map();

      buildings.forEach(building => {
        if (!cityBuildings.has(building.type)) {
          cityBuildings.set(building.type, []);
        }
        cityBuildings.get(building.type).push(building);
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

      console.log(`Collectable Buildings ${collectableBuildings.length}`);
      pickupProduction(collectableBuildings)
        .then(results => {
          let productionResults = results["CityResourcesService:getResources"];
          console.log('Supplies' , productionResults[0].supplies);
          startableBuildings.forEach(buildingId => {
            startProduction(buildingId, 1)
              .then(results => {
                console.log('Started Production', buildingId);
              });
          });
        });
    });
  });

commander.parse(process.argv);
