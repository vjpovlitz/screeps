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
        if(Memory.rooms[roomName]?.lastProgress) {
            const progressRate = room.controller.progress - Memory.rooms[roomName].lastProgress;
            console.log(`\nController Progress Rate: ${progressRate}/tick
    Level: ${room.controller.level}
    Progress: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`);
        }
        Memory.rooms[roomName] = Memory.rooms[roomName] || {};
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
    // Use CPU profiling
    const mainLoopStart = Game.cpu.getUsed();

    // Batch memory cleanup
    if(Game.time % 100 === 0) {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }

    // Cache room data
    const rooms = Game.rooms;
    for(let roomName in rooms) {
        const room = rooms[roomName];
        
        // Run managers with CPU tracking
        const spawnCPUStart = Game.cpu.getUsed();
        spawnManager.run();
        const visualCPUStart = Game.cpu.getUsed();
        visualManager.run(room);
        
        if(Game.time % 30 === 0) {
            console.log(`Manager CPU Usage:
    Spawn: ${(visualCPUStart - spawnCPUStart).toFixed(2)}
    Visual: ${(Game.cpu.getUsed() - visualCPUStart).toFixed(2)}`);
        }
    }

    // Batch process creeps
    const creeps = Game.creeps;
    const creepCPUStart = Game.cpu.getUsed();
    for(let name in creeps) {
        const creep = creeps[name];
        // Use switch for faster role checking
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

    // Performance reporting
    if(Game.time % 30 === 0) {
        showDetailedStatus();
        const totalCPU = Game.cpu.getUsed() - mainLoopStart;
        console.log(`\nTotal CPU Usage: ${totalCPU.toFixed(2)} (${(totalCPU/Game.cpu.limit * 100).toFixed(2)}% of limit)
Creep CPU: ${(Game.cpu.getUsed() - creepCPUStart).toFixed(2)}`);
    }
}; 