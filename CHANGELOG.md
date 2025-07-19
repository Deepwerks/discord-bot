## [1.10.1](https://github.com/Deepwerks/discord-bot/compare/v1.10.0...v1.10.1) (2025-07-19)


### Bug Fixes

* set updated guild config in cache on language cmd ([#278](https://github.com/Deepwerks/discord-bot/issues/278)) ([29ed24c](https://github.com/Deepwerks/discord-bot/commit/29ed24c496bacef236825ea8e5611df422720c04))
* update embed on player join ([#267](https://github.com/Deepwerks/discord-bot/issues/267)) ([a74eb40](https://github.com/Deepwerks/discord-bot/commit/a74eb404240963eea5f25db6fa35f85a066cca58))


### Features

* Add AI Assistant service ([e19eb92](https://github.com/Deepwerks/discord-bot/commit/e19eb923148ab6087b779666e172ad660f456d06))
* Add AI Assistant service ([375bdcd](https://github.com/Deepwerks/discord-bot/commit/375bdcd8b4b43fda7caf045111ce04ff32064940))
* add community rating feature to feedback system ([#268](https://github.com/Deepwerks/discord-bot/issues/268)) ([77f6ae9](https://github.com/Deepwerks/discord-bot/commit/77f6ae98c11c86e80f0991d901afd125fc17a631))
* Add disclaimer for potential AI mistakes in responses ([225962f](https://github.com/Deepwerks/discord-bot/commit/225962f0c866baeabe2f0bc43b1cc88eb90907b4))
* Enhance AI Assistant response handling with error reporting ([7107dd7](https://github.com/Deepwerks/discord-bot/commit/7107dd7b302f349ec66f3d4a8837e9f6da4fb5e7))
* Implement MessageCreate event for AI Assistant interactions ([7c6a440](https://github.com/Deepwerks/discord-bot/commit/7c6a44012b0e215b77ffe3fa5c3b005a2b019204))
* Implement MessageCreate event for AI Assistant interactions ([4529e31](https://github.com/Deepwerks/discord-bot/commit/4529e31a3b54b1da8eb3b78319f3cbb873aa3a92))
* Limit thinking messages to 600 characters in MessageCreate event ([96e6eb1](https://github.com/Deepwerks/discord-bot/commit/96e6eb18c3c066cd8fc4af2e357148f4d5d7c885))
* send error message on reached server limit ([914ac67](https://github.com/Deepwerks/discord-bot/commit/914ac67dfe2e663ddbf4538bde02f3f2770e8108))
* Update AI Assistant API endpoint to actual endpoint ([af498ea](https://github.com/Deepwerks/discord-bot/commit/af498eac290fc6fbe54061356a2eb2b4b3734ec0))
* Update AI Assistant API endpoint to actual endpoint ([9c0470a](https://github.com/Deepwerks/discord-bot/commit/9c0470a4afc4d18a5b5855f99234fc33260425a8))
* Update Memory ID message to include continuation instruction ([35f02c2](https://github.com/Deepwerks/discord-bot/commit/35f02c230bd8fe61f19c14a7be04db923bf09441))



# [1.10.0](https://github.com/Deepwerks/discord-bot/compare/v1.9.0...v1.10.0) (2025-07-09)


### Features

* implemented back to the start and to the end buttons & removed … ([#260](https://github.com/Deepwerks/discord-bot/issues/260)) ([65cf20b](https://github.com/Deepwerks/discord-bot/commit/65cf20bce2df779c47856d56e8f03252af6124ee))
* implemented setActivity command ([#255](https://github.com/Deepwerks/discord-bot/issues/255)) ([11c479b](https://github.com/Deepwerks/discord-bot/commit/11c479b06038fdf4653fd63b05cf4b91e02bf8ec))
* option too choose your character ([#261](https://github.com/Deepwerks/discord-bot/issues/261)) ([0bbf6f6](https://github.com/Deepwerks/discord-bot/commit/0bbf6f61f978e869b69a12eed9ebc95a2c4d8469))



# [1.9.0](https://github.com/Deepwerks/discord-bot/compare/v1.8.10...v1.9.0) (2025-07-08)


### Bug Fixes

* updated embed now displays the correct creator ([#247](https://github.com/Deepwerks/discord-bot/issues/247)) ([c02ae24](https://github.com/Deepwerks/discord-bot/commit/c02ae246a1bd91f8dd83a96a6439608e08bbc21a))


### Features

* highlight user ([#245](https://github.com/Deepwerks/discord-bot/issues/245)) ([4f9fe5f](https://github.com/Deepwerks/discord-bot/commit/4f9fe5f701a84cd1ce21f5359ddb0467afc5bbba))
* unlocker create lobby cmd ([#235](https://github.com/Deepwerks/discord-bot/issues/235)) ([d07e014](https://github.com/Deepwerks/discord-bot/commit/d07e014c2d5e025a8c60ce7e58809a5f27551a24))



## [1.8.10](https://github.com/Deepwerks/discord-bot/compare/v1.8.5...v1.8.10) (2025-06-27)


### Bug Fixes

* default lobby name ([#227](https://github.com/Deepwerks/discord-bot/issues/227)) ([c1529bc](https://github.com/Deepwerks/discord-bot/commit/c1529bce05bf0e91fe594dc607662d9711cccc83))
* fixed bearer token read ([#218](https://github.com/Deepwerks/discord-bot/issues/218)) ([ec97bc5](https://github.com/Deepwerks/discord-bot/commit/ec97bc592d0aa362db902e7eaa140dd2f67cf2c5))
* updated schema validator on create-lobby request ([#222](https://github.com/Deepwerks/discord-bot/issues/222)) ([370cee1](https://github.com/Deepwerks/discord-bot/commit/370cee15fb3dcbb0472bca3029d44c6cc60c07ed))


### Features

* added balanced shuffle option ([#231](https://github.com/Deepwerks/discord-bot/issues/231)) ([71e3883](https://github.com/Deepwerks/discord-bot/commit/71e38830e7b19be25e45dafac7f74c480a5450ca))
* reintroduced metrics ([#216](https://github.com/Deepwerks/discord-bot/issues/216)) ([8f9f2fb](https://github.com/Deepwerks/discord-bot/commit/8f9f2fbdb68429a596cb48095159b8e4dc32a694))



## [1.8.5](https://github.com/Deepwerks/discord-bot/compare/v1.8.2-release...v1.8.5) (2025-06-04)


### Bug Fixes

* fixed an issue where history command would not reply to interact… ([#212](https://github.com/Deepwerks/discord-bot/issues/212)) ([95600a2](https://github.com/Deepwerks/discord-bot/commit/95600a2e0a7910c4a341b697bc723c192b25b0fe))
* removed metrics endpoint ([#207](https://github.com/Deepwerks/discord-bot/issues/207)) ([526e966](https://github.com/Deepwerks/discord-bot/commit/526e966cbe26a3c9d275893823b90b27fb279fb8))


### Features

* implemented ItemService in AssetsClient ([#198](https://github.com/Deepwerks/discord-bot/issues/198)) ([f2e6b9a](https://github.com/Deepwerks/discord-bot/commit/f2e6b9a894fbdf7152bcfbac1984f8b1b5c01621))
* introduced items in DeadlockMatchService ([#199](https://github.com/Deepwerks/discord-bot/issues/199)) ([17812f7](https://github.com/Deepwerks/discord-bot/commit/17812f7bfd7472039d8f11b72a46be500e63af4b))
* metics setup ([#204](https://github.com/Deepwerks/discord-bot/issues/204)) ([6faf9b8](https://github.com/Deepwerks/discord-bot/commit/6faf9b8d8a9413649f32dfac955c7d4ecd1be02b))



## [1.8.2-release](https://github.com/Deepwerks/discord-bot/compare/v1.8.1-release...v1.8.2-release) (2025-05-25)


### Features

* added optional option in match command to hide player names fro… ([#192](https://github.com/Deepwerks/discord-bot/issues/192)) ([0a05464](https://github.com/Deepwerks/discord-bot/commit/0a05464b30023b6cc12a154bd9398ae61d1abd87))



## [1.8.1-release](https://github.com/Deepwerks/discord-bot/compare/v1.8.0-release...v1.8.1-release) (2025-05-24)



# [1.8.0-release](https://github.com/Deepwerks/discord-bot/compare/v1.7.4-release...v1.8.0-release) (2025-05-24)


### Bug Fixes

* added logs to steamAuthRouter ([#170](https://github.com/Deepwerks/discord-bot/issues/170)) ([9dac94b](https://github.com/Deepwerks/discord-bot/commit/9dac94bb2e8c6da19b424f4326541a2fc6ea39df))
* **cache:** on start discord client now loads static data to cache (d… ([#174](https://github.com/Deepwerks/discord-bot/issues/174)) ([74b791f](https://github.com/Deepwerks/discord-bot/commit/74b791fce874f7d8ffee854d7b5d795146533391))



## [1.7.4-release](https://github.com/Deepwerks/discord-bot/compare/v1.7.3-release...v1.7.4-release) (2025-05-17)



## [1.7.3-release](https://github.com/Deepwerks/discord-bot/compare/v1.7.2-release...v1.7.3-release) (2025-05-11)



## [1.7.2-release](https://github.com/Deepwerks/discord-bot/compare/v1.7.1-release...v1.7.2-release) (2025-05-08)



## [1.7.1-release](https://github.com/Deepwerks/discord-bot/compare/v1.6.3-release...v1.7.1-release) (2025-05-08)



## [1.6.3-release](https://github.com/Deepwerks/discord-bot/compare/v1.6.0-release...v1.6.3-release) (2025-05-04)



# [1.6.0-release](https://github.com/Deepwerks/discord-bot/compare/v1.4.0-release...v1.6.0-release) (2025-05-03)



# [1.4.0-release](https://github.com/Deepwerks/discord-bot/compare/v1.3.3-beta...v1.4.0-release) (2025-04-27)



## [1.3.3-beta](https://github.com/Deepwerks/discord-bot/compare/v1.3.2-beta...v1.3.3-beta) (2025-04-25)



## [1.3.2-beta](https://github.com/Deepwerks/discord-bot/compare/v1.3.1-release...v1.3.2-beta) (2025-04-25)



## [1.2.3-beta](https://github.com/Deepwerks/discord-bot/compare/v1.2.2-beta...v1.2.3-beta) (2025-04-19)



