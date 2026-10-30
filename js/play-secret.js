/* A tiny secret for curious visitors. No storage, sound, or network requests. */
(() => {
  const creature = document.getElementById('moss-secret');
  const club = document.getElementById('moss-club');
  const patches = document.getElementById('moss-patches');
  const water = document.getElementById('water-moss');
  const note = document.getElementById('moss-note');
  if (!creature || !club || !patches || !water || !note || typeof club.showModal !== 'function') return;
  const initialGarden = patches.innerHTML;
  let previousFocus, growth = 0;
  function openClub() {
    if (club.open) return;
    previousFocus = document.activeElement;
    club.showModal();
  }
  creature.disabled = false;
  creature.addEventListener('click', openClub);
  club.addEventListener('close', () => {
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  });
  // The old cheat code works, too. Leave typing fields and editor shortcuts alone.
  const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let keys = [];
  addEventListener('keydown', event => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || club.open) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]')) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys.push(key); keys = keys.slice(-code.length);
    if (keys.length === code.length && keys.every((value, index) => value === code[index])) { keys = []; openClub(); }
  });
  water.addEventListener('click', () => {
    if (growth === 12) {
      growth = 0; patches.innerHTML = initialGarden;
      note.textContent = 'A fresh little patch. There is time.';
      water.textContent = 'Water the moss ✳';
      return;
    }
    const x = 61 + (growth * 47 % 194), y = 140 + (growth % 3) * 6;
    const patch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    patch.setAttribute('d', `M${x-12} ${y}q-3 -13 8 -12q6 -15 13 0q13 -2 10 12Z`);
    patch.setAttribute('fill', ['#b1f35d','#82cd74','#d2ed79'][growth % 3]);
    patches.append(patch); growth++;
    note.textContent = growth === 12 ? 'A tiny forest. That’ll do.' : ['A little greener.', 'The moss is in no hurry.', 'Small things count.'][growth % 3];
    if (growth === 12) water.textContent = 'Begin a fresh patch ↺';
  });
})();
