// cspell:disable
import { IoGlobeSharp } from 'react-icons/io5';
import type { IconType } from 'react-icons/lib';
import {
  SiDouban,
  SiGithub,
  SiGooglesheets,
  SiTwitter,
  SiYoutube,
} from 'react-icons/si';

export const CONTRIBUTOR_PLATFORMS: Record<
  string,
  {
    icon: IconType;
    width: number;
  }
> = {
  github: {
    icon: SiGithub,
    width: 24,
  },
  youtube: {
    icon: SiYoutube,
    width: 24,
  },
  twitter: {
    icon: SiTwitter,
    width: 24,
  },
  googleSheets: {
    icon: SiGooglesheets,
    width: 24,
  },
  douban: {
    icon: SiDouban,
    width: 24,
  },
  other: {
    icon: IoGlobeSharp,
    width: 24,
  },
};
