ropeDemo.rope = {
    items: [],
    nbItems: +30,
    length: +250,
    relaxationIterations: +40
};

ropeDemo.DrawOverride = function () {
    ropeDemo.context.drawingContext.clearRect(0, 0, ropeDemo.context.size.w, ropeDemo.context.size.h);

    // Draw nodes
    for (var index in ropeDemo.rope.items) {
        var item = ropeDemo.rope.items[index];

        // Draw rope nodes
        if (!item.isPinned) {
            ropeDemo.context.drawingContext.fillRect(
                item.x - 1 + ropeDemo.context.center.x,
                item.y - 1 + ropeDemo.context.center.y,
                +2, +2);
        } else {
            ropeDemo.context.drawingContext.fillRect(
                item.x - 3 + ropeDemo.context.center.x,
                item.y - 3 + ropeDemo.context.center.y,
                +6, +6);
        }
    }

    // Draw segments
    ropeDemo.context.drawingContext.beginPath();
    for (var index in ropeDemo.rope.items) {
        var item = ropeDemo.rope.items[index];

        if (index == 0) {
            ropeDemo.context.drawingContext.moveTo(item.x + ropeDemo.context.center.x, item.y + ropeDemo.context.center.y);
        } else {
            ropeDemo.context.drawingContext.lineTo(item.x + ropeDemo.context.center.x, item.y + ropeDemo.context.center.y);
        }
    }
    ropeDemo.context.drawingContext.stroke();
    ropeDemo.context.drawingContext.closePath();
};

ropeDemo.ThinkOverride = function () {
    var itemLength = ropeDemo.rope.length / ropeDemo.rope.nbItems;
    var ellapsedTime = +1 / ropeDemo.data.fps;

    if (ropeDemo.context.isGrabbing) {
        ropeDemo.rope.items[0].x = ropeDemo.context.mouse.x - ropeDemo.context.center.x;
        ropeDemo.rope.items[0].y = ropeDemo.context.mouse.y - ropeDemo.context.center.y;
    }

    // Apply verlet integration
    for (var index in ropeDemo.rope.items) {
        var item = ropeDemo.rope.items[index];

        var old_x = item.x;
        var old_y = item.y;


        if (!item.isPinned) {
            physic.ApplyUnitaryVerletIntegration(item, ellapsedTime, ropeDemo.data.gravity, ropeDemo.data.pixelsPerMeter);
        }

        item.old_x = old_x;
        item.old_y = old_y;
    }

    // Apply relaxation
    for (var iterations = 0; iterations < ropeDemo.rope.relaxationIterations; iterations++) {

        for (var index in ropeDemo.rope.items) {
            var item = ropeDemo.rope.items[index];

            if (!item.isPinned) {
                if (index > +0) {
                    var previous = ropeDemo.rope.items[+index - 1];
                    physic.ApplyUnitaryDistanceRelaxation(item, previous, itemLength);
                }
            }
        }

        for (var index in ropeDemo.rope.items) {
            var item = ropeDemo.rope.items[ropeDemo.rope.nbItems - 1 - index];

            if (!item.isPinned) {
                if (index > 0) {
                    var next = ropeDemo.rope.items[ropeDemo.rope.nbItems - index];
                    physic.ApplyUnitaryDistanceRelaxation(item, next, itemLength);
                }
            }
        }
    }
};

ropeDemo.StartOverride = function () {
    ropeDemo.rope.items = [];
    for (var i = 0; i < ropeDemo.rope.nbItems; i++) {
        var x = i * ropeDemo.rope.length / ropeDemo.rope.nbItems;
        ropeDemo.rope.items[i] = {
            x: x,
            y: +0,
            old_x: x,
            old_y: +0,
            isPinned: false
        };
    }

    ropeDemo.rope.items[0].isPinned = true;
};