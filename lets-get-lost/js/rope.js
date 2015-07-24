
var nodes = 10;
var rope = new Rope(10);
rope.addSpringForces();

var MASS = .1;
var restDistance = 25;
var springConstant = 1;

var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

function Particle(x, y, z, mass) {
	// read/write
	this.position = new THREE.Vector3(x, y, 0); // current 
	this.forces = new THREE.Vector3(0, 0, 0); // F = ma -> F * 1/m = a

	// read only
	this.previousPosition = new THREE.Vector3(x, y, 0); 
	this.original = new THREE.Vector3(x, y, 0);
	this.invMass = 1 / mass;

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
				new Particle(i / nodes, 0, 0, MASS)
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
		diff.subVectors(this.springs[0].previousPosition, 
						this.springs[1].previousPosition);
		var len = diff.length();

		// be careful with the signs here
		diff.multiplyScalar((this.springs[2] - len) * springConstant);

		this.springs[0].forces.sub(diff);
		this.springs[1].forces.add(diff);
	}
}

Rope.prototype.addSpringForces = function() {
	for (i = 0; i < this.springs.length; i++) {
		diff.subVectors(this.springs[0].position, 
						this.springs[1].position);
		var len = diff.length();

		// be careful with the signs
		diff.multiplyScalar((this.springs[2] - len) * springConstant);

		this.springs[0].forces.add(diff);
		this.springs[1].forces.sub(diff);
	}

}



// Perform verlet integration.  
// x_n+1 = x_n + v(x_n)dt + a(x_n) dt^2
// x_n+1 = x_n + (x_n - x_n-1) + a(x_n) dt^2
// But actually, we want to have a damping term on the velocity approximation, so we do
// x_n+1 = x_n + (1 - damping) * (x_n - x_n-1) + a(x_n) dt^2
// x_n+1 = (2 - damping) * x_n - x_n-1 + a(x_n) dt^2
var DAMPING = 0.03;
Particle.prototype.stepForward = function(timesq) {
	this.tmp.copy(this.position);
	this.tmp.multiplyScalar(2 - DAMPING);
	this.tmp.sub(this.previousPosition);
	this.tmp.add(this.getAcceleration().multiplyScalar(timesq));

	this.previousPosition = this.position;
	this.position = this.tmp;
}

function simulate(time) {
	if (!lastTime) {
		lastTime = time;
		return;
	}

	rope.removePreviousSpringForces();
	rope.addSpringForces();

	for (i = 1; i < rope.length - 1; i++) {
		rope.particles[i].stepForward(TIMESTEP_SQ);
	}

}