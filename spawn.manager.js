// This is correct
const roleHarvester = require('role.harvester');

// Don't use these
// const roleHarvester = require('./role.harvester.js');  // wrong
// const roleHarvester = require('/role.harvester');      // wrong

module.exports = {
    run: function() {
        // Clear memory of dead creeps first
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
        
        console.log('Harvesters: ' + harvesters.length); // Debug log
        
        // Check if we can spawn
        const spawn = Game.spawns['Spawn1'];
        
        // Define basic body parts
        const bodyParts = [WORK, CARRY, MOVE];
        const energyCost = 200; // 100 + 50 + 50 for WORK + CARRY + MOVE

        // Try to spawn more harvesters first
        if(harvesters.length < 4) {
            if(spawn.room.energyAvailable >= energyCost) {
                const newName = 'Harvester' + Game.time;
                console.log('Attempting to spawn harvester: ' + newName); // Debug log
                const result = spawn.spawnCreep(bodyParts, newName, 
                    {memory: {role: 'harvester'}});
                
                if(result == OK) {
                    console.log('Successfully spawning new harvester: ' + newName);
                } else {
                    console.log('Failed to spawn harvester with error: ' + result);
                }
            } else {
                console.log('Waiting for energy: ' + spawn.room.energyAvailable + '/' + energyCost);
            }
        }
        // Then try upgraders
        else if(upgraders.length < 2 && spawn.room.energyAvailable >= energyCost) {
            const newName = 'Upgrader' + Game.time;
            spawn.spawnCreep(bodyParts, newName,
                {memory: {role: 'upgrader'}});
        }

        // Visual notification when spawning
        if(spawn.spawning) { 
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawn.pos.x + 1, 
                spawn.pos.y, 
                {align: 'left', opacity: 0.8});
        }
    }
}; 