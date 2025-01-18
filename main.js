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
const roadPlanner = require('road.planner');

// Restore your enhanced visuals function
function enhancedVisuals(room) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if(spawn) {
        // Show Annapolis
        room.visual.text('🏛️ Annapolis',
            spawn.pos.x, spawn.pos.y - 1,
            {color: '#ffffff', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
        );

        // Show future tower location
        room.visual.text('🗼 Future Tower',
            spawn.pos.x + 2, spawn.pos.y + 1,
            {color: '#ff0000', stroke: '#000000', strokeWidth: 0.2, font: 0.5}
        );
        
        // Visualize tower range
        room.visual.circle(spawn.pos.x + 2, spawn.pos.y + 2, {
            radius: 5,
            fill: 'transparent',
            stroke: '#ff0000',
            strokeWidth: 0.2,
            opacity: 0.3
        });
    }

    // Show Maryland city names at sources - Baltimore and Frederick swapped
    const sources = room.find(FIND_SOURCES);
    sources.forEach((source, index) => {
        const name = index === 0 ? 'Baltimore' : 'Frederick';  // Swapped the names here
        room.visual.text(`⚡ ${name}`,
            source.pos.x, source.pos.y - 1,
            {color: '#ffaa00', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
        );

        // Show energy stats
        room.visual.text(
            `Energy: ${source.energy}/${source.energyCapacity}`,
            source.pos.x, source.pos.y - 0.5,
            {color: '#ffffff', stroke: '#000000', strokeWidth: 0.1, font: 0.5}
        );
    });

    // Show controller progress
    if(room.controller) {
        room.visual.text(
            `RCL ${room.controller.level}: ${room.controller.progress}/${room.controller.progressTotal}`,
            room.controller.pos.x, room.controller.pos.y - 1,
            {color: '#33ff33', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
        );
    }

    // Visualize roads and paths
    visualizeRoads(room);
}

// Restore your road visualization
function visualizeRoads(room) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if(!spawn) return;

    const sources = room.find(FIND_SOURCES);
    sources.forEach(source => {
        const path = room.findPath(spawn.pos, source.pos, {
            ignoreCreeps: true,
            swampCost: 2,
            plainCost: 2
        });
        
        room.visual.poly(path.map(p => [p.x, p.y]), {
            stroke: '#ffffff',
            lineStyle: 'dashed',
            opacity: 0.3
        });
    });

    // Visualize path to controller
    if(room.controller) {
        const controllerPath = room.findPath(spawn.pos, room.controller.pos, {
            ignoreCreeps: true,
            swampCost: 2,
            plainCost: 2
        });
        
        room.visual.poly(controllerPath.map(p => [p.x, p.y]), {
            stroke: '#ffaa00',
            lineStyle: 'dashed',
            opacity: 0.3
        });
    }
}

function showDetailedStatus() {
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const creeps = room.find(FIND_MY_CREEPS);
        const structures = room.find(FIND_MY_STRUCTURES);
        const sources = room.find(FIND_SOURCES);
        
        const creepsByRole = _.groupBy(creeps, c => c.memory.role);
        const harvesters = creepsByRole['harvester'] || [];
        const upgraders = creepsByRole['upgrader'] || [];
        const builders = creepsByRole['builder'] || [];

        console.log(`\n=== Room ${roomName} Status ===`);
        
        // Energy efficiency
        const energyRatio = room.energyAvailable/room.energyCapacityAvailable;
        console.log(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${Math.floor(energyRatio * 100)}%)`);
        
        // Controller progress
        if(room.controller) {
            console.log(`Controller Level ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`);
        }

        // Creep counts only
        console.log(`Creeps: H:${harvesters.length}/4 U:${upgraders.length}/4 B:${builders.length}/2`);
        
        // Source status
        sources.forEach((source, index) => {
            const name = index === 0 ? 'Baltimore' : 'Frederick';
            console.log(`${name}: ${source.energy}/${source.energyCapacity}`);
        });

        // Construction sites
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        if(sites.length > 0) {
            console.log(`Building: ${sites.length} construction sites`);
        }
    }
}

module.exports.loop = function() {
    const mainLoopStart = Game.cpu.getUsed();

    // Batch memory cleanup (silently)
    if(Game.time % 100 === 0) {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }

    // Run room logic and visualizations
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        enhancedVisuals(room);
        spawnManager.run();
        visualManager.run(room);
        roadPlanner.run(room);
        towerManager.run(room);

        room.visual.text(
            `Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            1, 1,
            {align: 'left', opacity: 0.8}
        );
    }

    // Run creep logic
    const creeps = Game.creeps;
    const creepCPUStart = Game.cpu.getUsed();
    for(let name in creeps) {
        const creep = creeps[name];
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

    // Performance reporting every 30 ticks
    if(Game.time % 30 === 0) {
        showDetailedStatus();
        const totalCPU = Game.cpu.getUsed() - mainLoopStart;
        console.log(`CPU: ${totalCPU.toFixed(2)}/${Game.cpu.limit} (${(totalCPU/Game.cpu.limit * 100).toFixed(1)}%)`);
    }
}; 