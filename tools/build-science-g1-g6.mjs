// Builds packs/science-g1.json … science-g6.json:  node tools/build-science-g1-g6.mjs
// Lessons follow the Singapore inquiry approach: look closely (observe), learn
// why it happens (explain), then use it (apply: a "your turn" question from the
// skill's own generator, made by tools/packBuilder.mjs). The question banks
// are in js/engine/topics/scienceData.js and scienceDataUpper.js.
import { skill as baseSkill, topic, challenge, writePack } from './packBuilder.mjs';

const SUBJECT = 'science';

/** A picture card: an emoji and/or a short line of text. */
const V = (emoji, text) => ({ kind: 'letters', ...(emoji ? { emoji } : {}), ...(text ? { text } : {}), label: text || 'a picture' });
const quiz = (bank) => ({ type: 'sciQuiz', bank });
const sort = (set, extra = {}) => ({ type: 'sciSort', set, ...extra });
const order = (seqs, extra = {}) => ({ type: 'sciOrder', seqs, ...extra });

/** A skill whose "your turn" step is labelled "Use it", the last stage of a science lesson. */
const skill = (...args) => {
  const s = baseSkill(...args);
  const last = s.lesson.steps.at(-1);
  if (last.stage === 'abstract') last.stage = 'apply';
  // A mass in hundreds of grams: offer 100 g either side, not 1 g.
  const check = last.interact;
  const n = Number(check?.answer);
  if (check?.kind === 'check' && n >= 200 && n % 100 === 0) check.choices = [n - 100, n, n + 100].map(String);
  return s;
};

/* ------------------------------------------------------------------ */
/* Grade 1                                                             */
/* ------------------------------------------------------------------ */
const g1 = [
  topic('sci1-me', 'My body and senses', '🖐️', 'Body parts and the five senses.', [
    skill('sci1-senses', 'My five senses', quiz('senses'), [
      ['observe', 'Close your eyes. What can you hear? What can you smell? Our senses tell us about the world around us.', V('👀 👂 👃 👅 🖐️')],
      ['explain', 'We have five senses. We see with our eyes, hear with our ears, smell with our nose, taste with our tongue and feel with our skin.', V(null, 'see · hear · smell · taste · touch')],
    ]),
    skill('sci1-body', 'Parts of my body', quiz('body'), [
      ['observe', 'Touch your head, your shoulders, your knees and your toes. Each part of your body has a job.', V('🙆')],
      ['explain', 'Your legs help you walk. Your teeth chew food. Inside, your heart pumps blood and your lungs take in air.', V('🦵 🦷 ❤️ 🫁')],
    ]),
  ]),
  topic('sci1-living', 'Living things', '🌱', 'What is alive, and what living things need.', [
    skill('sci1-living-sort', 'Living or non-living?', sort('living'), [
      ['observe', 'A puppy grows into a dog. A rock stays a rock. Which one is alive?', V('🐶 🪨')],
      ['explain', 'Living things grow, need food, water and air, and make young like themselves. A robot can move, but it does not grow or eat, so it is non-living.', V('🌳 🐦 · 🤖 ⚽')],
    ]),
    skill('sci1-needs', 'What living things need', quiz('needs'), [
      ['observe', 'What happens to a plant that is never watered? It droops and dries up.', V('🥀')],
      ['explain', 'All living things need food, water and air. Plants also need sunlight to make their food. Animals and people need shelter too.', V('🍎 💧 💨 ☀️')],
    ]),
  ]),
  topic('sci1-animals', 'Animals', '🐾', 'Where animals live, how they move, and their babies.', [
    skill('sci1-homes', 'Where animals live', quiz('homes'), [
      ['observe', 'Fish swim in water. Birds build nests in trees. Bees live in a hive.', V('🐟 🪺 🐝')],
      ['explain', 'Every animal lives where it can find food, water and shelter. That place is its home.'],
    ]),
    skill('sci1-moves', 'How animals move', quiz('moves'), [
      ['observe', 'Watch how animals move: a bird flies, a fish swims, a frog hops and a snake slides.', V('🐦 🐟 🐸 🐍')],
      ['explain', 'An animal\'s body helps it move. Wings help birds fly. Fins help fish swim. Strong back legs help frogs hop.'],
    ]),
    skill('sci1-babies', 'Animal babies', quiz('babies'), [
      ['observe', 'A kitten grows into a cat. A puppy grows into a dog.', V('🐱 🐶')],
      ['explain', 'Many animal babies have special names: a chick, a calf, a duckling. Some babies, like tadpoles and caterpillars, look very different from their parents.', V('🐣 🐄 🐛')],
    ]),
  ]),
  topic('sci1-plants', 'Plants', '🌻', 'The parts of a plant, and the plant parts we eat.', [
    skill('sci1-plant-parts', 'Parts of a plant', quiz('plantParts1'), [
      ['observe', 'Look at a plant. Roots are under the soil. The stem stands up. Leaves are green and flat.', V('🌱')],
      ['explain', 'Roots hold the plant and take in water. The stem holds it up. Leaves make food. Flowers grow into fruits, and fruits hold seeds.', V('🌸 🍎 🌰')],
    ]),
    skill('sci1-plant-food', 'Plants we eat', sort('plantPartsEaten', { forms: ['name'] }), [
      ['observe', 'A carrot grows under the ground. Pechay leaves grow above it. Both are plants we eat!', V('🥕 🥬')],
      ['explain', 'We eat different parts of plants: roots like carrots, leaves like pechay, flowers like broccoli, fruits like mangoes, and seeds like peanuts.', V('🥦 🥭 🥜')],
    ]),
  ]),
  topic('sci1-world', 'The world around us', '🌍', 'Materials, day and night, and the weather.', [
    skill('sci1-materials', 'What is it made of?', quiz('materials1'), [
      ['observe', 'Tap a window, a table and a spoon. Do they feel the same?', V('🪟 🪵 🥄')],
      ['explain', 'Things are made of materials: glass, wood, metal, plastic, paper, cloth and rubber. Each material is good for different jobs.'],
    ]),
    skill('sci1-day-night', 'Day and night', quiz('sky1'), [
      ['observe', 'In the day, the Sun lights up the sky. At night, it is dark and we may see the Moon and stars.', V('☀️ 🌙 ⭐')],
      ['explain', 'The Sun gives us light and heat. It rises in the morning in the east and sets in the evening in the west.', V('🌅')],
    ]),
    skill('sci1-weather', 'Weather', quiz('weather1'), [
      ['observe', 'Look outside. Is it sunny, cloudy, rainy or windy today?', V('☀️ ☁️ 🌧️ 🌬️')],
      ['explain', 'Weather is what the air outside is like. We wear and bring different things for different weather: a hat for sun, an umbrella for rain.', V('🧢 ☂️')],
    ]),
  ]),
  topic('sci1-healthy', 'Healthy me', '🍎', 'Healthy food and good habits.', [
    skill('sci1-healthy', 'Healthy habits', quiz('healthy1'), [
      ['observe', 'What did you eat today? Did you wash your hands before eating?', V('🧼 🍚 🐟 🥕')],
      ['explain', 'Go foods (rice, bread) give energy. Grow foods (fish, eggs) help us grow. Glow foods (fruits, vegetables) keep us healthy. Wash your hands, brush your teeth and sleep well.'],
    ]),
  ]),
  challenge('sci1', [
    ['sci1-ch-float', 'Float or sink?', sort('float')],
    ['sci1-ch-sound', 'Loud or soft?', sort('sound')],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 2                                                             */
/* ------------------------------------------------------------------ */
const g2 = [
  topic('sci2-animals', 'Animal groups', '🐾', 'Mammals, birds, fish and insects; body coverings; what animals eat.', [
    skill('sci2-groups', 'Animal groups', sort('animals', { groups: ['mammal', 'bird', 'fish', 'insect'] }), [
      ['observe', 'A dog has fur. A chicken has feathers. A fish has fins. An ant has six legs. How are they different?', V('🐶 🐔 🐟 🐜')],
      ['explain', 'Mammals have fur and feed their babies milk. Birds have feathers and beaks. Fish live in water and breathe with gills. Insects have six legs.'],
    ]),
    skill('sci2-coverings', 'Body coverings', quiz('coverings'), [
      ['observe', 'Stroke a cat: soft fur. Touch a feather: light and smooth. Look at a fish: shiny scales.', V('🐱 🪶 🐟')],
      ['explain', 'Body coverings protect animals. Fur keeps mammals warm. Feathers help birds fly and stay warm. Scales protect fish and reptiles.'],
    ]),
    skill('sci2-diet', 'What animals eat', sort('diet'), [
      ['observe', 'A cow eats grass. A lion eats other animals. A chicken eats grain and worms.', V('🐄 🦁 🐔')],
      ['explain', 'Some animals eat only plants. Some eat only other animals. Some eat both plants and animals.'],
    ]),
  ]),
  topic('sci2-plants', 'How plants grow', '🌱', 'What plants need, from seed to plant, and how we use plants.', [
    skill('sci2-plant-needs', 'What plants need', quiz('plantNeeds'), [
      ['observe', 'Grow two bean seeds. Keep one in the light and one in a dark box. After a week, the one in the dark is pale, thin and weak.', V('🌱 📦')],
      ['explain', 'Plants need sunlight, water, air and space to grow. They make their own food in their leaves.', V('☀️ 💧 💨')],
    ]),
    skill('sci2-seed', 'From seed to plant', order(['beanPlant']), [
      ['observe', 'Soak a bean seed and watch it each day. First a root pokes out, then a shoot with tiny leaves.', V('🌰 🌱')],
      ['explain', 'A seed grows into a seedling, then a young plant, then an adult plant with flowers. The flowers make pods with new seeds.', V(null, 'seed → seedling → plant → flowers → seeds')],
    ]),
    skill('sci2-plant-uses', 'How we use plants', quiz('plantUses'), [
      ['observe', 'Look around your home. What came from a plant? Rice, wood, paper, cotton…', V('🍚 🪑 📄 👕')],
      ['explain', 'Plants give us food, wood, paper, cloth, rope, oil and medicine. Trees also give us shade and oxygen.'],
    ]),
  ]),
  topic('sci2-matter', 'Materials and matter', '🧱', 'What materials are like; solids, liquids and gases.', [
    skill('sci2-properties', 'What is it like?', quiz('properties2'), [
      ['observe', 'Squeeze a sponge, then a rock. Rub sandpaper, then a mirror. How do they feel?', V('🧽 🪨 🪞')],
      ['explain', 'We describe materials by their properties: hard or soft, rough or smooth, bendy, waterproof, or see-through. We choose materials for these properties.'],
    ]),
    skill('sci2-states', 'Solid, liquid or gas?', sort('states'), [
      ['observe', 'Pour water into a cup: it takes the cup\'s shape. A block stays a block. Air fills a balloon.', V('🧊 💧 🎈')],
      ['explain', 'A solid keeps its own shape. A liquid flows and takes the shape of its container. A gas spreads out to fill any space.'],
    ]),
  ]),
  topic('sci2-forces', 'Pushes, pulls and magnets', '🧲', 'Push or pull, and what magnets attract.', [
    skill('sci2-push-pull', 'Push or pull?', sort('pushPull'), [
      ['observe', 'Kick a ball. Open a drawer. One moves away from you; one comes toward you.', V('⚽ 🗄️')],
      ['explain', 'A push moves something away from you. A pull moves something toward you. Pushes and pulls can make things start, stop or change direction.'],
    ]),
    skill('sci2-magnets', 'Magnets', quiz('magnets2'), [
      ['observe', 'Hold a magnet near a steel paper clip, a plastic button and a pencil. Which one jumps to the magnet?', V('🧲 📎')],
      ['explain', 'Magnets attract things made of iron and steel. They do not attract wood, plastic, paper, glass or rubber. A magnet is strongest at its ends, called poles.'],
    ]),
  ]),
  topic('sci2-earth', 'Earth and sky', '☀️', 'Weather and seasons; the Sun, the Moon and the stars.', [
    skill('sci2-weather', 'Weather and seasons', quiz('weather2'), [
      ['observe', 'Keep a weather chart for a week. Draw the Sun, clouds or rain each day.', V('☀️ ☁️ 🌧️')],
      ['explain', 'The Philippines has a wet season (about June to November) and a dry season. A thermometer measures temperature and a rain gauge measures rain. PAGASA warns us about typhoons.', V('🌡️ 🌀')],
    ]),
    skill('sci2-sky', 'Sun, Moon and stars', quiz('sky2'), [
      ['observe', 'Look at the Moon each night for a week. Does its shape stay the same?', V('🌒 🌓 🌔 🌕')],
      ['explain', 'The Sun is a star. The Moon has no light of its own; it reflects sunlight. The Earth spins once a day, which gives us day and night.'],
    ]),
  ]),
  challenge('sci2', [
    ['sci2-ch-groups', 'All six animal groups', sort('animals')],
    ['sci2-ch-shadows', 'Light and shadows', quiz('shadows2')],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 3                                                             */
/* ------------------------------------------------------------------ */
const g3 = [
  topic('sci3-diversity', 'Diversity of living things', '🌿', 'What all living things do; classifying animals, plants, fungi and bacteria.', [
    skill('sci3-life', 'Signs of life', quiz('lifeProcesses'), [
      ['observe', 'Touch a makahiya leaf. It folds up! What else shows that something is alive?', V('🌿')],
      ['explain', 'All living things need food, water and air, grow, respond to changes around them, and reproduce. A car moves, but cannot grow or reproduce, so it is not alive.'],
    ]),
    skill('sci3-animal-groups', 'Classifying animals', sort('animals'), [
      ['observe', 'A whale lives in the sea like a fish. A bat flies like a bird. Are they fish and birds?', V('🐋 🦇')],
      ['explain', 'We group animals by their features. Mammals have fur and feed their young milk, so whales and bats are mammals. Birds have feathers; fish have gills; reptiles have dry scales; amphibians have moist skin; insects have six legs.'],
    ]),
    skill('sci3-plant-groups', 'Flowering and non-flowering plants', sort('plantGroups'), [
      ['observe', 'Look under a fern leaf. You may see tiny brown dots. A gumamela has big red flowers.', V('🌿 🌺')],
      ['explain', 'Flowering plants make flowers, then fruits with seeds. Non-flowering plants do not: ferns and mosses make spores, and pine trees make seeds in cones.'],
    ]),
    skill('sci3-fungi', 'Fungi and bacteria', quiz('fungi'), [
      ['observe', 'Seal a slice of damp bread in a clear plastic bag and leave it somewhere warm for a few days. Fuzzy mould grows on it. Do not open, touch or sniff it; throw it away still sealed.', V('🍞 🍄')],
      ['explain', 'Mould, mushrooms and yeast are fungi. They cannot make their own food; they feed on what they grow on and make spores. Bacteria are tiny living things seen only with a microscope. Some are harmful, some helpful.'],
    ]),
  ]),
  topic('sci3-materials', 'Materials', '🧱', 'Properties of materials and why we choose them.', [
    skill('sci3-properties', 'Properties of materials', quiz('materialProps'), [
      ['observe', 'Bend a rubber band, a plastic ruler and a stick. Drop a cloth and a plastic cup onto a soft mat. (Glass would break and could cut you.)', V('🪢 📏 🪵')],
      ['explain', 'Materials differ in strength, hardness, flexibility, whether they are waterproof, whether light passes through, and whether they float.'],
    ]),
    skill('sci3-uses', 'Choosing materials', quiz('materialUses'), [
      ['observe', 'Why is a pot metal but its handle plastic? Why is a window glass?', V('🍳 🪟')],
      ['explain', 'We choose a material because of its properties. Metal lets heat through to cook food; plastic does not, so it keeps our hands safe. Glass is transparent, so light comes in.'],
    ]),
  ]),
  topic('sci3-cycles', 'Life cycles', '🦋', 'How animals and plants grow and reproduce.', [
    skill('sci3-animal-cycles', 'Animal life cycles', order(['butterfly', 'frog', 'chicken', 'mosquito', 'cockroach']), [
      ['observe', 'A caterpillar eats and grows, then hangs still as a pupa. Weeks later, a butterfly comes out!', V('🐛 🦋')],
      ['explain', 'Some animals have 4 stages: egg, larva, pupa, adult (butterfly, mosquito). Others have 3: egg, young, adult (chicken, cockroach). A frog changes from a tadpole in water to an adult that can live on land.', V(null, 'egg → larva → pupa → adult')],
    ]),
    skill('sci3-cycle-facts', 'Life cycle facts', quiz('cycleFacts'), [
      ['observe', 'Look for still water in old cans and tyres around your home. Tiny wriggling larvae may be mosquitoes.', V('🦟 🛞')],
      ['explain', 'Mosquito larvae live in still water. Emptying containers stops mosquitoes from breeding, which helps prevent dengue.'],
    ]),
    skill('sci3-plant-cycle', 'Plant life cycle', order(['plantCycle']), [
      ['observe', 'Plant a mung bean (monggo) seed in wet cotton. Watch it grow day by day.', V('🌰 🌱')],
      ['explain', 'A seed germinates into a seedling, grows into an adult plant, makes flowers, and the flowers become fruits with seeds. The seeds start the cycle again.'],
    ]),
  ]),
  topic('sci3-systems', 'Plant and body systems', '🫁', 'Plant parts and their jobs; the digestive system.', [
    skill('sci3-plant-parts', 'Plant parts and their jobs', quiz('plantParts3'), [
      ['observe', 'Put a celery stalk in coloured water. After a day, the colour reaches the leaves.', V('🥬')],
      ['explain', 'Roots hold the plant and take in water and mineral salts. The stem holds the plant up and carries water and food. Leaves make food. Flowers become fruits, which protect the seeds.'],
    ]),
    skill('sci3-digestion', 'The digestive system', { type: 'mixed', of: [quiz('digestion'), quiz('digestion'), order(['digestion'])] }, [
      ['observe', 'Chew a piece of bread for a long time. It starts to taste sweet: digestion has begun in your mouth.', V('🍞')],
      ['explain', 'Food goes from the mouth, down the gullet, to the stomach, then the small intestine and the large intestine.', V(null, 'mouth → gullet → stomach → small intestine → large intestine')],
      ['explain', 'Digestion breaks food into tiny pieces. In the small intestine, digested food passes into the blood. The large intestine takes in water, and what is left leaves the body.'],
    ]),
  ]),
  topic('sci3-magnets', 'Magnets', '🧲', 'Magnetic materials; poles that attract and repel.', [
    skill('sci3-magnetic', 'Magnetic or not?', sort('magnetic'), [
      ['observe', 'Test a steel paper clip, an aluminium can and a copper wire with a magnet. All three are metals. Which ones stick?', V('📎 🥫')],
      ['explain', 'Magnets attract iron and steel. Not every metal is magnetic: aluminium, copper and gold are not attracted.'],
    ]),
    skill('sci3-poles', 'Poles: attract and repel', { type: 'mixed', of: [{ type: 'magnetPoles' }, quiz('magnetFacts')] }, [
      ['observe', 'Push the N poles of two magnets together. You can feel them push apart! Now turn one around.', V('🧲 🧲')],
      ['explain', 'Every magnet has a north (N) and a south (S) pole. Like poles repel. Unlike poles attract. Only a magnet can repel another magnet.', V(null, 'N → ← S attract · N ← → N repel')],
    ]),
  ]),
  topic('sci3-inquiry', 'Think like a scientist', '🔬', 'Read an experiment and its results.', [
    skill('sci3-experiment', 'Reading an experiment', { type: 'experiment', forms: ['changed', 'measured', 'best', 'worst'] }, [
      ['observe', 'Scientists ask a question, then test it. For example: does light help plants grow? Give 4 plants different hours of light, and measure them.', V('🌱 💡')],
      ['explain', 'In a fair test, we change one thing and measure what happens. We write the results in a table so we can compare them.'],
    ]),
  ]),
  challenge('sci3', [
    ['sci3-ch-orders', 'Put the cycles in order', order(['butterfly', 'frog', 'mosquito', 'cockroach', 'chicken', 'plantCycle', 'beanPlant', 'digestion'], { forms: ['order'] })],
    ['sci3-ch-fair', 'Fair tests', { type: 'experiment', forms: ['same', 'conclude'] }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 4                                                             */
/* ------------------------------------------------------------------ */
const g4 = [
  topic('sci4-matter', 'Matter', '🧪', 'Mass and volume; solids, liquids and gases.', [
    skill('sci4-matter', 'What is matter?', quiz('matter'), [
      ['observe', 'Push an upside-down empty cup into a basin of water. Why does the water not go in?', V('🥛 💧')],
      ['explain', 'Matter is anything that has mass and takes up space. Air is matter: it fills the cup. Light, heat and sound are not matter.'],
    ]),
    skill('sci4-states', 'Properties of solids, liquids and gases', quiz('statesProps'), [
      ['observe', 'Pour 200 ml of water from a tall glass into a wide bowl. Push the plunger of a syringe (with no needle) full of air, then one full of water.', V('🥛 🥣')],
      ['explain', 'A solid has a fixed shape and volume. A liquid has a fixed volume but takes the shape of its container. A gas has no fixed shape or volume and can be compressed.'],
    ]),
    skill('sci4-volume', 'Measuring volume', { type: 'displacement' }, [
      ['observe', 'A measuring cylinder has 50 ml of water. Drop in a stone. The water rises to 65 ml.', V('🧪', '50 ml → 65 ml')],
      ['explain', 'The stone pushes aside water equal to its own volume. 65 − 50 = 15 ml, and 1 ml takes up 1 cm³, so the stone\'s volume is 15 cm³.'],
    ]),
  ]),
  topic('sci4-changes', 'Changes of state', '💧', 'Melting, freezing, evaporation, condensation and the water cycle.', [
    skill('sci4-change-names', 'Melting, freezing, evaporating', quiz('changeState'), [
      ['observe', 'Leave an ice cube on a plate. Put a glass of iced water on the table and watch its outside.', V('🧊 🥤')],
      ['explain', 'Gaining heat: solids melt and liquids evaporate (or boil). Losing heat: gases condense and liquids freeze. Pure water freezes at 0 °C and boils at 100 °C.', V(null, 'solid ⇄ liquid ⇄ gas')],
    ]),
    skill('sci4-water-cycle', 'The water cycle', order(['waterCycle']), [
      ['observe', 'Puddles disappear on a sunny day. Where does the water go?', V('☀️ 💧 ☁️')],
      ['explain', 'The Sun heats water, which evaporates. The water vapour rises, cools and condenses into clouds. The droplets join and fall as rain, and the cycle repeats.'],
    ]),
    skill('sci4-melt-boil', 'Melting and boiling points', { type: 'stateAtTemp' }, [
      ['observe', 'Butter melts on a hot day. Ice melts even in a cool room. Each substance melts and boils at its own temperatures.', V('🧈 🧊')],
      ['explain', 'Below its melting point, a substance is a solid. Between its melting and boiling points, it is a liquid. Above its boiling point, it is a gas.'],
    ]),
  ]),
  topic('sci4-heat', 'Heat', '🔥', 'Heat and temperature; good and poor conductors.', [
    skill('sci4-heat', 'Heat and temperature', quiz('heat'), [
      ['observe', 'Ask an adult to pour hot water into a bowl. Drop in a dented ping-pong ball. The dent pops out!', V('🏓 ♨️')],
      ['explain', 'Heat flows from hotter to colder things. When things gain heat they usually expand; when they lose heat they contract. A thermometer measures temperature in °C.'],
    ]),
    skill('sci4-conductors', 'Good and poor conductors of heat', sort('heatConductors'), [
      ['observe', 'Ask an adult to pour hot water into a cup, then stand a metal spoon and a wooden spoon in it. After a minute, which handle is warmer?', V('🥄 ☕')],
      ['explain', 'Metals are good conductors of heat. Wood, plastic, cloth, rubber, foam and trapped air are poor conductors: they slow heat down.'],
    ]),
  ]),
  topic('sci4-light', 'Light', '💡', 'How we see, transparent and opaque materials, and shadows.', [
    skill('sci4-light', 'Light and how we see', quiz('light'), [
      ['observe', 'In a dark room you see nothing. Switch on a torch, and the room appears.', V('🔦')],
      ['explain', 'Light travels in straight lines. We see an object when light from it, or reflected off it, enters our eyes. The Moon and mirrors do not make light; they reflect it.'],
    ]),
    skill('sci4-see-through', 'Transparent, translucent, opaque', sort('lightPass'), [
      ['observe', 'Shine a torch through clear glass, wax paper and a book. How much light gets through each?', V('🪟 📄 📕')],
      ['explain', 'Transparent: almost all light passes through. Translucent: some light passes through, so things look blurry. Opaque: no light passes through.'],
    ]),
    skill('sci4-shadows', 'Shadows', quiz('shadows4'), [
      ['observe', 'Make a hand shadow on the wall with a torch. Move your hand closer to the torch, then farther away.', V('🔦 ✋')],
      ['explain', 'An opaque object blocks light, so a shadow forms on the side away from the light. The closer the object is to the light, the bigger its shadow.'],
    ]),
  ]),
  topic('sci4-inquiry', 'Think like a scientist', '🔬', 'Fair tests and what results show.', [
    skill('sci4-fair-test', 'Fair tests', { type: 'experiment', forms: ['changed', 'measured', 'same', 'conclude'] }, [
      ['observe', 'Ben wants to know if hot water dissolves sugar faster. He uses water at 4 temperatures.', V('🥄 ☕')],
      ['explain', 'A fair test changes only one thing (the variable). Everything else is kept the same, like the amount of sugar and water. Then the results show the effect of that one change.'],
    ]),
  ]),
  challenge('sci4', [
    ['sci4-ch-heat', 'Gaining and losing heat', quiz('heatGainLoss')],
    ['sci4-ch-predict', 'Predict the result', { type: 'experiment', forms: ['predict', 'conclude'] }],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 5                                                             */
/* ------------------------------------------------------------------ */
const g5 = [
  topic('sci5-cells', 'Cells', '🔬', 'Parts of a cell; plant and animal cells.', [
    skill('sci5-cell-parts', 'Parts of a cell', quiz('cellParts'), [
      ['observe', 'Under a microscope, a thin onion skin shows rows of tiny boxes. Each box is a cell.', V('🔬 🧅')],
      ['explain', 'The nucleus controls the cell. The cell membrane controls what goes in and out. Most activities happen in the cytoplasm. Plant cells also have a cell wall, a large vacuole and often chloroplasts.'],
    ]),
    skill('sci5-cell-compare', 'Plant and animal cells', quiz('cellCompare'), [
      ['explain', 'Plant and animal cells both have a nucleus, cytoplasm and cell membrane. Only plant cells have a cell wall. Cells in green parts of plants have chloroplasts to make food.', V(null, 'plant cell: + cell wall + chloroplasts')],
    ]),
  ]),
  topic('sci5-body', 'Body systems', '❤️', 'Breathing, the heart and blood, and how systems work together.', [
    skill('sci5-respiratory', 'Breathing', quiz('respiratory'), [
      ['observe', 'Put your hand on your chest and breathe in deeply. Your chest rises as your lungs fill with air.', V('🫁')],
      ['explain', 'Air goes in through the nose, down the windpipe, into the lungs. In the tiny air sacs, oxygen passes into the blood and carbon dioxide passes out.'],
    ]),
    skill('sci5-circulatory', 'The heart and blood', quiz('circulatory'), [
      ['observe', 'Count your pulse for 15 seconds. Jump for a minute, then count again. It is faster!', V('❤️ ⏱️')],
      ['explain', 'The heart pumps blood. Arteries carry it away from the heart, capillaries reach every cell, and veins bring it back. Blood carries oxygen, food and carbon dioxide.'],
    ]),
    skill('sci5-paths', 'Follow the path', order(['airPath', 'bloodPath']), [
      ['explain', 'Air path: nose → windpipe → lungs → air sacs → blood. Blood path: heart → arteries → capillaries → veins → back to the heart.'],
    ]),
  ]),
  topic('sci5-plants', 'Plant systems', '🌸', 'How plants carry water and food; flowers, pollination and seeds.', [
    skill('sci5-transport', 'How plants carry water and food', { type: 'mixed', of: [quiz('plantTransport'), quiz('plantTransport'), order(['plantWater'])] }, [
      ['observe', 'Put a white flower in water with red food colouring. After a day, its petals turn red.', V('🌸 🔴')],
      ['explain', 'Water-carrying tubes take water and mineral salts up from the roots to the leaves. Food-carrying tubes take food from the leaves to all parts of the plant.'],
    ]),
    skill('sci5-flowers', 'Flowers and pollination', { type: 'mixed', of: [quiz('flowerParts'), quiz('flowerParts'), order(['flowerToFruit'])] }, [
      ['observe', 'Look at a gumamela flower. The long stalk in the middle is covered with many tiny stamens; their yellow dust is pollen. The five fuzzy red pads at the tip are the stigma.', V('🌺')],
      ['explain', 'Pollination: pollen from an anther lands on a stigma. Fertilisation: a male cell joins an egg in the ovule. Then the ovary becomes the fruit and the ovules become seeds.', V(null, 'pollination → fertilisation → fruit and seeds')],
    ]),
    skill('sci5-dispersal', 'How seeds travel', sort('dispersal'), [
      ['observe', 'A coconut can float across the sea to a new island. Why do seeds need to travel?', V('🥥 🌊')],
      ['explain', 'Seeds spread away from the parent plant so the young plants get enough light, water and space. They travel by wind, water, animals, or by pods splitting open.'],
    ]),
  ]),
  topic('sci5-water', 'Water', '💧', 'The water cycle and saving water.', [
    skill('sci5-water', 'Water for life', quiz('waterResource'), [
      ['observe', 'Most of the Earth is covered in water, yet some places run short. Why?', V('🌍 🚰')],
      ['explain', 'Almost all of Earth\'s water is salty. The water cycle brings fresh water back as rain, but we must not waste or pollute it.'],
    ]),
  ]),
  topic('sci5-electricity', 'Electricity', '⚡', 'Circuits, conductors and insulators, and using electricity safely.', [
    skill('sci5-circuits', 'Will the bulb light?', { type: 'circuit', forms: ['switches', 'gap'] }, [
      ['observe', 'Join a battery, wires and a bulb in a loop. The bulb lights. Open a switch, and it goes out.', V('🔋 💡')],
      ['explain', 'Electricity flows only around a closed circuit. An open switch, a gap or an insulator in the loop stops the flow.'],
    ]),
    skill('sci5-conductors', 'Conductors and insulators', sort('electricConductors'), [
      ['observe', 'Test things in the gap of a circuit: a paper clip, a rubber band, pencil lead, a plastic ruler.', V('📎 ✏️ 📏')],
      ['explain', 'Conductors, like metals and graphite, let electricity flow. Insulators, like plastic, rubber, wood and glass, do not.'],
    ]),
    skill('sci5-electricity', 'Using electricity', quiz('electricity'), [
      ['explain', 'In series (one loop), bulbs share the battery\'s energy, so they are dimmer, and all go out if one breaks. In parallel (separate branches), each bulb has its own path. Never touch switches with wet hands.'],
    ]),
  ]),
  topic('sci5-inquiry', 'Think like a scientist', '🔬', 'Plan fair tests and predict results.', [
    skill('sci5-experiment', 'Plan and predict', { type: 'experiment', forms: ['same', 'conclude', 'predict'] }, [
      ['explain', 'Use the pattern in a results table to predict. If 4 hours gave 12 cm and 6 hours gave 16 cm, then 5 hours should give between 12 cm and 16 cm.', V(null, '4 h → 12 cm · 5 h → ? · 6 h → 16 cm')],
    ]),
  ]),
  challenge('sci5', [
    ['sci5-ch-circuits', 'Parallel circuits', { type: 'circuit', forms: ['parallel'] }],
    ['sci5-ch-systems', 'Systems working together', quiz('bodyTogether')],
  ]),
];

/* ------------------------------------------------------------------ */
/* Grade 6                                                             */
/* ------------------------------------------------------------------ */
const g6 = [
  topic('sci6-energy', 'Energy', '⚡', 'Forms of energy, energy changes and photosynthesis.', [
    skill('sci6-energy-forms', 'Forms of energy', quiz('energyForms'), [
      ['observe', 'Stretch a rubber band and let go. Lift a book onto a shelf. Eat a banana. Where is the energy in each?', V('🪢 📚 🍌')],
      ['explain', 'Kinetic energy is the energy of moving things. Potential energy is stored: by height, by stretching, or as chemicals in food and batteries. Light, heat, sound and electrical energy are other forms.'],
    ]),
    skill('sci6-energy-change', 'Energy changes', quiz('energyChange'), [
      ['observe', 'Switch on a torch. Feel the bulb after a minute: it is warm.', V('🔦')],
      ['explain', 'Energy is never made or destroyed; it changes form. In a torch: chemical (battery) → electrical → light and heat.', V(null, 'chemical → electrical → light + heat')],
    ]),
    skill('sci6-photosynthesis', 'Photosynthesis', quiz('photosynthesis'), [
      ['observe', 'Put a water plant under bright light. Tiny bubbles of gas rise from its leaves.', V('🌿 🫧')],
      ['explain', 'In photosynthesis, chlorophyll traps light energy to turn water and carbon dioxide into sugar, giving out oxygen.', V(null, 'light + water + carbon dioxide → sugar + oxygen')],
    ]),
  ]),
  topic('sci6-forces', 'Forces', '🏋️', 'Gravity, friction and springs.', [
    skill('sci6-forces', 'Kinds of forces', quiz('forces'), [
      ['observe', 'Drop a ball, slide a book across a table, and stretch a spring. Each one is a force at work.', V('⚽ 📕')],
      ['explain', 'A force is a push or a pull, measured in newtons. Gravity pulls things down. Friction acts against motion. A spring pushes or pulls back. Forces can change speed, direction or shape.'],
    ]),
    skill('sci6-friction', 'Friction', quiz('friction'), [
      ['observe', 'Slide a toy car on a carpet, then on smooth tiles. Where does it go farther?', V('🚗')],
      ['explain', 'Friction is greater between rough surfaces and smaller between smooth or oiled ones. It is useful (walking, braking) but also wears things out and makes heat.'],
    ]),
    skill('sci6-spring', 'Springs and stretch', { type: 'springStretch' }, [
      ['observe', 'Hang masses on a spring, 100 g at a time, and measure its length each time.', V('⚖️')],
      ['explain', 'A spring stretches by the same amount for each equal mass, as long as it is not stretched past its limit. Find the stretch for 100 g, then use it to predict.'],
    ]),
  ]),
  topic('sci6-environment', 'Living together', '🌏', 'Food chains, habitats, adaptations and caring for the environment.', [
    skill('sci6-food-chains', 'Food chains', { type: 'foodChain', forms: ['producer', 'eats', 'eatenBy', 'top'] }, [
      ['observe', 'In a rice field, rats eat the rice, snakes eat the rats, and hawks eat the snakes.', V(null, 'rice plant → rat → snake → hawk')],
      ['explain', 'A food chain starts with a producer, such as a green plant or algae. Each arrow points to the animal that eats it. Animals are consumers.'],
    ]),
    skill('sci6-ecosystem', 'Habitats and communities', quiz('ecosystem'), [
      ['explain', 'A population is all of one kind of living thing in a place. A community is all the populations living together. The habitat is the place. Decomposers break down dead things.', V('🐟 🐸 🌿 🍄')],
    ]),
    skill('sci6-adaptations', 'Adaptations', quiz('adaptations'), [
      ['observe', 'Why does a duck have webbed feet, and an eagle sharp claws?', V('🦆 🦅')],
      ['explain', 'Adaptations are features or behaviours that help a living thing survive in its habitat: to get food, escape predators, keep warm, or save water.'],
    ]),
    skill('sci6-impact', 'People and the environment', quiz('humanImpact'), [
      ['explain', 'People can harm the environment by cutting forests and polluting, or protect it by planting trees and mangroves, practising the 3Rs and saving energy.', V('🌳 ♻️')],
    ]),
  ]),
  topic('sci6-space', 'Earth and space', '🪐', 'The Solar System; the Earth, the Moon and the Sun.', [
    skill('sci6-solar-system', 'The Solar System', quiz('solarSystem'), [
      ['explain', 'Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune.', V('☀️ 🪐', 'Mercury · Venus · Earth · Mars · Jupiter · Saturn · Uranus · Neptune')],
    ]),
    skill('sci6-earth-moon', 'Earth, Moon and Sun', quiz('earthMoon'), [
      ['observe', 'Shine a torch on a ball in a dark room and walk around it. You see more or less of its lit half: that is how Moon phases work.', V('🔦 🌓')],
      ['explain', 'The Earth rotates once a day (day and night) and revolves around the Sun once a year. The Moon orbits the Earth about once a month.'],
    ]),
  ]),
  topic('sci6-inquiry', 'Think like a scientist', '🔬', 'Experiments from start to finish.', [
    skill('sci6-experiment', 'Investigations', { type: 'experiment', forms: ['changed', 'measured', 'same', 'best', 'worst', 'conclude', 'predict'] }, [
      ['explain', 'An investigation: ask a question, change one variable, keep the others the same, measure the results, look for a pattern, and make a conclusion.'],
    ]),
  ]),
  challenge('sci6', [
    ['sci6-ch-food-webs', 'When a population changes', { type: 'foodChain', forms: ['removePrey', 'removePredator'] }],
    ['sci6-ch-spring', 'Spring puzzles', { type: 'springStretch', forms: ['mass', 'length'] }],
  ]),
];

writePack('science-g1', 'Science · Grade 1', g1, '1.0.0', SUBJECT);
writePack('science-g2', 'Science · Grade 2', g2, '1.0.0', SUBJECT);
writePack('science-g3', 'Science · Grade 3', g3, '1.0.0', SUBJECT);
writePack('science-g4', 'Science · Grade 4', g4, '1.0.0', SUBJECT);
writePack('science-g5', 'Science · Grade 5', g5, '1.0.0', SUBJECT);
writePack('science-g6', 'Science · Grade 6', g6, '1.0.0', SUBJECT);
