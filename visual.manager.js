module.exports = {
    run: function(room) {
        // Display creep names and roles
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.room.name === room.name) {
                // Display custom name above creep
                const displayName = creep.memory.customName || creep.name;
                room.visual.text(
                    `${displayName} (${creep.memory.role})`,
                    creep.pos.x,
                    creep.pos.y - 0.5,
                    {
                        align: 'center',
                        opacity: 1,
                        color: this.getRoleColor(creep.memory.role),
                        stroke: '#000000',
                        strokeWidth: 0.2,
                        font: 0.5
                    }
                );
            }
        }
    },

    getRoleColor: function(role) {
        const colors = {
            harvester: '#ffaa00',
            upgrader: '#33ff33',
            builder: '#00aaff'
        };
        return colors[role] || '#ffffff';
    }
}; 