import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Command from "../../base/classes/Command";
import CustomClient from "../../base/classes/CustomClient";
import Category from "../../base/enums/Category";
import { TFunction } from "i18next";
import CommandError from "../../base/errors/CommandError";
import { logger, useAssetsClient } from "../..";

export default class Random extends Command {
  constructor(client: CustomClient) {
    super(client, {
      name: "random",
      description: "Get a random hero",
      category: Category.Misc,
      default_member_permissions:
        PermissionsBitField.Flags.UseApplicationCommands,
      dm_permission: true,
      cooldown: 2,
      dev: false,
      options: [],
    });
  }

  async Execute(
    interaction: ChatInputCommandInteraction,
    t: TFunction<"translation", undefined>
  ) {
    await interaction.deferReply();

    try {
      const heroes = useAssetsClient.HeroService.getCachedHeroes();
      const heroIds = Array.from(heroes.keys());

      let randomIndex = Math.floor(Math.random() * heroIds.length);
      let randomHeroId = heroIds[randomIndex];

      let hero = heroes.get(randomHeroId);

      while (!hero) {
        randomIndex = Math.floor(Math.random() * heroIds.length);
        randomHeroId = heroIds[randomIndex];

        hero = heroes.get(randomHeroId);
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Random")
            .setTitle(`Your random hero is **${hero.name}**`)
            .setThumbnail(hero.images.icon_hero_card)
            .setDescription(
              `*${hero.description.role}*\n\n` +
                hero.description.playstyle
                  .replace("<i>", "*")
                  .replace("</i>", "*")
            ),
        ],
      });

      if (hero.name === "Warden") {
        await interaction.followUp({
          content: "It's time to change the World! 🌏",
        });
      }
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      logger.error({
        error,
        user: interaction.user.id,
        command: "performance",
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          error instanceof CommandError
            ? error.message
            : t("errors.generic_error")
        );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
