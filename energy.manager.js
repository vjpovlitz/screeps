module.exports = {
    run: function(room) {
        this.manageContainers(room);
        this.displayEnergyStats(room);
    },

    manageContainers: function(room) {
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER
        });

        // Track energy levels and distribution
        containers.forEach(container => {
            // Visual energy bar
            const energyPercent = container.store.getUsedCapacity(RESOURCE_ENERGY) / container.store.getCapacity(RESOURCE_ENERGY);
            room.visual.rect(
                container.pos.x - 0.5,
                container.pos.y - 0.25,
                1,
                0.1,
                {fill: '#555555'}
            );
            room.visual.rect(
                container.pos.x - 0.5,
                container.pos.y - 0.25,
                energyPercent,
                0.1,
                {fill: '#ffaa00'}
            );

            // Store container status in memory
            if(!Memory.containers) Memory.containers = {};
            Memory.containers[container.id] = {
                energy: container.store.getUsedCapacity(RESOURCE_ENERGY),
                capacity: container.store.getCapacity(RESOURCE_ENERGY),
                pos: container.pos
            };
        });
    },

    displayEnergyStats: function(room) {
        const sources = room.find(FIND_SOURCES);
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER
        });

        let stats = `Energy Network Status:\n`;
        stats += `Sources: ${sources.length}\n`;
        stats += `Containers: ${containers.length}\n`;
        stats += `Total Storage: ${this.getTotalStorage(containers)}\n`;
        
        room.visual.text(
            stats,
            1,
            3,
            {align: 'left', opacity: 0.8}
        );
    },

    getTotalStorage: function(containers) {
        return containers.reduce((total, container) => 
            total + container.store.getUsedCapacity(RESOURCE_ENERGY), 0);
    },

    // Get optimal energy source for a creep
    getEnergySource: function(creep) {
        const room = creep.room;
        
        // Priority order: Containers > Sources
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER &&
                        s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });

        if(containers.length > 0) {
            // Find closest non-empty container
            const container = creep.pos.findClosestByPath(containers);
            if(container) {
                return container;
            }
        }

        // Fallback to sources
        return creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    }
}; 