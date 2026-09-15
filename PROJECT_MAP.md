# ABC Safari — Project map

Карта существующего приложения: обычные HTML, CSS и JavaScript, курс A–F. Все пути ниже — относительно корня этого Git-репозитория. Основная логика и стили находятся в `index.html`; ищите по именам функций и CSS-селекторам. Отдельных каталогов компонентов, сборщика и серверной части нет.

## 1. Project entry points

| File | Purpose |
| --- | --- |
| `index.html` | HTML-каркас, общий `<style>`, данные курса и основной встроенный `<script>`. В конце запускается `showScreen()`. |
| `assets.js` | Глобальный `MEDIA_ASSETS`: пути аудио и активных изображений, размеры изображений. Загружается до логики приложения. |
| `audio-manager.js` | `createAudioManager()`: воспроизведение записей и речевой fallback. Загружается после каталога ресурсов. |
| `manifest.webmanifest` | Название приложения, запуск, область действия, цвета и иконки для установки на домашний экран. |
| `README.md` | Запуск, пользовательские сценарии и описание сохранений. |

## 2. Repository structure

```text
/
├── index.html
├── assets.js
├── audio-manager.js
├── manifest.webmanifest
├── .nojekyll
├── icon-180.png
├── icon-192.png
├── icon-512.png
├── images/                 # сцены, варианты жирафика, аксессуары, иконки наград
│   └── stickers/           # реакции Marius
├── audio/                  # MP3 инструкций, букв, звуков и слов
├── README.md
├── TESTS.md
├── UPDATE-REPORT.md
├── STICKER-UPDATE.md
└── PROJECT_MAP.md
```

`AGENTS.md` на момент создания карты в репозитории отсутствует. `TESTS.md` описывает проверки, но упомянутые в нём скрипты `work/verify-*.cjs` не входят в этот Git-репозиторий.

## 3. UI

Весь интерфейс — в `index.html`:

- Каркас: `.topbar`, `#main`, `.footer`, `#modal-layer`, `#confetti`.
- Экраны: `renderHome()`, `renderCourse()`, `renderWardrobe()`, `renderReward()`, `renderResults()`. Учебные экраны: `renderLearnLetter()`, `renderWordScreen()`, `questionBody()`, `renderInterlude()`.
- Навигация: `view`, `lastView`, `go()`, `showScreen()`, `openProgress()`. Маршрутизация переключает содержимое `#main`; URL-роутера нет.
- Действия: объект `actions` и делегированный обработчик `document` для кнопок с `data-action` / `data-answer`; кнопки верхней панели имеют отдельные обработчики.
- Кнопки и карточки: `.primary`, `.secondary`, `.icon-button`, `.choice`, `.outfit-option`; карточки одежды строит `outfitOptions()`.
- Модальные окна: `openModal()`, `closeModal()`, `showReset()`, `showParentGate()`, `renderParentView()`; здесь же управление фокусом, Escape и родительский доступ по удержанию.
- Общие стили: начальный `<style>`, переменные `:root`. Responsive: блоки `@media` для 760/650/350 px, коротких экранов и landscape. Дополнительные правила персонажа/гардероба расположены ближе к концу `<style>`; учитывать порядок переопределений.

## 4. Exercise system

Всё в `index.html`:

- `letters` — A–F, слова, звуки, emoji, цвета, отвлекающие буквы. Отдельного хранилища готовых заданий нет.
- `CORE_TYPES` — `find`, `letterPicture`, `pictureLetter`; `MINI_TYPES` добавляет `wordPicture`, `FINAL_TYPES` — `lowercase`.
- `GROUP_SIZE`, `MINI_LENGTH`, `FINAL_LENGTH`, `groups` — группы по три буквы, мини-игры по пять вопросов, финал из десяти.
- `startGame()` задаёт последовательность типов; `gamePool()` выбирает набор букв; `getWeightedRandomLetter()` учитывает ошибки и очередь повторений.
- `ensureQuestion()` восстанавливает подходящий вопрос либо вызывает `createQuestion()`; `validQuestion()` проверяет структуру сохранённого вопроса.
- `questionPrompt()` / `questionBody()` выводят вопрос и варианты.
- `checkAnswer()` сравнивает `button.dataset.answer` с `q.letter`, запускает реакцию и блокирует повторное нажатие. Ошибка вызывает `registerMistake()` и повторную попытку; успех — `completeQuestion()` / `registerCorrectAnswer()`.
- Переходы: `nextLessonStep()`, `advanceAfterLetter()`, `advanceAfterMini()`, `completeQuestion()`, затем `go()` / `showScreen()`.

## 5. Progress and state

`index.html`: `initialState()`, `AppState`, `loadProgress()`, `saveProgress()`, `resetProgress()`.

- `cursor` хранит `phase`, индекс буквы и шаг. Фазы: `lesson`, `letterReward`, `miniIntro`, `mini`, `miniResult`, `finalIntro`, `final`, `results`.
- `stats` по каждой букве: `attempts`, `correct`, `mistakes`, `mastery`, `skills`, `practiceDebt`. Итоги для родителей вычисляет `renderParentView()`.
- `game`, `question`, `reviews`, `questionSerial` сохраняют позицию игры, вопрос и повторения; `started`, `completed`, `soundEnabled` — общие флаги.
- Награды: `characterState`, `completedBlocks`, `claimedRewards`, `rewardFlow`.
- `localStorage`: `alfie-abc-v1`; при `?demo=1` — отдельный `alfie-abc-demo-v1`. Версия состояния — 2; загрузчик принимает версии 1 и 2. Награды отдельно мигрирует `migrateRewards()` с `REWARD_STATE_VERSION`.
- При невозможности записи состояние остаётся в памяти вкладки, показывается `#storage-notice`. Сохранение также вызывается при скрытии страницы и `pagehide`. Сброс сохраняет настройку звука.
- `view`, блокировки, таймеры и история выбора стикеров — временные переменные вне сохранения.

## 6. Rewards

`index.html`: `rewardConfig`, `itemCatalog`, `finishBlock()`, `ensureRewardFlow()`, `chooseReward()`, `continueReward()`.

После A–C и мини-игры выбирается одна куртка; после D–F и мини-игры — один аксессуар. Завершение блока открывает выбор, а владение выдаёт `chooseReward()`. Он сохраняет выбранную вещь до анимации. Альтернативный предмет остаётся закрытым; `ownsItem()` и `equipItem()` проверяют владение.

Звезда буквы в `letterStrip()` соответствует `mastery === 3`: освоены три базовых типа заданий. `celebrate()` создаёт конфетти; `renderInterlude()` и `renderResults()` показывают праздничные звёзды. Отдельных очков, валюты, покупок, счётчика серий ответов или каталога достижений нет.

## 7. Marius

- `images/`: полные варианты `giraffe_base.png`, `giraffe_jacket_*.png`; сцены `background_*.png`. Подключение — `assets.js` и `characterConfig` в `index.html`.
- `renderCharacter()` выводит персонажа на главной, в гардеробе, при награде и в итогах. `buddy()` выводит emoji-жирафика в учебных экранах; `wireMedia()` обрабатывает ошибки загрузки.
- Реакции находятся в `images/stickers/`: `marius_success_01.png` … `marius_success_09.png`, `marius_retry_01.png`. Эти пути формируются прямо в `index.html`, вне `MEDIA_ASSETS`.
- `SUCCESS_STICKERS`, `RETRY_STICKER`, `pickSuccessSticker()` выбирают реакцию без повторения успешного стикера подряд. `showAnswerFeedback()` вызывается из `checkAnswer()`; `renderCompletionSticker()` — из `renderInterlude()` при завершении буквы.
- `prepareFeedbackSticker()` управляет загрузкой/ошибкой; `preloadFeedbackStickers()` запускает фоновую загрузку после начала игры. Внешний вид — `.feedback-sticker`, `.completion-sticker`, анимации `feedback-pop` / `feedback-soft`.

## 8. Clothing and accessories

Система реализована в `index.html` и использует ресурсы `images/`, зарегистрированные в `assets.js`.

- База — `images/giraffe_base.png`. Куртки — полные изображения `giraffe_jacket_stars.png` / `giraffe_jacket_racer.png`, заменяющие базу.
- Прозрачные аксессуары — `images/accessory_bouquet.png`, `images/accessory_balloon.png`; иконки карточек курток — `images/reward_icon_jacket_*.png`.
- `renderCharacter()` собирает фон, полный вариант жирафика и слой `handItem`. CSS `.character-stage`, `.character-actor`, `.character-layer` задаёт сцену 2:3 и общую область наложения с `object-fit:contain`.
- `characterState.ownedItems` хранит владение; `characterState.equipped.giraffeVariant` / `handItem` — надетые предметы. Менять через `chooseReward()` / `equipItem()`; отображение выбора — `outfitOptions()` / `renderWardrobe()`.
- Старые `images/jacket_*.png` и `images/headwear_*.png` остаются в каталоге, но не подключены через `MEDIA_ASSETS`; старые идентификаторы учитывает `migrateRewards()`.

## 9. Assets

- `images/` — сцены, персонаж, одежда, аксессуары и изображения карточек; `images/stickers/` — реакции.
- `audio/` — 60 MP3: нумерованные русские реплики, английские названия/звуки букв, слова и сочетания «буква — слово».
- `assets.js` — каталог активных изображений и аудио. Стикеры перечисляются отдельно в `index.html`.
- Учебные буквы выводятся текстом, картинки слов сейчас — emoji (`letters[].image === null`, `media()`). Иконки управления — встроенные SVG в `icons` и emoji; иконки установки — корневые `icon-*.png`.
- Отдельной фоновой музыки и отдельного каталога изображений букв нет.

## 10. Audio

`audio-manager.js`: `createAudioManager()` создаёт один переиспользуемый `Audio`; `unlock()` подготавливает его по жесту пользователя, `play()` / `playSequence()` воспроизводят очередь, `stop()` отменяет её, `setEnabled()` управляет звуком. `setInstruction()` / `repeatLastInstruction()` запоминают и повторяют инструкцию. При отсутствии/ошибке файла используется `speechSynthesis`, если у реплики есть текст.

`index.html`: `announceScreen()` озвучивает экран/задание, `checkAnswer()` — ошибку или похвалу, `toggleSound()` — настройку звука, действие `repeat` — повтор. `AUDIO_TEXT`, `ru()`, `enName()`, `enSound()`, `enWord()` задают тексты и ключи файлов из `MEDIA_ASSETS.audio`. Между репликами по умолчанию 500 мс; смена экрана останавливает старую очередь.

## 11. Important functions and modules

| Function / Module | File | Purpose |
| --- | --- | --- |
| `letters`, `CORE_TYPES`, `rewardConfig` | `index.html` | Данные курса, типы вопросов и условия подарков. |
| `ensureQuestion()`, `createQuestion()` | `index.html` | Восстановление/генерация текущего задания. |
| `checkAnswer()`, `completeQuestion()` | `index.html` | Ответ, обратная связь, статистика и следующий этап. |
| `getWeightedRandomLetter()`, `registerMistake()` | `index.html` | Повторение букв с учётом ошибок. |
| `go()`, `showScreen()`, `actions` | `index.html` | Переходы, отрисовка и действия кнопок. |
| `loadProgress()`, `saveProgress()`, `migrateRewards()` | `index.html` | Сохранение и совместимость старого прогресса. |
| `finishBlock()`, `chooseReward()`, `equipItem()` | `index.html` | Получение и надевание подарков. |
| `renderCharacter()`, `showAnswerFeedback()` | `index.html` | Сцена персонажа и реакции на ответ. |
| `announceScreen()` | `index.html` | Последовательности озвучки текущего экрана. |
| `MEDIA_ASSETS` | `assets.js` | Реальные пути медиа. |
| `createAudioManager()` | `audio-manager.js` | Загрузка, очередь, отмена, повтор и fallback аудио. |

## 12. Common modification paths

### Where to look when changing...

- Главный экран → `index.html`: `renderHome()`, `.home`, `.hero-scene`.
- Упражнение/учебный материал → `index.html`: `letters`, типы вопросов, `ensureQuestion()`, `questionBody()`.
- Проверка ответа → `index.html`: `checkAnswer()`, `registerMistake()`, `registerCorrectAnswer()`, `completeQuestion()`.
- Реакция Marius → `index.html`: `showAnswerFeedback()`, `pickSuccessSticker()`, `renderCompletionSticker()`; `images/stickers/`.
- Добавление изображения персонажа → `images/`, `assets.js`, `index.html`: `characterConfig` / `rewardConfig`.
- Мобильная вёрстка → `index.html`: соответствующий CSS-селектор и все его переопределения в `@media`.
- Награды → `index.html`: `rewardConfig`, `finishBlock()`, `chooseReward()`, `migrateRewards()`.
- Сохранение → `index.html`: `initialState()`, `loadProgress()`, `saveProgress()`.
- Звуки → `audio/`, `assets.js`, `audio-manager.js`; события озвучки — `announceScreen()` в `index.html`.

## 13. Sensitive areas

- `AppState`, ключи/версии сохранения и `migrateRewards()` связывают учебную позицию, статистику и владение вещами: изменение схемы влияет на существующий прогресс.
- `letters`, типы вопросов и размеры групп используются генератором, загрузчиком сохранений, статистикой и условиями наград; изменение курса требует согласованности этих мест.
- `checkAnswer()`, `completeQuestion()`, `answerLocked`, `viewEpoch`, `transitionTimer` связывают ответ, немедленное сохранение, аудио и отложенный переход; нарушение порядка может повторно засчитать ответ или показать старый экран.
- `go()` / `showScreen()` обслуживают все экраны и незавершённый выбор подарка.
- `:root`, общие кнопки, `.character-actor` и поздние `@media` влияют на несколько экранов и совмещение аксессуаров с персонажем.
- `createAudioManager()` общий для всех реплик; подготовка одного аудиоэлемента по пользовательскому жесту важна для Safari. Отмена очереди предотвращает наложение старых инструкций на новый экран.

## 14. Deployment-related files

- `index.html` — статическая точка запуска; подключает соседние файлы относительными путями. `README.md` описывает открытие HTML или запуск через HTTP-сервер.
- `.nojekyll` — отключает обработку Jekyll при публикации на GitHub Pages.
- `manifest.webmanifest`, `icon-180.png`, `icon-192.png`, `icon-512.png` — метаданные и иконки установки.
- `README.md` — ссылка на GitHub Pages и описание публикации корня `main`; `STICKER-UPDATE.md` — сохранённый отчёт о публикации обновления, не источник текущего статуса сервиса.

В репозитории нет workflow-файлов GitHub Actions, `package.json`, конфигурации сборки или service worker. Настройки GitHub Pages находятся вне этих файлов; карта не подтверждает текущий статус удалённого размещения.

## 15. Quick navigation for Codex

```text
TASK → START HERE

UI change → index.html: renderHome / renderCourse / <style>
Exercise logic → index.html: letters / ensureQuestion / checkAnswer
Marius → index.html: renderCharacter / showAnswerFeedback; images/stickers/
Assets → assets.js; images/; audio/
Rewards → index.html: rewardConfig / chooseReward / equipItem
Progress → index.html: initialState / loadProgress / saveProgress
Mobile CSS → index.html: <style> / @media / .character-actor
Audio → audio-manager.js; index.html: announceScreen; assets.js
Deployment → README.md; .nojekyll; manifest.webmanifest
```
