// cspell:disable
import {
  SiNec,
  SiNintendoswitch,
  SiPlaystation3,
  SiPlaystation4,
  SiPlaystation5,
  SiPlaystationvita,
  SiWindows11,
} from 'react-icons/si';

import PspLogo from '../../public/assets/psp-logo.svg';

export const PLATFORMS: Record<
  string,
  {
    name: string;
    icon: any;
    iconType?: 'component' | 'image';
    width: number;
  }
> = {
  windows: {
    name: 'Microsoft Windows',
    icon: SiWindows11,
    iconType: 'component',
    width: 16,
  },
  psp: {
    name: 'PlayStation Portable',
    icon: PspLogo,
    iconType: 'image',
    width: 28,
  },
  psVita: {
    name: 'PlayStation Vita',
    icon: SiPlaystationvita,
    iconType: 'component',
    width: 24,
  },
  ps3: {
    name: 'PlayStation 3',
    icon: SiPlaystation3,
    iconType: 'component',
    width: 24,
  },
  ps4: {
    name: 'PlayStation 4',
    icon: SiPlaystation4,
    iconType: 'component',
    width: 24,
  },
  ps5: {
    name: 'PlayStation 5',
    icon: SiPlaystation5,
    iconType: 'component',
    width: 24,
  },
  necPc: {
    name: 'NEC PC',
    icon: SiNec,
    iconType: 'component',
    width: 24,
  },
  switch: {
    name: 'Nintendo Switch',
    icon: SiNintendoswitch,
    iconType: 'component',
    width: 16,
  },
};
