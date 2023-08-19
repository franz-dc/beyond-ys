// import { MdCircle } from 'react-icons/md';
// // cspell:disable
// import {
//   SiAndroid,
//   SiApple,
//   SiIbm,
//   SiIos,
//   SiNec,
//   SiNintendo3Ds,
//   SiNintendoswitch,
//   SiPlaystation,
//   SiPlaystation2,
//   SiPlaystation3,
//   SiPlaystation4,
//   SiPlaystation5,
//   SiPlaystationvita,
//   SiWii,
//   SiWindows11,
//   SiXbox,
// } from 'react-icons/si';

// import PspLogo from '../../public/assets/psp-logo.svg';

// TODO: Replace circle icons with actual icons
export const GAME_PLATFORMS: Record<
  string,
  {
    name: string;
    // icon: any;
    // iconType?: 'component' | 'image';
    // width: number;
  }
> = {
  android: {
    // icon: SiAndroid,
    // iconType: 'component',
    name: 'Android',
    // width: 24,
  },
  appleIIGS: {
    // icon: SiApple,
    // iconType: 'component',
    name: 'Apple IIGS',
    // width: 16,
  },
  ds: {
    // icon: SiNintendo3Ds,
    // iconType: 'component',
    name: 'Nintendo DS',
    // width: 24,
  },
  fmTowns: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'FM Towns',
    // width: 16,
  },
  fujitsuFm7: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Fujitsu FM-7',
    // width: 16,
  },
  gameBoy: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Game Boy',
    // width: 16,
  },
  ibmPc: {
    // icon: SiIbm,
    // iconType: 'component',
    name: 'IBM PC / DOS',
    // width: 24,
  },
  ios: {
    // icon: SiIos,
    // iconType: 'component',
    name: 'iOS',
    // width: 24,
  },
  msx: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'MSX',
    // width: 16,
  },
  msx2: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'MSX2',
    // width: 16,
  },
  necPc: {
    // icon: SiNec,
    // iconType: 'component',
    name: 'NEC PC (PC-88 / PC-98)',
    // width: 24,
  },
  nes: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Nintendo Entertainment System / Famicom',
    // width: 16,
  },
  pcEngine: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'PC Engine / TurboGrafx-16',
    // width: 16,
  },
  ps1: {
    // icon: SiPlaystation,
    // iconType: 'component',
    name: 'PlayStation',
    // width: 24,
  },
  ps2: {
    // icon: SiPlaystation2,
    // iconType: 'component',
    name: 'PlayStation 2',
    // width: 24,
  },
  ps3: {
    // icon: SiPlaystation3,
    // iconType: 'component',
    name: 'PlayStation 3',
    // width: 24,
  },
  ps4: {
    // icon: SiPlaystation4,
    // iconType: 'component',
    name: 'PlayStation 4',
    // width: 24,
  },
  ps5: {
    // icon: SiPlaystation5,
    // iconType: 'component',
    name: 'PlayStation 5',
    // width: 24,
  },
  psp: {
    // icon: PspLogo,
    // iconType: 'image',
    name: 'PlayStation Portable',
    // width: 28,
  },
  psVita: {
    // icon: SiPlaystationvita,
    // iconType: 'component',
    name: 'PlayStation Vita',
    // width: 24,
  },
  segaGenesis: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Sega Genesis / Mega Drive',
    // width: 16,
  },
  segaMasterSystem: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Sega Master System / Mark III',
    // width: 16,
  },
  segaSaturn: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Sega Saturn',
    // width: 16,
  },
  sharpMz: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Sharp MZ',
    // width: 16,
  },
  sharpX1: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Sharp X1',
    // width: 16,
  },
  sharpX68000: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Sharp X68000',
    // width: 16,
  },
  snes: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Super Nintendo Entertainment System / Super Famicom',
    // width: 16,
  },
  superCassetteVision: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Super Cassette Vision',
    // width: 16,
  },
  switch: {
    // icon: SiNintendoswitch,
    // iconType: 'component',
    name: 'Nintendo Switch',
    // width: 16,
  },
  threeDs: {
    // icon: SiNintendo3Ds,
    // iconType: 'component',
    name: 'Nintendo 3DS',
    // width: 24,
  },
  wii: {
    // icon: SiWii,
    // iconType: 'component',
    name: 'Nintendo Wii',
    // width: 24,
  },
  windows: {
    // icon: SiWindows11,
    // iconType: 'component',
    name: 'Microsoft Windows',
    // width: 16,
  },
  xboxOne: {
    // icon: SiXbox,
    // iconType: 'component',
    name: 'Xbox One',
    // width: 24,
  },
  web: {
    // icon: MdCircle,
    // iconType: 'component',
    name: 'Web',
    // width: 16,
  },
};
