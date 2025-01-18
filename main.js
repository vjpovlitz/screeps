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

    // Get your specific room
    const room = Game.rooms['E58N36'];
    if(room) {
        // Find the hydrogen mineral at position 24, 13
        const mineral = room.lookForAt(LOOK_MINERALS, 24, 13)[0];
        if(mineral) {
            // Check for existing extractor
            const extractorSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, 24, 13)
                .filter(site => site.structureType === STRUCTURE_EXTRACTOR);
            const extractors = room.lookForAt(LOOK_STRUCTURES, 24, 13)
                .filter(structure => structure.structureType === STRUCTURE_EXTRACTOR);

            if(extractors.length === 0 && extractorSites.length === 0) {
                console.log('Placing extractor at hydrogen deposit (24, 13)');
                const result = room.createConstructionSite(24, 13, STRUCTURE_EXTRACTOR);
                console.log('Extractor placement result:', result);
            }
        }

        // Place storage near spawn
        const spawn = Game.spawns['Spawn1'];
        if(spawn) {
            const storages = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE
            });
            
            if(storages.length === 0) {
                const storagePos = {
                    x: spawn.pos.x + 2,
                    y: spawn.pos.y + 2
                };
                
                if(room.lookForAt(LOOK_STRUCTURES, storagePos.x, storagePos.y).length === 0) {
                    console.log('Placing storage near Annapolis');
                    const result = room.createConstructionSite(
                        storagePos.x,
                        storagePos.y,
                        STRUCTURE_STORAGE
                    );
                    console.log('Storage placement result:', result);
                }
            }
        }

        // Visualize planned structures using correct visual methods
        room.visual.circle(24, 13, {radius: 0.5, fill: '#ff0000', opacity: 0.3});
        if(spawn) {
            room.visual.circle(spawn.pos.x + 2, spawn.pos.y + 2, 
                {radius: 0.5, fill: '#00ff00', opacity: 0.3});
        }
    }

    // Add storage near spawn
    Game.rooms['YOUR_ROOM'].createConstructionSite(
        Game.spawns['Spawn1'].pos.x + 2,
        Game.spawns['Spawn1'].pos.y + 2,
        STRUCTURE_STORAGE
    );

    // Check if we need to build extensions
    if(room) {
        // Plan extensions in a pattern
        const spawn = Game.spawns['Spawn1'];
        if(spawn) {
            const extensions = room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_EXTENSION }
            });
            
            if(extensions.length < room.controller.level * 5) { // Max extensions per RCL
                // Create construction sites for new extensions
                const positions = [
                    {x: spawn.pos.x + 2, y: spawn.pos.y},
                    {x: spawn.pos.x - 2, y: spawn.pos.y},
                    {x: spawn.pos.x, y: spawn.pos.y + 2},
                    {x: spawn.pos.x, y: spawn.pos.y - 2}
                ];
                
                for(let pos of positions) {
                    if(room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y).length == 0) {
                        room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
                    }
                }
            }
        }

        // Plan tower placement
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });
        
        if(towers.length < 1 && room.controller.level >= 3) {
            room.createConstructionSite(
                spawn.pos.x + 3,
                spawn.pos.y + 3,
                STRUCTURE_TOWER
            );
        }
    }
} 