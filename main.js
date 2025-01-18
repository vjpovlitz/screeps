// Import all required modules
const roleHarvester = require('role.harvester');
const spawnManager = require('spawn.manager');
const roleUpgrader = require('role.upgrader');
const constructionManager = require('construction.manager');
const energyManager = require('energy.manager');
const towerManager = require('tower.manager');
const constructionPlanner = require('construction.planner');
const visualManager = require('visual.manager');
const roleBuilder = require('role.builder');

function showDetailedStatus() {
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        
        console.log(`\n=== Room ${roomName} Status Report ===`);
        
        // Energy Status
        console.log(`\nEnergy Status:
    Available: ${room.energyAvailable}/${room.energyCapacityAvailable}
    Percentage: ${Math.floor((room.energyAvailable/room.energyCapacityAvailable) * 100)}%`);
        
        // Controller Status
        console.log(`\nController Status:
    Level: ${room.controller.level}
    Progress: ${room.controller.progress}/${room.controller.progressTotal}
    Progress Percentage: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`);
        
        // Creep Population
        const creeps = _.filter(Game.creeps, creep => creep.room.name === roomName);
        const harvesters = _.filter(creeps, c => c.memory.role === 'harvester');
        const upgraders = _.filter(creeps, c => c.memory.role === 'upgrader');
        const builders = _.filter(creeps, c => c.memory.role === 'builder');
        
        console.log(`\nCreep Population:
    Total Creeps: ${creeps.length}
    Harvesters: ${harvesters.length} (Names: ${harvesters.map(c => c.memory.customName).join(', ')})
    Upgraders: ${upgraders.length} (Names: ${upgraders.map(c => c.memory.customName).join(', ')})
    Builders: ${builders.length} (Names: ${builders.map(c => c.memory.customName).join(', ')})`);
        
        // Sources Status
        const sources = room.find(FIND_SOURCES);
        console.log('\nSources Status:');
        sources.forEach((source, index) => {
            console.log(`    Source ${index + 1}: ${source.energy}/${source.energyCapacity} energy
    Harvesters assigned: ${_.filter(harvesters, h => h.memory.sourceId === source.id).length}`);
        });
        
        // Construction Sites
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        if(sites.length > 0) {
            console.log('\nConstruction Sites:');
            sites.forEach(site => {
                console.log(`    ${site.structureType}: ${site.progress}/${site.progressTotal} (${Math.floor((site.progress/site.progressTotal) * 100)}%)`);
            });
        }

        // Structures Status
        const structures = room.find(FIND_MY_STRUCTURES);
        const structureCounts = _.countBy(structures, 'structureType');
        console.log('\nStructures:');
        for(let type in structureCounts) {
            console.log(`    ${type}: ${structureCounts[type]}`);
        }

        // Memory Usage
        const memorySize = RawMemory.get().length;
        console.log(`\nMemory Usage: ${(memorySize / 1024).toFixed(2)} KB`);
        
        console.log('\n=== End Status Report ===\n');
    }
}

module.exports.loop = function() {
    // Clear memory of dead creeps
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // Run spawn logic
    spawnManager.run();

    // Run room logic and visualizations
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        visualManager.run(room);
    }

    // Run creep logic
    for(let name in Game.creeps) {
        const creep = Game.creeps[name];
        switch(creep.memory.role) {
            case 'harvester':
                roleHarvester.run(creep);
                break;
            case 'upgrader':
                roleUpgrader.run(creep);
                break;
            case 'builder':
                roleBuilder.run(creep);
                break;
        }
    }

    // Show detailed status report every 30 seconds (30 ticks)
    if(Game.time % 30 === 0) {
        showDetailedStatus();
    }

    // CPU Usage tracking
    if(Game.time % 30 === 0) {
        console.log(`CPU Usage: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit} (${(Game.cpu.getUsed() / Game.cpu.limit * 100).toFixed(2)}%)`);
    }
}; 