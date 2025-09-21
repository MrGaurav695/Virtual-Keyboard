(function(){
  const layout = [
    ['`','1','2','3','4','5','6','7','8','9','0','-','=', 'Backspace'],
    ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
    ['Caps','a','s','d','f','g','h','j','k','l',';','\'','Enter'],
    ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
    ['Space']
  ];

  const displayMap = {
    'Backspace':'⌫','Tab':'↹','Enter':'⏎','Shift':'⇧','Caps':'Caps','Space':'␣','`':'`'
  };

  const rows = [
    document.getElementById('row1'),
    document.getElementById('row2'),
    document.getElementById('row3'),
    document.getElementById('row4'),
    document.getElementById('row5')
  ];
  const typedEl = document.getElementById('typed');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const toggleSoundBtn = document.getElementById('toggleSound');
  const soundStateEl = document.getElementById('soundState');

  let internalText = '';
  let caps = false;
  let shiftDown = false;
  let soundEnabled = true;

  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e){ audioCtx = null; }
  }
  function playBeep() {
    if (!soundEnabled) return;
    initAudio();
    if(!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.001);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.15);
  }

  function makeKey(key){
    const el = document.createElement('div');
    el.className = 'key';
    el.tabIndex = 0;
    el.setAttribute('role','button');
    el.setAttribute('aria-label', 'Key ' + key);

    if (['Backspace','Enter','Shift','Caps','Tab'].includes(key)) el.classList.add('wide');
    if (key === 'Space') el.classList.add('extra-wide');

    el.innerHTML = `<span class="label-primary">${displayMap[key] || key}</span>`;
    el.dataset.key = key;
    return el;
  }

  layout.forEach((rowArr, i) => {
    rowArr.forEach(k => rows[i].appendChild(makeKey(k)));
  });

  function refreshTyped(){
    typedEl.textContent = internalText;
    typedEl.scrollTop = typedEl.scrollHeight;
  }

  function handleKeyPress(key){
    if (key === 'Backspace') { internalText = internalText.slice(0, -1); refreshTyped(); return; }
    if (key === 'Enter') { internalText += '\n'; refreshTyped(); return; }
    if (key === 'Tab') { internalText += '\t'; refreshTyped(); return; }
    if (key === 'Space') { internalText += ' '; refreshTyped(); return; }
    if (key === 'Caps') { caps = !caps; updateLettersState(); return; }
    if (key === 'Shift') {
      shiftDown = true; updateLettersState();
      setTimeout(()=>{ shiftDown=false; updateLettersState(); }, 200);
      return;
    }

    let char = key;
    if (char.length === 1 && /[a-zA-Z]/.test(char)){
      const upper = caps !== shiftDown;
      char = upper ? char.toUpperCase() : char.toLowerCase();
    } else {
      if (shiftDown || caps) {
        const shiftMap = {
          '1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')',
          '-':'_','=':'+','`':'~','\\':'|',';':':',"'":'"',',':'<','.':'>','/':'?'
        };
        if (shiftMap[char]) char = shiftMap[char];
      }
    }
    internalText += char;
    refreshTyped();
  }

  function updateLettersState(){
    document.querySelectorAll('.key').forEach(k => {
      const key = k.dataset.key;
      if (!key) return;
      if (key.length === 1 && /[a-zA-Z]/.test(key)){
        const upper = caps !== shiftDown;
        k.querySelector('.label-primary').textContent = upper ? key.toUpperCase() : key.toLowerCase();
      }
    });
  }

  document.querySelectorAll('.key').forEach(k => {
    k.addEventListener('mousedown', () => {
      k.classList.add('active','blink');
      playBeep(); handleKeyPress(k.dataset.key);
      setTimeout(()=> k.classList.remove('blink'), 250);
    });
    k.addEventListener('mouseup', ()=> k.classList.remove('active'));
    k.addEventListener('mouseleave', ()=> k.classList.remove('active'));
    k.addEventListener('keydown', (ev)=>{
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        k.classList.add('active','blink');
        playBeep(); handleKeyPress(k.dataset.key);
        setTimeout(()=> k.classList.remove('blink'), 200);
      }
    });
  });

  window.addEventListener('keydown', (e)=>{
    if (e.repeat) return;
    const keyName = (e.key === ' ' ? 'Space' : (e.key === 'Backspace' ? 'Backspace' : (e.key === 'Tab' ? 'Tab' : (e.key === 'Enter' ? 'Enter' : e.key))));
    const keyEls = Array.from(document.querySelectorAll('.key'));
    const match = keyEls.find(k => k.dataset.key && k.dataset.key.toLowerCase() === (e.key.length===1 ? e.key.toLowerCase() : keyName.toLowerCase()));
    if (keyName === 'Shift' || e.key === 'Shift') shiftDown = true;
    if (e.key === 'CapsLock') { caps = !caps; updateLettersState(); }
    if (match) {
      match.classList.add('active','blink');
      setTimeout(()=> match.classList.remove('blink'), 220);
    }
    if (e.key.length === 1 || ['Backspace','Enter','Tab',' '].includes(e.key)){
      playBeep();
      if (e.key === 'Tab') e.preventDefault();
      handleKeyPress(keyName === ' ' ? 'Space' : keyName);
    }
  });

  window.addEventListener('keyup', (e)=>{
    if (e.key === 'Shift') { shiftDown = false; updateLettersState(); }
    document.querySelectorAll('.key').forEach(k => {
      const d = k.dataset.key;
      if (d && (d.toLowerCase() === e.key.toLowerCase() || (e.key === ' ' && d === 'Space'))) {
        k.classList.remove('active');
      }
    });
  });

  clearBtn.addEventListener('click', ()=>{ internalText = ''; refreshTyped(); playBeep(); });
  copyBtn.addEventListener('click', async ()=> {
    try {
      await navigator.clipboard.writeText(internalText);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(()=> copyBtn.textContent = 'Copy', 1200);
    } catch(err) {
      copyBtn.textContent = 'Failed';
      setTimeout(()=> copyBtn.textContent = 'Copy', 1200);
    }
    playBeep();
  });

  toggleSoundBtn.addEventListener('click', ()=>{
    soundEnabled = !soundEnabled;
    soundStateEl.textContent = soundEnabled ? 'On' : 'Off';
    toggleSoundBtn.textContent = soundEnabled ? 'Sound: On' : 'Sound: Off';
  });

  refreshTyped();
  document.querySelector('.app').addEventListener('click', ()=> typedEl.focus());
  typedEl.addEventListener('paste', (ev)=>{
    ev.preventDefault();
    const text = (ev.clipboardData || window.clipboardData).getData('text');
    internalText += text; refreshTyped();
  });
  window.addEventListener('keydown', (e)=> {
    if (e.code === 'Space' && document.activeElement === document.body) e.preventDefault();
  });

  updateLettersState();
})();


  const btn = document.querySelector(".theme-toggle");
  btn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    if (document.documentElement.classList.contains("light")) {
      btn.textContent = "☀️ ";
    } else {
      btn.textContent = "🌙 ";
    }
  });

