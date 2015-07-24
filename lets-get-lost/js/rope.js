
var nodes = 10;

var MASS = .1;
var restDistance = .2;
var springConstant = 10;

var DAMPING = 0.1;

var TIMESTEP = 1 / 1000;
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

function Rope(nodes) {
	nodes = nodes || 10;
	this.nodes = nodes;

	var particles = [];
	var springs = [];

	// nodes
	for (i = 0; i < nodes; i++) {
		particles.push(
				new Particle(i / nodes, 0, 0, MASS, i)
			);
	}

	// springs
	for (i = 0; i < nodes - 1; i++) {
		springs.push([
				particles[i],
				particles[i + 1],
				restDistance,
				springConstant
			]);
	}

	this.particles = particles;
	this.springs = springs;

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
		diff.multiplyScalar(-(this.springs[i][2] - len) * springConstant);

		this.particles[this.springs[i][0].idx].forces.sub(diff);
		this.particles[this.springs[i][1].idx].forces.add(diff);
	}
};

Rope.prototype.addSpringForces = function() {
	for (i = 0; i < this.springs.length; i++) {
		diff.subVectors(this.springs[i][0].position, 
						this.springs[i][1].position);
		var len = diff.length();

		// be careful with the signs
		diff.multiplyScalar(-(this.springs[i][2] - len) * springConstant);

		this.particles[this.springs[i][0].idx].forces.add(diff);
		this.particles[this.springs[i][1].idx].forces.sub(diff);
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
var rope = new Rope(5);
var driveTime = 0;
rope.addSpringForces(1);

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

function simulate(time) {
	if (!lastTime) {
		lastTime = time;
		return;
	}

	rope.removePreviousSpringForces();
	rope.addSpringForces();

	driveTime += TIMESTEP * 5;


//	rope.particles[1].position.setY(Math.sin(driveTime));

	for (i = 1; i < rope.nodes - 1; i++) {
		console.log("node #"+ i + " : Force " + rope.particles[i].forces.x + "   Pos " + rope.particles[i].position.x);
		rope.particles[i].stepForward(TIMESTEP_SQ);
	}

	var canvas = document.getElementById("rope-canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (i = 0; i < rope.nodes; i++) {
		var part = rope.particles[i];
	//	console.log(part.position.x * 100 + ", " + part.position.y * 100);
		ctx.fillStyle = colors[i % colors.length];
		ctx.fillRect(part.position.x * 300, part.position.y * 300 + 100, 10, 10);
	}

}