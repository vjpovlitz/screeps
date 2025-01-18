module.exports = {
    planRoads: function(room) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        
        // Clear previous path visualizations
        room.visual.clear();
        
        // Visualize and plan roads from spawn to each source
        sources.forEach((source, index) => {
            const path = room.findPath(spawn.pos, source.pos, {
                ignoreCreeps: true,
                swampCost: 2,
                plainCost: 2,
                costCallback: function(roomName, costMatrix) {
                    room.find(FIND_STRUCTURES).forEach(struct => {
                        if (struct.structureType === STRUCTURE_WALL) {
                            costMatrix.set(struct.pos.x, struct.pos.y, 255);
                        }
                    });
                }
            });

            // Visualize path with different colors for each source
            const colors = ['#ffaa00', '#00ffaa', '#00aaff'];
            const pathColor = colors[index % colors.length];
            
            // Draw path line
            room.visual.poly(path.map(p => [p.x, p.y]), {
                stroke: pathColor,
                lineStyle: 'dashed',
                opacity: 0.5
            });

            // Add distance information
            room.visual.text(
                `Distance: ${path.length}`,
                source.pos.x, 
                source.pos.y - 1,
                {color: pathColor, font: 0.5}
            );

            // Place construction sites for roads
            path.forEach(pos => {
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            });
        });

        // Visualize controller path
        const controllerPath = room.findPath(spawn.pos, controller.pos, {
            ignoreCreeps: true,
            swampCost: 2,
            plainCost: 2
        });
        
        room.visual.poly(controllerPath.map(p => [p.x, p.y]), {
            stroke: '#ffffff',
            lineStyle: 'dashed',
            opacity: 0.5
        });

        // Store paths in memory for reference
        if (!Memory.roomPaths) Memory.roomPaths = {};
        Memory.roomPaths[room.name] = {
            sourcePaths: sources.map(source => ({
                sourceId: source.id,
                path: room.findPath(spawn.pos, source.pos, {serialize: true})
            })),
            controllerPath: room.findPath(spawn.pos, controller.pos, {serialize: true})
        };
    },

    assignSources: function(creep) {
        if (!creep.memory.sourceId) {
            const bestSource = this.getOptimalSource(creep);
            if (bestSource) {
                creep.memory.sourceId = bestSource.id;
            }
        }
    },

    getOptimalSource: function(creep) {
        const sources = creep.room.find(FIND_SOURCES);
        let bestSource = null;
        let shortestDistance = Infinity;

        sources.forEach(source => {
            // Check source capacity
            const sourceCapacity = source.energy;
            if (sourceCapacity === 0) return;

            // Count existing harvesters at this source
            const harvestersAtSource = _.filter(Game.creeps, c => 
                c.memory.role === 'harvester' && 
                c.memory.sourceId === source.id
            ).length;

            // Skip if source is overcrowded (adjust 3 based on your needs)
            if (harvestersAtSource >= 3) return;

            // Calculate distance
            const distance = creep.pos.findPathTo(source).length;
            
            // Factor in both distance and current harvester count
            const score = distance * (1 + harvestersAtSource * 0.5);

            if (score < shortestDistance) {
                shortestDistance = score;
                bestSource = source;
            }
        });

        return bestSource;
    }
}; 