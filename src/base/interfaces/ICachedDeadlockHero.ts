export default interface ICachedDeadlockHero {
  id: string;
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
}
