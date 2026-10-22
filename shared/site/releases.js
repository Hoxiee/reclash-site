export function classify(name) {
      const n = name.toLowerCase();
      if (/sha256|\.sig$|\.asc$|\.txt$|\.json$|\.ya?ml$|\.blockmap$/.test(n)) return null;
      const os = /\.apk$|android/.test(n) ? 'android'
        : /\.dmg$|macos|darwin|\.pkg$/.test(n) ? 'macos'
        : /\.appimage$|\.deb$|\.rpm$|\.pkg\.tar|linux/.test(n) ? 'linux'
        : /\.exe$|\.msi$|windows|win(32|64)/.test(n) ? 'windows' : null;
      if (!os) return null;
      const arch = /arm64-v8a/.test(n) ? 'arm64-v8a' : /armeabi-v7a/.test(n) ? 'armeabi-v7a' : /universal/.test(n) ? 'universal'
        : /aarch64|arm64/.test(n) ? 'arm64' : /x86_64|amd64|x64/.test(n) ? (os === 'android' ? 'x86_64' : 'x64') : /i386|x86/.test(n) ? 'x86' : '';
      const kind = /\.exe$/.test(n) ? (/setup|install/.test(n) ? 'Installer' : 'Program') : /\.msi$/.test(n) ? 'Installer'
        : /\.zip$/.test(n) ? (os === 'windows' ? 'Portable ZIP' : 'ZIP') : /\.dmg$/.test(n) ? 'DMG' : /\.appimage$/.test(n) ? 'AppImage'
        : /\.deb$/.test(n) ? 'DEB' : /\.rpm$/.test(n) ? 'RPM' : /\.pkg\.tar/.test(n) ? 'pacman' : /\.apk$/.test(n) ? 'APK' : 'File';
      return { os, arch, kind };
    }

export async function detect() {
      const ua = navigator.userAgent;
      let os = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : /Mac/i.test(ua) ? 'macos' : /Win/i.test(ua) ? 'windows' : /Linux|X11/i.test(ua) ? 'linux' : null;
      let arch = os === 'android' ? 'arm64-v8a' : 'x64';
      try {
        const hi = await navigator.userAgentData?.getHighEntropyValues?.(['architecture', 'bitness']);
        if (hi?.architecture === 'arm') arch = 'arm64';
      } catch (_) {}
      if (os === 'macos' && arch === 'x64') arch = '';  // Safari can't tell Apple silicon from Intel: don't guess
      return { os, arch };
    }

export const score = (a, me) => {
      let s = 0;
      if (a.os !== me.os) return -1;
      if (me.arch && a.arch === me.arch) s += 4;
      if (a.arch === 'universal') s += 3;
      if (!me.arch && me.os === 'macos' && a.arch === 'arm64') s += 1;
      if (a.kind === 'Installer' || a.kind === 'AppImage' || a.kind === 'DMG' || a.kind === 'APK') s += 2;
      return s;
    };
