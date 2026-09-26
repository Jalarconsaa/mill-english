// Avatares ilustrados (SVG original). La boca se anima cuando el personaje habla.
const AVATARS = {
  mattias: { bg: '#4DA3FF', skin: '#F1C9A5', hair: '#E3C16F', hairStyle: 'short', beard: 'full', hat: '#F4F4F0', shirt: '#2F4A6D', vest: true },
  joel:    { bg: '#B084F5', skin: '#F4D3B5', hair: '#A8703F', hairStyle: 'messy', glasses: true, shirt: '#56606E', hoodie: true },
  alvaro:  { bg: '#FF8A3D', skin: '#D6A57C', hair: '#2B211C', hairStyle: 'short', beard: 'stubble', hat: '#F4F4F0', shirt: '#B5443A', flannel: true },
  paul:    { bg: '#2EC4B6', skin: '#EBC1A0', hair: '#C4C7CB', hairStyle: 'receding', shirt: '#27344F', blazer: true },
  tutor:   { bg: '#B8E04A', skin: '#E8B894', hair: '#3A2A22', hairStyle: 'curly', glasses: true, shirt: '#3E6B4F', scarf: '#F2B705' }
};
const SKIN_TONES = ['#F1C9A5', '#E3B38E', '#D6A57C', '#C68F66', '#EBC1A0'];
const LOCAL_HATS = ['#F2B705', '#FF8A3D', '#3DD68C', '#4DA3FF', '#F4F4F0'];
function hashStr(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

// Avatar genérico para personal de Rumasal o técnicos adicionales, estable según el nombre
function genericAvatar(name, kind) {
  const h = hashStr(name);
  const hairs = ['#2B211C', '#4A3325', '#6B4A2E', '#1E1A18', '#8A8A8A'];
  const base = {
    bg: kind === 'tech' ? '#4DA3FF' : ['#F2B705', '#3DD68C', '#FF6B8B', '#FF8A3D', '#2EC4B6'][h % 5],
    skin: SKIN_TONES[h % SKIN_TONES.length], hair: hairs[(h >> 3) % hairs.length],
    hairStyle: ['short', 'messy', 'receding', 'short'][(h >> 5) % 4],
    beard: ['none', 'stubble', 'none', 'mustache', 'full'][(h >> 7) % 5],
    glasses: (h >> 9) % 5 === 0,
    hat: kind === 'tech' ? '#F4F4F0' : LOCAL_HATS[(h >> 11) % LOCAL_HATS.length],
    shirt: kind === 'tech' ? '#2F4A6D' : '#3A4A40', vest: kind !== 'tech'
  };
  if (base.hat && base.hat === base.bg) base.hat = LOCAL_HATS[(LOCAL_HATS.indexOf(base.hat) + 1) % LOCAL_HATS.length];
  if (base.hat === base.bg) base.hat = '#F4F4F0';
  // Personas conocidas de Rumasal que son mujeres
  if (/^(myriam)$/i.test(String(name).trim())) Object.assign(base, { hairStyle: 'long', beard: 'none', hat: null, vest: false, shirt: '#6B3E5E' });
  return base;
}

function avatarSVG(key, name) {
  const a = AVATARS[key] || genericAvatar(name || key, ['krim', 'lenan', 'andrew', 'jonathan'].includes(String(name || '').toLowerCase()) ? 'tech' : 'local');
  const dark = '#2A1E18';
  let hairBack = '', hairFront = '', extra = '';
  switch (a.hairStyle) {
    case 'short': hairFront = `<path d="M32 40 C32 22 68 22 68 40 C66 32 60 28 50 28 C40 28 34 32 32 40Z" fill="${a.hair}"/>`; break;
    case 'messy': hairFront = `<path d="M30 42 C28 22 44 18 50 22 C56 16 74 22 70 42 C68 34 62 30 56 31 C52 27 44 27 40 32 C36 32 32 36 30 42Z" fill="${a.hair}"/>`; break;
    case 'receding': hairFront = `<path d="M32 44 C31 34 34 30 38 29 C36 34 36 38 36 44Z M68 44 C69 34 66 30 62 29 C64 34 64 38 64 44Z" fill="${a.hair}"/>`; break;
    case 'curly': hairBack = `<circle cx="50" cy="40" r="25" fill="${a.hair}"/><circle cx="30" cy="52" r="8" fill="${a.hair}"/><circle cx="70" cy="52" r="8" fill="${a.hair}"/>`;
      hairFront = `<path d="M31 42 C32 26 44 22 50 24 C58 22 70 28 69 42 C64 34 56 31 50 32 C44 31 36 34 31 42Z" fill="${a.hair}"/>`; break;
    case 'long': hairBack = `<path d="M28 44 C26 22 74 22 72 44 L74 72 C66 76 34 76 26 72Z" fill="${a.hair}"/>`;
      hairFront = `<path d="M31 44 C31 26 69 26 69 44 C64 34 58 30 50 30 C42 30 36 34 31 44Z" fill="${a.hair}"/>`; break;
  }
  const beard = a.beard === 'full' ? `<path d="M33 48 C34 64 42 68 50 68 C58 68 66 64 67 48 C64 56 58 58 50 58 C42 58 36 56 33 48Z" fill="${a.hair}"/>`
    : a.beard === 'stubble' ? `<path d="M34 50 C36 63 43 67 50 67 C57 67 64 63 66 50 C62 58 57 60 50 60 C43 60 38 58 34 50Z" fill="${a.hair}" opacity=".35"/>`
    : a.beard === 'mustache' ? `<path d="M43 53 C46 51 54 51 57 53 C54 54 46 54 43 53Z" fill="${a.hair}"/>` : '';
  const glasses = a.glasses ? `<g fill="none" stroke="${dark}" stroke-width="1.6"><rect x="37" y="40" width="10" height="8" rx="3"/><rect x="53" y="40" width="10" height="8" rx="3"/><path d="M47 44 H53"/></g>` : '';
  const hat = a.hat ? `<path d="M30 36 C30 16 70 16 70 36Z" fill="${a.hat}"/><path d="M47 18 H53 V35 H47Z" fill="#000" opacity=".08"/><rect x="25" y="34" width="50" height="5" rx="2.5" fill="${a.hat}"/><rect x="25" y="37" width="50" height="2" fill="#000" opacity=".12"/>` : '';
  let torso = `<path d="M14 100 C16 79 32 71 50 71 C68 71 84 79 86 100Z" fill="${a.shirt}"/>`;
  if (a.vest) torso += `<path d="M24 100 C25 86 32 78 40 75 L44 100Z M76 100 C75 86 68 78 60 75 L56 100Z" fill="#F2B705"/><path d="M26 90 H43 V93 H26Z M57 90 H74 V93 H57Z" fill="#E8E8E8"/>`;
  if (a.flannel) torso += `<path d="M20 86 H80 M18 94 H82 M36 74 V100 M64 74 V100" stroke="#7A2A24" stroke-width="2" opacity=".6"/>`;
  if (a.hoodie) torso += `<path d="M36 73 C40 82 60 82 64 73" fill="none" stroke="#3E4652" stroke-width="3"/><path d="M46 80 V90 M54 80 V90" stroke="#DDD" stroke-width="1.5"/>`;
  if (a.blazer) torso += `<path d="M42 72 L50 86 L58 72Z" fill="#F4F4F0"/><path d="M48 76 L50 92 L52 76 L50 74Z" fill="#B5443A"/>`;
  if (a.scarf) torso += `<path d="M36 72 C42 78 58 78 64 72 C62 80 38 80 36 72Z" fill="${a.scarf}"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="50" cy="50" r="50" fill="${a.bg}"/>
    <clipPath id="c${hashStr(key + (name || ''))}"><circle cx="50" cy="50" r="50"/></clipPath>
    <g clip-path="url(#c${hashStr(key + (name || ''))})">
      ${hairBack}${torso}
      <rect x="43" y="58" width="14" height="15" rx="4" fill="${a.skin}"/><rect x="43" y="62" width="14" height="5" fill="#000" opacity=".08"/>
      <circle cx="32" cy="47" r="4.5" fill="${a.skin}"/><circle cx="68" cy="47" r="4.5" fill="${a.skin}"/>
      <ellipse cx="50" cy="45" rx="18" ry="21" fill="${a.skin}"/>
      ${beard}${hairFront}
      <path d="M40 39 Q43 37 46 39 M54 39 Q57 37 60 39" stroke="${dark}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="43" cy="44" rx="2" ry="2.3" fill="${dark}"/><ellipse cx="57" cy="44" rx="2" ry="2.3" fill="${dark}"/>
      <path d="M50 46 Q48 51 51 51" stroke="#000" stroke-opacity=".25" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path class="mouth-closed" d="M44.5 55.5 Q50 59.5 55.5 55.5" stroke="${dark}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse class="mouth-open" cx="50" cy="56.5" rx="4.2" ry="3.2" fill="${dark}"/>
      ${glasses}${hat}${extra}
    </g></svg>`;
}
// Elemento HTML listo para insertar. size: 'sm' | 'md' | 'lg'
function avatarHTML(key, name, size = 'sm') {
  return `<span class="av av-${size}" data-av="${key}">${avatarSVG(key, name)}</span>`;
}
