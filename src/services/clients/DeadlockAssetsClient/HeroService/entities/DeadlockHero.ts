export default class DeadlockHero {
  id: number;
  class_name: string;
  name: string;
  images: {
    icon_hero_card: string;
    icon_hero_card_webp: string;
    icon_image_small: string;
    icon_image_small_webp: string;
    minimap_image: string;
    minimap_image_webp: string;
    selection_image: string;
    selection_image_webp: string;
    top_bar_image: string;
    top_bar_image_webp: string;
  };
  description: {
    lore: string;
    role: string;
    playstyle: string;
  };
  disabled: boolean;
  in_development: boolean;
  limited_testing: boolean;

  constructor(raw: any) {
    this.id = raw.id;
    this.class_name = raw.class_name;
    this.name = raw.name;
    this.images = raw.images;
    this.description = raw.description;
    this.disabled = raw.disabled;
    this.in_development = raw.in_development;
    this.limited_testing = raw.limited_testing;
  }
}
