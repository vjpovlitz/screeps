// Import modules
const roleHarvester = require('role.harvester');
const spawnManager = require('spawn.manager');
const roleUpgrader = require('role.upgrader');
const constructionManager = require('construction.manager');
const energyManager = require('energy.manager');

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

function enhancedVisuals(room) {
    // Clear previous visuals
    room.visual.clear();
    
    // Show all creeps and their status
    for(let name in Game.creeps) {
        const creep = Game.creeps[name];
        
        // Creep circle and name
        room.visual.circle(creep.pos, {
            radius: 0.55,
            fill: creep.memory.role == 'harvester' ? '#ffaa00' :
                  creep.memory.role == 'upgrader' ? '#00ffaa' :
                  '#ffffff',
            opacity: 0.2
        });

        // Creep name with background for better visibility
        room.visual.text(
            creep.name,
            creep.pos.x,
            creep.pos.y - 0.5,
            {
                color: '#ffffff',
                font: 0.5,
                backgroundColor: '#000000',
                backgroundPadding: 0.2,
                opacity: 0.8
            }
        );

        // Role icon
        const roleIcon = creep.memory.role == 'harvester' ? '⚡' :
                        creep.memory.role == 'upgrader' ? '🔄' :
                        creep.memory.role == 'builder' ? '🏗️' : '❓';
        
        room.visual.text(
            roleIcon,
            creep.pos.x,
            creep.pos.y + 0.25,
            {font: 0.5}
        );
    }

    // Energy source information
    room.find(FIND_SOURCES).forEach(source => {
        const harvestersHere = _.filter(Game.creeps, c => 
            c.memory.sourceId === source.id
        ).length;
        
        // Energy bar
        const energyPercent = source.energy / source.energyCapacity;
        room.visual.rect(
            source.pos.x - 0.5,
            source.pos.y - 1,
            1,
            0.1,
            {fill: '#555555'}
        );
        room.visual.rect(
            source.pos.x - 0.5,
            source.pos.y - 1,
            energyPercent,
            0.1,
            {fill: '#ffaa00'}
        );

        // Source stats
        room.visual.text(
            `⚡ ${source.energy}/${source.energyCapacity}\n👥 ${harvestersHere}`,
            source.pos.x,
            source.pos.y - 1.2,
            {
                align: 'center',
                opacity: 0.8,
                backgroundColor: '#000000',
                backgroundPadding: 0.2
            }
        );
    });

    // Show Maryland town names for sources
    room.find(FIND_SOURCES).forEach((source, index) => {
        const townName = spawnManager.townNames.sources[index] || 'Unknown Town';
        room.visual.text(
            `📍 ${townName}`,
            source.pos.x,
            source.pos.y - 1.5,
            {
                color: '#ffffff',
                backgroundColor: '#000000',
                backgroundPadding: 0.2,
                opacity: 0.8,
                font: 0.6
            }
        );
    });

    // Show Annapolis for spawn
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if(spawn) {
        room.visual.text(
            `🏛️ ${spawnManager.townNames.spawn}`,
            spawn.pos.x,
            spawn.pos.y - 1,
            {
                color: '#ffffff',
                backgroundColor: '#000000',
                backgroundPadding: 0.2,
                opacity: 0.8,
                font: 0.6
            }
        );
    }

    // Room status dashboard
    const dashboard = [
        `Room: ${room.name}`,
        `Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`,
        `Creeps: ${Object.keys(Game.creeps).length}`,
        `Harvesters: ${_.filter(Game.creeps, c => c.memory.role == 'harvester').length}`,
        `Upgraders: ${_.filter(Game.creeps, c => c.memory.role == 'upgrader').length}`,
        `Builders: ${_.filter(Game.creeps, c => c.memory.role == 'builder').length}`
    ].join('\n');

    room.visual.text(
        dashboard,
        1,
        1,
        {
            align: 'left',
            opacity: 0.8,
            backgroundColor: '#000000',
            backgroundPadding: 0.2
        }
    );
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
        enhancedVisuals(room);
        
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

    // Run energy management
    for(let roomName in Game.rooms) {
        energyManager.run(Game.rooms[roomName]);
    }

    // Add enhanced visuals for each room
    for(let roomName in Game.rooms) {
        enhancedVisuals(Game.rooms[roomName]);
    }

    // Get the specific room
    const room = Game.rooms['E58N36'];
    if(room) {
        // Find the mineral
        const mineral = room.find(FIND_MINERALS)[0];
        if(mineral) {
            // Try to place extractor if none exists
            const extractors = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_EXTRACTOR
            });
            
            if(extractors.length === 0) {
                console.log('Attempting to place extractor at:', mineral.pos.x, mineral.pos.y);
                const result = room.createConstructionSite(
                    mineral.pos.x, 
                    mineral.pos.y, 
                    STRUCTURE_EXTRACTOR
                );
                console.log('Extractor placement result:', result);
            }
        }

        // Try to place storage near spawn
        const spawn = Game.spawns['Spawn1'];
        if(spawn) {
            const storages = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE
            });
            
            if(storages.length === 0) {
                console.log('Attempting to place storage near spawn');
                const result = room.createConstructionSite(
                    spawn.pos.x + 2,
                    spawn.pos.y + 2,
                    STRUCTURE_STORAGE
                );
                console.log('Storage placement result:', result);
            }
        }
    }

    // Add storage near spawn
    Game.rooms['YOUR_ROOM'].createConstructionSite(
        Game.spawns['Spawn1'].pos.x + 2,
        Game.spawns['Spawn1'].pos.y + 2,
        STRUCTURE_STORAGE
    );
} 