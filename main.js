// Import modules
const roleHarvester = require('role.harvester');
const spawnManager = require('spawn.manager');
const roleUpgrader = require('role.upgrader');
const constructionManager = require('construction.manager');

function showStatus() {
    // Energy status
    const room = Game.spawns['Spawn1'].room;
    console.log(`Room "${room.name}" status:
    Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}
    Creeps: ${Object.keys(Game.creeps).length}
    Harvesters: ${_.filter(Game.creeps, c => c.memory.role == 'harvester').length}`);
}

function visualizeRoads(room) {
    // Show existing roads
    const roads = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_ROAD
    });
    roads.forEach(road => {
        room.visual.circle(road.pos, {
            radius: 0.15,
            fill: '#ffffff',
            opacity: 0.3
        });
    });

    // Show construction sites
    const sites = room.find(FIND_CONSTRUCTION_SITES, {
        filter: s => s.structureType === STRUCTURE_ROAD
    });
    sites.forEach(site => {
        room.visual.circle(site.pos, {
            radius: 0.15,
            fill: '#ffff00',
            opacity: 0.3
        });
    });
}

function visualizeCreeps(room) {
    // Visualize each creep's status and name
    for(let name in Game.creeps) {
        const creep = Game.creeps[name];
        
        // Create a colored circle under the creep based on role
        const roleColors = {
            'harvester': '#ffaa00',
            'upgrader': '#00ffaa'
        };

        // Draw circle under creep
        room.visual.circle(creep.pos, {
            radius: 0.45,
            fill: roleColors[creep.memory.role] || '#ffffff',
            opacity: 0.2
        });

        // Draw name above creep
        room.visual.text(
            creep.name,
            creep.pos.x,
            creep.pos.y - 0.5,
            {
                color: '#ffffff',
                font: 0.5,
                stroke: '#000000',
                strokeWidth: 0.05,
                opacity: 0.8
            }
        );

        // Show current action
        let actionIcon = '⚡'; // default
        if(creep.memory.delivering) actionIcon = '📦';
        if(creep.memory.upgrading) actionIcon = '⚡';
        
        room.visual.text(
            actionIcon,
            creep.pos.x,
            creep.pos.y + 0.25,
            {font: 0.5}
        );

        // Draw path to target if moving
        if(creep.memory._move) {
            const path = Room.deserializePath(creep.memory._move.path);
            room.visual.poly(path.map(p => [p.x, p.y]), {
                stroke: roleColors[creep.memory.role],
                opacity: 0.2,
                lineStyle: 'dashed'
            });
        }
    }

    // Show energy sources info
    room.find(FIND_SOURCES).forEach(source => {
        const harvestersHere = _.filter(Game.creeps, c => 
            c.memory.sourceId === source.id
        ).length;
        
        room.visual.text(
            `Energy: ${source.energy}\nHarvesters: ${harvestersHere}`,
            source.pos.x,
            source.pos.y - 1,
            {
                align: 'center',
                opacity: 0.7,
                color: '#ffff00'
            }
        );
    });
}

module.exports.loop = function() {
    // Clear memory of dead creeps
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    // Run spawn logic
    spawnManager.run();

    // Run creep logic and add visualizations
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        
        // Add persistent visualizations
        visualizeCreeps(room);
        
        // Show room energy status
        room.visual.text(
            `Room Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            1,
            1,
            {align: 'left', opacity: 0.8}
        );
    }

    // Run creep logic
    for(let name in Game.creeps) {
        const creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
    }

    // Run status report every 10 ticks
    if(Game.time % 10 === 0) {
        showStatus();
    }

    // Visualize roads every tick
    for(let roomName in Game.rooms) {
        visualizeRoads(Game.rooms[roomName]);
    }

    // Force road planning every 100 ticks
    if(Game.time % 100 === 0) {
        for(let roomName in Game.rooms) {
            constructionManager.planRoads(Game.rooms[roomName]);
        }
    }

    // Add road maintenance status
    if(Game.time % 50 === 0) {
        for(let roomName in Game.rooms) {
            const roads = Game.rooms[roomName].find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_ROAD
            });
            console.log(`Room ${roomName} has ${roads.length} roads. Average health: ${
                Math.floor(roads.reduce((sum, road) => sum + (road.hits / road.hitsMax * 100), 0) / roads.length)
            }%`);
        }
    }
} 