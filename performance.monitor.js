module.exports = {
    run: function(room) {
        // Run every 10 ticks
        if(Game.time % 10 !== 0) return;

        // Initialize memory structure
        if(!Memory.stats) {
            Memory.stats = {
                gcl: {},
                rooms: {},
                cpu: {}
            };
        }

        // Track GCL (Global Control Level) progress
        Memory.stats.gcl = {
            progress: Game.gcl.progress,
            progressTotal: Game.gcl.progressTotal,
            level: Game.gcl.level
        };

        // Track room-specific progress
        Memory.stats.rooms[room.name] = {
            // Controller progress
            controllerProgress: room.controller.progress,
            controllerProgressTotal: room.controller.progressTotal,
            controllerLevel: room.controller.level,
            
            // Energy metrics
            energyAvailable: room.energyAvailable,
            energyCapacityAvailable: room.energyCapacityAvailable,
            
            // Creep counts
            creeps: _.countBy(room.find(FIND_MY_CREEPS), 'memory.role'),
            
            // Structure counts
            structures: _.countBy(room.find(FIND_MY_STRUCTURES), 'structureType'),
            
            // Construction sites
            constructionSites: room.find(FIND_CONSTRUCTION_SITES).length,
            
            // Resource gathering
            harvestedEnergy: room.memory.harvestedEnergy || 0,
            
            // Upgrade progress rate (per tick)
            upgradeRate: (room.memory.lastProgress) 
                ? (room.controller.progress - room.memory.lastProgress) / 10
                : 0
        };

        // Store current progress for next comparison
        room.memory.lastProgress = room.controller.progress;

        // CPU tracking
        Memory.stats.cpu = {
            current: Game.cpu.getUsed(),
            limit: Game.cpu.limit,
            bucket: Game.cpu.bucket
        };

        // Add to visual manager
        this.displayPerformanceMetrics(room);
    },

    displayPerformanceMetrics: function(room) {
        const dashX = 35;  // Align with your existing dashboard
        const dashY = 15;  // Position below your existing dashboard
        const lineHeight = 1.2;

        // Draw background
        room.visual.rect(dashX - 0.5, dashY - 0.5, 25, 6, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff'
        });

        // Performance Metrics
        const stats = Memory.stats.rooms[room.name];
        const upgradeRate = stats.upgradeRate.toFixed(2);
        const cpuEfficiency = ((Memory.stats.cpu.current / Memory.stats.cpu.limit) * 100).toFixed(1);

        room.visual.text(
            `📈 Performance Metrics:`,
            dashX, dashY,
            {align: 'left', color: '#00ff00', font: 0.8}
        );

        room.visual.text(
            `Upgrade Rate: ${upgradeRate}/tick`,
            dashX, dashY + lineHeight,
            {align: 'left', color: '#ffffff', font: 0.7}
        );

        room.visual.text(
            `CPU Efficiency: ${cpuEfficiency}%`,
            dashX, dashY + lineHeight * 2,
            {align: 'left', color: '#ffffff', font: 0.7}
        );

        // Suggestions based on metrics
        let suggestion = '';
        if(Memory.stats.cpu.current < 5) {
            if(stats.creeps.upgrader < 3) {
                suggestion = '💡 Can add more upgraders';
            } else if(stats.constructionSites < 5) {
                suggestion = '💡 Can plan more construction';
            }
        }

        if(suggestion) {
            room.visual.text(
                suggestion,
                dashX, dashY + lineHeight * 3,
                {align: 'left', color: '#ffaa00', font: 0.7}
            );
        }
    }
}; 