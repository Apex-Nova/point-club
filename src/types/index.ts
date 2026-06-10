export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
}

export interface RoadmapItem {
  title: string;
  description: string;
  tag: string;
  color: string;
}

export interface ActiveRoom {
  id: string;
  name: string;
  participants: number;
  preview: string;
  color: string;
}

export interface NavLink {
  label: string;
  href: string;
}
