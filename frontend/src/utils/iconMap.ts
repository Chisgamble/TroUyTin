import {
  Wifi,
  Wind,
  WashingMachine,
  Refrigerator,
  ChefHat,
  Heater,
  ParkingCircle,
  ArrowUpDown,
  Building2,
  Cctv,
  PawPrint,
  Sofa,
  Bed,
  Package,
  MonitorCheck,
  AppWindow,
  Clock,
  House,
  ShieldCheck,
  Fingerprint,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  'wifi': Wifi,
  'air-conditioner': Wind,
  'washing-machine': WashingMachine,
  'refrigerator': Refrigerator,
  'chef-hat': ChefHat,
  'heater': Heater,
  'parking-circle': ParkingCircle,
  'arrow-up-down': ArrowUpDown,
  'building-2': Building2,
  'cctv': Cctv,
  'paw-print': PawPrint,
  'sofa': Sofa,
  'bed': Bed,
  'cabinet': Package,
  'desk': MonitorCheck,
  'window': AppWindow,
  'dryer': Wind,
  'clock': Clock,
  'house': House,
  'shield-check': ShieldCheck,
  'fingerprint': Fingerprint,
};

export function getIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Sparkles;
  return iconMap[iconName] ?? Sparkles;
}