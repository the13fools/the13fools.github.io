var ropeDemo = {

    data: {
        fps: +30,
        intervalId: null,
        gravity: +9.81,
        pixelsPerMeter: +200
    },

    context: {
        canvas: null,
        drawingContext: null,
        size: { w: +0, h: +0 },
        center: { x: +0, y: +0 },
        mouse: { x: +0, y: +0 },
        isGrabbing: false
    },

    DrawOverride: function () { throw "Not implemented"; },

    ThinkOverride: function () { throw "Not implemented"; },

    Step: function () {
        ropeDemo.ThinkOverride();
        ropeDemo.DrawOverride();
    },

    StartOverride: function () { throw "Not implemented"; },

    Start: function () {
        ropeDemo.StartOverride();
        ropeDemo.data.intervalId = setInterval(ropeDemo.Step, +1000 / ropeDemo.data.fps);
    },

    Stop: function () {
        clearInterval(ropeDemo.data.intervalId);
    },

    Initialize: function () {
        // Gather data
        ropeDemo.context.canvas = document.getElementById("RopeDrawingArea");
        ropeDemo.context.drawingContext = ropeDemo.context.canvas.getContext("2d");
        ropeDemo.context.size.w = ropeDemo.context.canvas.width;
        ropeDemo.context.size.h = ropeDemo.context.canvas.height;
        ropeDemo.context.center.x = ropeDemo.context.size.w * +0.5;
        ropeDemo.context.center.y = ropeDemo.context.size.h * +0.5;

        ropeDemo.context.canvas.onmousemove = function (e) {
            if (e.offsetX) {
                ropeDemo.context.mouse.x = e.offsetX;
                ropeDemo.context.mouse.y = e.offsetY;
            } else if (e.layerX) {
                ropeDemo.context.mouse.x = e.layerX;
                ropeDemo.context.mouse.y = e.layerY;
            }
        };

        ropeDemo.context.canvas.onmousedown = function (e) {
            ropeDemo.context.isGrabbing = true;
        };

        ropeDemo.context.canvas.onmouseup = function (e) {
            ropeDemo.context.isGrabbing = false;
        };

        ropeDemo.context.canvas.onmouseout = function (e) {
            ropeDemo.context.isGrabbing = false;
        };

        // Start application
        ropeDemo.Start();
    }
};

//document.onload = "app.Initialize";
//window.onload = ropeDemo.Initialize;
