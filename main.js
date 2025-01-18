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

    // Show Maryland city names at sources
    const sources = room.find(FIND_SOURCES);
    sources.forEach((source, index) => {
        const name = index === 0 ? 'Frederick' : 'Baltimore';
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
    // Cache commonly used values
    const cpu_start = Game.cpu.getUsed();
    
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        // Cache room finds to avoid repeated searches
        const creeps = room.find(FIND_MY_CREEPS);
        const structures = room.find(FIND_MY_STRUCTURES);
        const sources = room.find(FIND_SOURCES);
        
        // Use cached creeps for filtering
        const creepsByRole = _.groupBy(creeps, c => c.memory.role);
        const harvesters = creepsByRole['harvester'] || [];
        const upgraders = creepsByRole['upgrader'] || [];
        const builders = creepsByRole['builder'] || [];

        console.log(`\n=== Room ${roomName} Performance Report ===`);
        
        // Energy efficiency
        const energyRatio = room.energyAvailable/room.energyCapacityAvailable;
        console.log(`\nEnergy Efficiency: ${Math.floor(energyRatio * 100)}%
    Current: ${room.energyAvailable}
    Capacity: ${room.energyCapacityAvailable}`);
        
        // Controller progress rate
        if(Memory.rooms && 
           Memory.rooms[roomName] && 
           Memory.rooms[roomName].lastProgress) {
            const progressRate = room.controller.progress - Memory.rooms[roomName].lastProgress;
            console.log(`\nController Progress Rate: ${progressRate}/tick
    Level: ${room.controller.level}
    Progress: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`);
        }
        
        // Initialize room memory if it doesn't exist
        if(!Memory.rooms) Memory.rooms = {};
        if(!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
        Memory.rooms[roomName].lastProgress = room.controller.progress;

        // Creep efficiency
        console.log(`\nCreep Efficiency:
    Harvesters: ${harvesters.length} (Target: 4)
    Upgraders: ${upgraders.length} (Target: 4)
    Builders: ${builders.length} (Target: 2)`);
        
        // Source utilization
        console.log('\nSource Utilization:');
        sources.forEach((source, index) => {
            const harvestersAtSource = _.filter(harvesters, 
                h => h.memory.sourceId === source.id).length;
            const efficiency = Math.min(harvestersAtSource * 2, 10) / 10; // 2 WORK parts per harvester
            console.log(`    Source ${index + 1}: ${Math.floor(efficiency * 100)}% utilized
    Energy: ${source.energy}/${source.energyCapacity}
    Harvesters: ${harvestersAtSource}/3`);
        });

        // Performance metrics
        const cpu_end = Game.cpu.getUsed();
        console.log(`\nPerformance Metrics:
    CPU Usage: ${(cpu_end - cpu_start).toFixed(2)} CPU
    Creeps per CPU: ${(creeps.length / (cpu_end - cpu_start)).toFixed(2)}
    Memory Usage: ${(RawMemory.get().length / 1024).toFixed(2)} KB`);
    }
}

module.exports.loop = function() {
    const mainLoopStart = Game.cpu.getUsed();

    // Batch memory cleanup
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
        
        // Restore your enhanced visuals
        enhancedVisuals(room);
        
        // Run managers
        const spawnCPUStart = Game.cpu.getUsed();
        spawnManager.run();
        const visualCPUStart = Game.cpu.getUsed();
        visualManager.run(room);

        // Show room energy status
        room.visual.text(
            `Room Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`,
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
        console.log(`\nTotal CPU Usage: ${totalCPU.toFixed(2)} (${(totalCPU/Game.cpu.limit * 100).toFixed(2)}% of limit)
Creep CPU: ${(Game.cpu.getUsed() - creepCPUStart).toFixed(2)}`);
    }
}; 