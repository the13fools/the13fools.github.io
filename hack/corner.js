// Add your own moods, or give this button a completely different job.
const moods = ['curious', 'wandering', 'making something strange', 'thinking about moss'];
let index = 0;
document.querySelector('#change-mood').addEventListener('click', () => {
  index = (index + 1) % moods.length;
  document.querySelector('#mood').textContent = moods[index];
});
console.log('Your little corner is ready to change.');
