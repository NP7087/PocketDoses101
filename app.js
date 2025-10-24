

const medListEl = document.getElementById('medList');
const addForm = document.getElementById('addForm');
const permEl = document.getElementById('perm');
const clearAllBtn = document.getElementById('clearAll');

let meds = []; 
let idCounter = 1;
let shownToday = {}; 
async function ensureNotifPerm(){
  if (!("Notification" in window)) { permEl.textContent = 'not supported'; return false; }
  if (Notification.permission === 'granted') { permEl.textContent = 'granted'; return true; }
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    permEl.textContent = res;
    return res === 'granted';
  }
  permEl.textContent = 'denied';
  return false;
}


addForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const time = document.getElementById('time').value; // "HH:MM"
  const qty = Number(document.getElementById('qty').value);
  const dose = Number(document.getElementById('dose').value) || 1;
  if (!name || !time || isNaN(qty)) return;

  meds.push({ id: idCounter++, name, time, qty, dose });
  render();
  addForm.reset();
});


clearAllBtn.addEventListener('click', () => {
  if (!confirm('Clear all medicines?')) return;
  meds = []; idCounter = 1; shownToday = {};
  render();
});


function render(){
  medListEl.innerHTML = '';
  meds.forEach(m => {
    const li = document.createElement('li');
    li.className = 'item' + (m.qty < 3 ? ' low' : '');
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<b>${escapeHtml(m.name)}</b>
                      <div>Time: <span class="badge">${m.time}</span>
                      &nbsp; Qty: <span class="badge">${m.qty}</span>
                      &nbsp; Dose: <span class="badge">${m.dose}</span></div>`;
    const controls = document.createElement('div');
    controls.className = 'controls';

    const takeBtn = document.createElement('button');
    takeBtn.textContent = 'Taken';
    takeBtn.onclick = () => {
      m.qty = Math.max(0, m.qty - m.dose);
      render();
    };

    const checkBtn = document.createElement('button');
    checkBtn.textContent = 'Check online';
    checkBtn.onclick = () => {
      const q = encodeURIComponent(m.name + ' buy medicine');
      window.open(`https://www.google.com/search?q=${q}`, '_blank');
    };

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => {
      meds = meds.filter(x => x.id !== m.id);
      render();
    };

    controls.appendChild(takeBtn);
    controls.appendChild(checkBtn);
    controls.appendChild(delBtn);

    li.appendChild(meta);
    li.appendChild(controls);
    medListEl.appendChild(li);
  });
}


function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function checkReminders(){
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);
  const todayKey = new Date().toDateString();

  meds.forEach(m => {
    if (m.time === hhmm) {
      
      shownToday[todayKey] = shownToday[todayKey] || {};
      if (shownToday[todayKey][m.id]) return;
     
      if (Notification.permission === 'granted') {
        try {
          const n = new Notification('Medicine reminder', {
            body: `Take ${m.name} — dose ${m.dose}`,
            tag: `med-${m.id}-${todayKey}`
          });
          n.onclick = () => window.focus();
        } catch (e) {
          alert(`Take ${m.name} — dose ${m.dose}`);
        }
      } else {
        alert(`Take ${m.name} — dose ${m.dose}`);
      }
      shownToday[todayKey][m.id] = true;
      
    }
  });

 
  const keys = Object.keys(shownToday);
  keys.forEach(k => { if (k !== todayKey) delete shownToday[k]; });
}


(async function init(){
  await ensureNotifPerm();
  render();
 
  checkReminders();
  
  setInterval(checkReminders, 20000);
})();
