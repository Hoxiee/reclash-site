// Inline scripts that must run before first paint. They are plain ES5 strings, so a slow or
// failed bundle never leaves the page covered: after 8 s the document falls back to static.

export const bootScript = `(function(){var h=document.documentElement,c=h.classList;if(c.contains('is-loading'))return;c.add('js','is-loading');
try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)c.add('rm')}catch(e){}
try{var b=(localStorage.getItem('reclash-brand-ui')||'').split(' ');if(b.length===3&&b.every(function(v){return isFinite(parseFloat(v))})){h.style.setProperty('--bl',b[0]);h.style.setProperty('--bc',b[1]);h.style.setProperty('--bh',b[2])}}catch(e){}
if(location.pathname!=='/')try{if(sessionStorage.getItem('reclash-intro'))c.add('intro-short');else sessionStorage.setItem('reclash-intro','1')}catch(e){}
setTimeout(function(){if(!c.contains('is-ready')){c.remove('js');c.add('is-ready','is-loaded')}},8000)})()`

// Languages whose speakers usually read Russian; anything else falls back to English.
export const languageScript = `(function(){var l=null;try{l=localStorage.getItem('reclash-lang')}catch(e){}
if(l!=='ru'&&l!=='en'){l='en';var a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
for(var i=0;i<a.length;i++){var x=String(a[i]).toLowerCase();if(/^(ru|be|kk|ky|tg|uz|tt|ba|cv|sah|os)(-|$)/.test(x)){l='ru';break}if(/^en(-|$)/.test(x))break}}
location.replace('/'+l+location.search+location.hash)})()`

export const languageKey = 'reclash-lang'
