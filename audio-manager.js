'use strict';
/* AUDIO — one reusable media element, cancelable sequences, recorded voices first.
   A missing asset alone may use native speech; autoplay denial never triggers TTS. */
function createAudioManager({assets, enabled=true, debug=false, gap=500}) {
  const player = new Audio();
  player.preload = 'auto';
  player.id = 'voice-player'; player.hidden = true;
  document.body.appendChild(player);
  player.setAttribute('playsinline', '');
  const warned = new Set();
  let epoch = 0, settle = null, unlocked = false;
  const manager = {
    currentAudio: player, queue: [], enabled, lastInstruction: [],
    unlock() { unlocked = true; },
    stop() {
      epoch++;
      if (settle) settle('cancelled');
      player.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      manager.queue = [];
    },
    setEnabled(value) { manager.enabled = Boolean(value); manager.stop(); },
    play(item) { return manager.playSequence([item], {remember:false}); },
    async playSequence(items, {remember=false}={}) {
      manager.stop();
      const sequence = items.map(item => typeof item==='string' ? {key:item} : {...item});
      if (remember) manager.lastInstruction = sequence;
      const token = epoch;
      manager.queue = [...sequence];
      if (!active(token)) { manager.queue=[]; return false; }
      for (let i=0; i<sequence.length; i++) {
        if (!active(token)) return false;
        const item=sequence[i];
        if (i && !(await pause(item.pauseBefore ?? gap, token))) return false;
        if (!active(token)) return false;
        const file=assets[item.key]?.src;
        const outcome=file ? await playFile(file, token) : 'missing';
        if (!active(token)) return false;
        if (outcome==='missing') {
          warn(item.key, 'Audio asset is missing');
          if (item.text) await speakFallback(item.text, item.lang || 'ru-RU', token);
        }
        if (token===epoch) manager.queue.shift();
      }
      return active(token);
    },
    repeatLastInstruction() { return manager.playSequence(manager.lastInstruction); },
    setInstruction(items) { return manager.playSequence(items, {remember:true}); }
  };
  const active = token => token===epoch && unlocked && manager.enabled;
  function warn(key, message) {
    if (warned.has(key)) return;
    warned.add(key); console.warn('[Alfie audio]',message,key);
  }
  function pause(ms, token) {
    if (!active(token)) return Promise.resolve(false);
    return new Promise(resolve => {
      let timer;
      const finish = result => { clearTimeout(timer); if(settle===finish)settle=null; resolve(result===true && active(token)); };
      settle=finish; timer=setTimeout(()=>finish(true),ms);
    });
  }
  function playFile(src, token) {
    return new Promise(resolve => {
      if (!active(token)) { resolve('cancelled'); return; }
      let done=false, watchdog;
      const finish = outcome => {
        if(done)return; done=true; clearTimeout(watchdog);
        player.onended=player.onerror=null;
        player.pause();
        if(settle===finish)settle=null;
        resolve(outcome);
      };
      settle=finish;
      player.onended=()=>finish('ended');
      player.onerror=()=>{warn(src,'Audio could not be loaded');finish('missing');};
      watchdog=setTimeout(()=>{warn(src,'Audio timed out');finish('timeout');},20000);
      player.src=src;
      if(debug)console.log('[Alfie audio]',src);
      try {
        const result=player.play();
        if(result?.catch)result.catch(error=>{
          if(done || !active(token))return;
          // An interrupted/blocked play is not evidence of an absent recording.
          if(error.name==='NotAllowedError'||error.name==='AbortError')finish('blocked');
          else {warn(src,'Audio could not be played');finish('missing');}
        });
      } catch(error) {
        warn(src,'Audio could not be played');finish('blocked');
      }
    });
  }
  function speakFallback(text, lang, token) {
    if (!active(token) || !('speechSynthesis' in window)) return Promise.resolve(false);
    return new Promise(resolve => {
      const synth=window.speechSynthesis, utterance=new SpeechSynthesisUtterance(text);
      utterance.lang=lang; utterance.rate=.82;
      const voices=synth.getVoices();
      const voice=voices.find(v=>v.lang===lang&&v.localService)||voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.slice(0,2)));
      if(voice)utterance.voice=voice;
      let done=false, watchdog;
      const finish = result => {if(done)return;done=true;clearTimeout(watchdog);if(settle===finish)settle=null;resolve(result===true);};
      settle=finish; utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);
      watchdog=setTimeout(()=>{finish(false);if(token===epoch)synth.cancel();},Math.max(5000,text.length*150));
      try{synth.speak(utterance);}catch(error){finish(false);}
    });
  }
  return manager;
}
