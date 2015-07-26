
var nodes = 10;

var MASS = .01;
var springRestDistance;
var springConstant = 10000;

var DAMPING = 0;

var TIMESTEP = 10 / 10000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var lastTime;


function Particle(x, y, z, mass, index) {
	// read/write
	this.position = new THREE.Vector3(x, y, 0); // current 
	this.forces = new THREE.Vector3(0, 0, 0); // F = ma -> F * 1/m = a

	// read only
	this.previousPosition = new THREE.Vector3(x, y, 0); 
	this.original = new THREE.Vector3(x, y, 0);
	this.invMass = 1 / mass;
	this.idx = index;

	// private 
	this.a = new THREE.Vector3(0, 0, 0); // acceleration
	this.tmp = new THREE.Vector3();
}

// F = ma -> F * 1/m = a
Particle.prototype.getAcceleration = function() {
		this.a.copy(this.forces).multiplyScalar(this.invMass);
		return this.a;
}

function Constraint(p1, p2, restLength, allowedStretch) {
	this.p1 = p1;
	this.p2 = p2;
	this.restLength = restLength;
	this.allowedStretch = allowedStretch;
}

function Rope(nodes) {
	nodes = nodes || 10;
	this.nodes = nodes;
	var tension = .1;
	springRestDistance = 1 / ((nodes - 1) * 1.1);

	var particles = [];
	var springs = [];
	var constraints = [];

	// nodes
	for (i = 0; i < nodes; i++) {
		particles.push(
				new Particle(i / (nodes - 1), 0, 0, MASS, i)
			);
	}

	// TODO: make this it's own object
	// springs
	for (i = 0; i < nodes - 1; i++) {
		springs.push([
				particles[i],
				particles[i + 1],
				springRestDistance,
				springConstant
			]);
	}


	// constraints (to model connections as inf strength springs beyond certain point)
	stretchPercentage = 0;
	restDistance = 1 / (nodes - 1);
	for (i = 0; i < nodes - 1; i++) {
		constraints.push(new Constraint(
				particles[i],
				particles[i + 1],
				restDistance,
				stretchPercentage));
	}


	this.particles = particles;
	this.springs = springs;
	this.constraints = constraints;

}

var diff = new THREE.Vector3();
Rope.prototype.removePreviousSpringForces = function() {
	// We are modelling connections using Hooke's law: 
	// F = kX, where X is declenation from the "natural" length
	for (i = 0; i < this.springs.length; i++) {
		diff.subVectors(this.springs[i][0].previousPosition, 
						this.springs[i][1].previousPosition);
		var len = diff.length();

		// be careful with the signs here
		diff.multiplyScalar((this.springs[i][2] - len) * 
			springConstant);

		this.particles[this.springs[i][0].idx].forces.sub(diff);
		this.particles[this.springs[i][1].idx].forces.add(diff);
	}
};

Rope.prototype.addSpringForces = function() {
	for (i = 0; i < this.springs.length; i++) {
		diff.subVectors(this.springs[i][0].position, 
						this.springs[i][1].position);
		var len = diff.length();

		// be careful with the signs here
		diff.multiplyScalar((this.springs[i][2] - len) *
			springConstant);

		this.particles[this.springs[i][0].idx].forces.add(diff);
		this.particles[this.springs[i][1].idx].forces.sub(diff);
	}

};

Rope.prototype.enforceConstraints = function() {
	for (i = 0; i < this.constraints.length; i++) {
		var con = this.constraints[i];
		diff.subVectors(con.p1.position, 
						con.p2.position);
		var len = diff.length();
		var targetDist = con.restLength * (1 + con.allowedStretch / 10000);

		if (len > targetDist || len < con.restLength) {
			var correction = diff.multiplyScalar(1 - targetDist / len);
			var correctionHalf = correction.multiplyScalar(0.5);
			con.p1.position.sub(correctionHalf);
			con.p2.position.add(correctionHalf);
		}
	}

};



// Perform verlet integration.  
// x_n+1 = x_n + v(x_n)dt + a(x_n) dt^2
// x_n+1 = x_n + (x_n - x_n-1) + a(x_n) dt^2
// But actually, we want to have a damping term on the velocity approximation, so we do
// x_n+1 = x_n + (1 - damping) * (x_n - x_n-1) + a(x_n) dt^2
// x_n+1 = (2 - damping) * x_n - x_n-1 + a(x_n) dt^2
Particle.prototype.stepForward = function(timesq) {
	this.tmp.copy(this.position);
	this.tmp.multiplyScalar(2 - DAMPING);
	this.tmp.sub(this.previousPosition.multiplyScalar(1 - DAMPING));
	this.tmp.add(this.getAcceleration().multiplyScalar(timesq));

	this.previousPosition.copy(this.position);
	this.position.copy(this.tmp);
}


// This is down here because function calls need to come after definitions.  
// Should really exist across a few files.
var rope = new Rope(100);
var driveTime = 0;
//rope.addSpringForces();
//rope.particles[ ~~(rope.nodes / 8)].position
//	.setY(rope.particles[~~(rope.nodes / 8)].position.y + .2);
// rope.particles[1].position.setX(1 / (rope.nodes - 1));

var colors = ["#a50026",
				"#d73027",
				"#f46d43",
				"#fdae61",
				"#fee090",
				"#ffffbf",
				"#e0f3f8",
				"#abd9e9",
				"#74add1",
				"#4575b4",
				"#313695"];

var frequencyMultiplier = 1;

function simulate(time) {
	if (!lastTime) {
		lastTime = time;
		return;
	}

	driveTime += TIMESTEP * frequencyMultiplier;

	// Step through the simulation several times per animation
	for (step = 0; step < 1; step++) {
//		rope.removePreviousSpringForces();
//		rope.addSpringForces();

		for (i = 1; i < rope.nodes - 1; i++) {
	//		console.log("node #"+ i + " : Force " + rope.particles[i].forces.x + "   Pos " + rope.particles[i].position.x);
			rope.particles[i].stepForward(TIMESTEP_SQ);
		}

		  rope.enforceConstraints();
	//	  rope.particles[0].position.set(0, 0, 0);
		  rope.particles[1].position.set(0, Math.sin(driveTime) / 5, -.01);
//		  rope.particles[1].position.set(0, 0, .1);
		  rope.particles[rope.nodes - 1].position.set(1, 0, 0);
	}

	var canvas = document.getElementById("rope-canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (i = 0; i < rope.nodes; i++) {
		var part = rope.particles[i];
	//	console.log(part.position.x * 100 + ", " + part.position.y * 100);
		ctx.fillStyle = colors[i % colors.length];
		ctx.fillRect(part.position.x * 400 + 200, part.position.y * 100 + 100, 10, 10);
	}

}