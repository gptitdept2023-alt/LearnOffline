/**
 * Science for Grades 1–3: question banks, sorting sets and sequences
 * (science.js turns them into questions). Data only, no logic.
 *
 * Every question is original and has one right answer, written by hand.
 * tests/science.test.mjs checks that no wrong answer repeats the right one.
 * Grades 1 and 2 are read aloud, so their questions are short and plain.
 *
 * Bank items: q = question, a = right answer, w = wrong answers,
 * e = why (shown after a wrong answer), pic = picture (emoji, optional).
 */

const Q = (q, a, w, e, pic) => ({ q, a, w, e, ...(pic ? { pic } : {}) });
const it = (name, emoji, why) => ({ name, emoji, ...(why ? { why } : {}) });
/** A mass noun or activity ("water", "kicking a ball"): said without "a". */
const m = (name, emoji, why) => ({ ...it(name, emoji, why), mass: true });
/** words: { pick: 'Which one floats?', is: 'floats' } when "Which one is …?" would read badly. */
const group = (label, name, why, items, words = {}) => ({ label, name, why, items, ...words });

/* ------------------------------------------------------------------ */
/* Grade 1                                                             */
/* ------------------------------------------------------------------ */

const G1 = {
  senses: {
    hint: 'We have five senses: we see with our eyes, hear with our ears, smell with our nose, taste with our tongue and feel with our skin.',
    items: [
      Q('You smell a flower with your…', 'nose', ['ears', 'tongue'], 'Your nose smells. Sniff a flower to smell it.', '🌸'),
      Q('You hear a bell with your…', 'ears', ['eyes', 'nose'], 'Your ears hear sounds, like a ringing bell.', '🔔'),
      Q('You taste a mango with your…', 'tongue', ['ears', 'skin'], 'Your tongue tastes. A ripe mango tastes sweet.', '🥭'),
      Q('You see a rainbow with your…', 'eyes', ['nose', 'tongue'], 'Your eyes see colours and shapes.', '🌈'),
      Q('You feel that ice is cold with your…', 'skin', ['ears', 'eyes'], 'Your skin feels hot and cold, soft and rough.', '🧊'),
      Q('Which sense tells you that a drum is loud?', 'hearing', ['taste', 'smell'], 'You hear sounds with your ears. That is the sense of hearing.', '🥁'),
      Q('Which sense tells you that a lemon is sour?', 'taste', ['hearing', 'sight'], 'Your tongue tells you a lemon is sour. That is the sense of taste.', '🍋'),
      Q("Which sense tells you that a cat's fur is soft?", 'touch', ['smell', 'hearing'], 'You feel soft fur with your skin. That is the sense of touch.', '🐱'),
      Q('Which sense tells you that bread is baking in the next room?', 'smell', ['touch', 'taste'], 'You can smell bread baking even from another room.', '🍞'),
      Q('Which sense tells you that the sky is blue?', 'sight', ['taste', 'smell'], 'You see colours with your eyes. That is the sense of sight.'),
      Q('How many senses do you have?', 'five', ['two', 'ten'], 'You have five senses: sight, hearing, smell, taste and touch.'),
      Q('You cover your ears when a sound is too…', 'loud', ['quiet', 'far away'], 'Very loud sounds can hurt your ears, so we cover them.', '🔊'),
    ],
  },
  body: {
    hint: 'Point to each part on your own body. What does it help you do?',
    items: [
      Q('You chew food with your…', 'teeth', ['ears', 'knees'], 'Your teeth bite and chew food into small pieces.', '🍗'),
      Q('Which part bends in the middle of your leg?', 'knee', ['elbow', 'wrist'], 'Your knee bends in the middle of your leg. Your elbow bends in your arm.', '🦵'),
      Q('Which part bends in the middle of your arm?', 'elbow', ['knee', 'ankle'], 'Your elbow bends in the middle of your arm.', '💪'),
      Q('What do you use to walk and run?', 'legs', ['ears', 'nose'], 'Your legs carry you when you walk, run and jump.', '🏃'),
      Q('What is inside your chest that pumps blood?', 'heart', ['stomach', 'teeth'], 'Your heart pumps blood all around your body. Feel it beat after you run!'),
      Q('Air goes into your … when you breathe in.', 'lungs', ['stomach', 'bones'], 'When you breathe in, air goes down into your lungs.'),
      Q('Where does your food go after you swallow it?', 'stomach', ['lungs', 'heart'], 'Food goes down a tube to your stomach.'),
      Q('What hard parts inside your body hold you up?', 'bones', ['hair', 'skin'], 'Your bones are hard. They hold your body up and give it shape.'),
      Q('What helps you think and remember?', 'brain', ['stomach', 'knee'], 'Your brain is inside your head. It helps you think, learn and remember.'),
      Q('You pick up a pencil with your…', 'fingers', ['elbows', 'knees'], 'Your fingers can hold and pick up small things.', '✏️'),
      Q('What covers your whole body?', 'skin', ['bones', 'heart'], 'Skin covers your whole body and protects it.'),
      Q('How many fingers are on one hand?', 'five', ['four', 'ten'], 'One hand has five fingers. Two hands have ten.', '🖐️'),
    ],
  },
  needs: {
    hint: 'All living things need food, water and air. Plants also need light.',
    items: [
      Q('What do all living things need to stay alive?', 'food, water and air', ['toys and games', 'shoes and hats'], 'All living things need food, water and air.'),
      Q('A plant needs sunlight to…', 'make its food', ['sleep at night', 'stay cold'], 'Plants use sunlight to make their own food in their leaves.', '🌱'),
      Q('Ana forgot to water her plant for two weeks. What happened to it?', 'It dried up and drooped.', ['It grew taller and greener.', 'It grew more flowers.'], 'Plants need water. Without water, a plant dries up and droops.', '🥀'),
      Q('Why do we eat food?', 'to get energy and grow', ['to feel sleepy all day', 'so we never need water'], 'Food gives us energy to move, play and grow.'),
      Q('Fish take in oxygen from the…', 'water', ['sand', 'rocks'], 'Fish use their gills to take in oxygen from the water.', '🐟'),
      Q('What does a puppy need to grow?', 'food and water', ['a toy car', 'a pencil'], 'A puppy needs food and water, like all living things.', '🐶'),
      Q('Which one is NOT a need of living things?', 'toys', ['food', 'water', 'air'], 'Toys are fun, but living things do not need them to stay alive.'),
      Q('A safe place to rest, like a house or a nest, is called…', 'shelter', ['food', 'water'], 'Shelter keeps animals and people safe from rain, heat and danger.', '🏠'),
      Q('Why do we drink water every day?', 'Our bodies need water to stay alive.', ['Water makes our hair longer.', 'We only need it when we are sick.'], 'Our bodies use water all the time, so we drink it every day.', '💧'),
      Q('A plant was kept in a dark box for a week. How did it look?', 'pale, thin and weak', ['green and strong', 'full of fruits'], 'Plants need light. In the dark, a plant turns pale, thin and weak, and may grow tall and spindly.', '📦'),
      Q('What do we breathe in to stay alive?', 'air', ['water', 'sand'], 'We breathe air in and out all day and night.'),
      Q('What does a baby need to grow?', 'milk, food and care', ['a phone', 'a bicycle'], 'Babies need milk, food, sleep and someone to care for them.', '👶'),
    ],
  },
  homes: {
    hint: 'Think about where you have seen this animal. Does it need water, trees or the ground?',
    items: [
      Q('Where does a fish live?', 'in water', ['in a nest', 'under the ground'], 'Fish live in water: in the sea, rivers and ponds.', '🐟'),
      Q('Where does a bird lay its eggs?', 'in a nest', ['in a pond', 'in a beehive'], 'Most birds build nests to keep their eggs safe.', '🐦'),
      Q('Where do bees live?', 'in a hive', ['in a pond', 'in a burrow'], 'Bees live together in a hive. They make honey there.', '🐝'),
      Q('What does a spider make to live on and catch food?', 'a web', ['a nest', 'a hive'], 'A spider spins a sticky web to catch insects.', '🕷️'),
      Q('Where does a carabao live and cool off in the mud?', 'on a farm', ['in the sea', 'in a tree'], 'Carabaos live on farms. They wallow in mud to keep cool.', '🐃'),
      Q('Where do ants live?', 'in an anthill', ['in a web', 'in the sea'], 'Ants live together in an anthill, a nest in the ground.', '🐜'),
      Q('Where does a monkey live in the wild?', 'in the forest', ['in the sea', 'in a beehive'], 'Monkeys live in forests and climb the trees.', '🐒'),
      Q('Where does a crab live?', 'on the seashore', ['in a tree', 'in a nest'], 'Many crabs live on the seashore, in the sand and between rocks.', '🦀'),
      Q('Where does a wild rabbit live?', 'in a burrow', ['in a web', 'in the sea'], 'A burrow is a hole that a rabbit digs in the ground.', '🐇'),
      Q('Where does a frog live?', 'near ponds and rivers', ['in a beehive', 'in a bird nest'], 'Frogs live near water. They lay their eggs in it.', '🐸'),
      Q('Where does a farm chicken sleep at night?', 'in a coop', ['in a pond', 'in a web'], 'A coop is a small house that keeps chickens safe at night.', '🐔'),
      Q('Where does a whale live?', 'in the sea', ['in a pond', 'in a forest'], 'Whales are very big. They live in the sea.', '🐋'),
    ],
  },
  babies: {
    hint: 'Many animal babies have their own special names.',
    items: [
      Q('A baby cat is called a…', 'kitten', ['puppy', 'chick'], 'A baby cat is a kitten.', '🐱'),
      Q('A baby dog is called a…', 'puppy', ['kitten', 'calf'], 'A baby dog is a puppy.', '🐶'),
      Q('A baby chicken is called a…', 'chick', ['kitten', 'calf'], 'A baby chicken is a chick. It hatches from an egg.', '🐔'),
      Q('A baby cow is called a…', 'calf', ['lamb', 'foal'], 'A baby cow is a calf.', '🐄'),
      Q('A baby frog is called a…', 'tadpole', ['caterpillar', 'chick'], 'A baby frog is a tadpole. It lives in water and has a tail.', '🐸'),
      Q('A baby duck is called a…', 'duckling', ['puppy', 'kitten'], 'A baby duck is a duckling.', '🦆'),
      Q('A baby sheep is called a…', 'lamb', ['calf', 'chick'], 'A baby sheep is a lamb.', '🐑'),
      Q('A baby horse is called a…', 'foal', ['kitten', 'duckling'], 'A baby horse is a foal.', '🐴'),
      Q('A baby butterfly is called a…', 'caterpillar', ['tadpole', 'chick'], 'A butterfly lays eggs. A caterpillar hatches from each egg.', '🦋'),
      Q('A baby pig is called a…', 'piglet', ['puppy', 'lamb'], 'A baby pig is a piglet.', '🐖'),
      Q('Which baby drinks milk from its mother?', 'a kitten', ['a chick', 'a tadpole'], 'Kittens drink milk from their mother. Chicks and tadpoles do not.'),
      Q('Which baby looks very different from its parent?', 'a tadpole', ['a puppy', 'a kitten'], 'A tadpole has a tail and no legs. It changes a lot to become a frog.'),
    ],
  },
  moves: {
    hint: 'Look at the animal\'s body. Does it have wings, fins or legs?',
    items: [
      Q('How does a fish move?', 'It swims.', ['It flies.', 'It hops.'], 'A fish swims with its fins and tail.', '🐟'),
      Q('How does a bird move in the air?', 'It flies.', ['It swims.', 'It crawls.'], 'A bird flaps its wings to fly.', '🐦'),
      Q('How does a snake move?', 'It slides on its belly.', ['It hops on two legs.', 'It flies with wings.'], 'A snake has no legs. It slides along on its belly.', '🐍'),
      Q('How does a frog move on land?', 'It hops.', ['It flies.', 'It slides on its belly.'], 'A frog has strong back legs for hopping.', '🐸'),
      Q('How does a kangaroo move?', 'It hops.', ['It swims.', 'It slides on its belly.'], 'A kangaroo hops on its big, strong back legs.', '🦘'),
      Q('How does a horse move fast?', 'It runs on four legs.', ['It flies.', 'It swims with fins.'], 'A horse runs fast on its four long legs.', '🐎'),
      Q('Which animal can swim and fly?', 'a duck', ['a cat', 'a snail'], 'A duck swims in water and flies in the air. It can walk too!'),
      Q('How does a snail move?', 'It crawls slowly.', ['It runs fast.', 'It flies.'], 'A snail slowly crawls on its one big foot.', '🐌'),
      Q('Which body parts help a bird fly?', 'wings', ['fins', 'hooves'], 'Birds flap their wings to fly.', '🐦'),
      Q('Which body parts help a fish swim?', 'fins', ['wings', 'legs'], 'Fish use their fins and tail to swim.', '🐟'),
      Q('How does a monkey move from tree to tree?', 'It swings and climbs.', ['It swims.', 'It slides on its belly.'], 'A monkey uses its arms, legs and tail to swing and climb.', '🐒'),
      Q('Which animal hops?', 'a rabbit', ['a snake', 'a fish'], 'A rabbit hops on its strong back legs.'),
    ],
  },
  plantParts1: {
    hint: 'A plant has roots, a stem, leaves, and sometimes flowers, fruits and seeds.',
    items: [
      Q('Which part of a plant holds it in the soil?', 'roots', ['leaves', 'flower'], 'Roots grow down into the soil and hold the plant in place.', '🌱'),
      Q('Which part takes in water from the soil?', 'roots', ['flower', 'fruit'], 'Roots take in water from the soil.'),
      Q('Which part holds the plant up?', 'stem', ['flower', 'seed'], 'The stem holds the plant up so its leaves get sunlight.'),
      Q('Which part of a plant is usually green and makes food?', 'leaves', ['roots', 'seeds'], 'Green leaves use sunlight to make food for the plant.', '🍃'),
      Q('Which part of a plant can grow into a fruit?', 'flower', ['root', 'leaf'], 'After a flower is visited by bees, it can grow into a fruit.', '🌼'),
      Q('What is inside a fruit that can grow into a new plant?', 'seeds', ['roots', 'stems'], 'Seeds are inside the fruit. A seed can grow into a new plant.', '🍉'),
      Q('Which part of a plant is usually under the ground?', 'roots', ['flower', 'fruit'], 'Roots are usually under the ground.'),
      Q('Bees visit this colourful part of a plant.', 'flower', ['root', 'stem'], 'Bees visit flowers to drink nectar.', '🐝'),
      Q('Water goes up the plant through the…', 'stem', ['flower', 'fruit'], 'The stem carries water up from the roots to the leaves.'),
      Q('A mango is the … of a mango tree.', 'fruit', ['root', 'leaf'], 'A mango is a fruit. Its big seed is inside.', '🥭'),
      Q('A tree trunk is a big, strong…', 'stem', ['root', 'leaf'], 'The trunk is the stem of a tree.', '🌳'),
      Q('Which part of a sunflower do birds like to eat?', 'seeds', ['roots', 'stem'], 'Birds love to eat sunflower seeds.', '🌻'),
    ],
  },
  materials1: {
    hint: 'Look at the thing and think: is it wood, metal, plastic, glass, paper, cloth or rubber?',
    items: [
      Q('What is a window pane made of?', 'glass', ['wood', 'cloth'], 'Window panes are made of glass, so we can see through them.', '🪟'),
      Q('What is a T-shirt made of?', 'cloth', ['glass', 'metal'], 'A T-shirt is made of cloth. Cloth is soft and bends.', '👕'),
      Q('What is a bolt made of?', 'metal', ['paper', 'cloth'], 'Bolts are made of metal. Metal is hard and strong.', '🔩'),
      Q('What is a book made of?', 'paper', ['glass', 'metal'], 'The pages of a book are made of paper.', '📕'),
      Q('What is a log made of?', 'wood', ['plastic', 'glass'], 'A log is a piece of a tree. It is wood.', '🪵'),
      Q('What is a balloon made of?', 'rubber', ['wood', 'glass'], 'Balloons are made of rubber. Rubber stretches.', '🎈'),
      Q('What is a key made of?', 'metal', ['cloth', 'paper'], 'Keys are made of metal so they are strong.', '🔑'),
      Q('What is a pencil mostly made of?', 'wood', ['glass', 'metal'], 'A pencil is mostly wood, with a thin stick inside that writes.', '✏️'),
      Q('What is a mirror made of?', 'glass', ['cloth', 'rubber'], 'A mirror is shiny glass.', '🪞'),
      Q('What is a towel made of?', 'cloth', ['glass', 'metal'], 'A towel is made of cloth. It soaks up water.'),
      Q('What is a car tyre made of?', 'rubber', ['glass', 'paper'], 'Tyres are made of rubber. Rubber is strong and grips the road.', '🛞'),
      Q('What is this spoon made of?', 'metal', ['paper', 'cloth'], 'This spoon is made of metal.', '🥄'),
      Q('Which material can you see through?', 'glass', ['wood', 'metal'], 'You can see through clear glass.'),
      Q('Which material is soft and can be folded?', 'cloth', ['glass', 'metal'], 'Cloth is soft. You can fold it.'),
    ],
  },
  sky1: {
    hint: 'In the day we see the Sun. At night we often see the Moon and stars.',
    items: [
      Q('What gives us light in the daytime?', 'the Sun', ['the Moon', 'the stars'], 'The Sun gives us light in the day.', '☀️'),
      Q('What can we often see in the night sky?', 'the Moon and stars', ['the Sun', 'a rainbow'], 'At night we can often see the Moon and stars.', '🌙'),
      Q('When is it dark outside?', 'at night', ['at noon', 'in the morning'], 'It is dark at night because the Sun is not in our sky.'),
      Q('When do most people sleep?', 'at night', ['at noon', 'in the morning'], 'Most people sleep at night, when it is dark.', '😴'),
      Q('The Sun gives us light and…', 'heat', ['rain', 'snow'], 'The Sun warms the land, the sea and us.'),
      Q('Where does the Sun rise?', 'in the east', ['in the west', 'in the north'], 'The Sun rises in the east and sets in the west.', '🌅'),
      Q('Why should you never look straight at the Sun?', 'It can hurt your eyes.', ['It turns the sky dark.', 'It makes the Sun go away.'], 'The Sun is so bright that it can hurt your eyes.'),
      Q('Which animal is awake at night?', 'an owl', ['a butterfly', 'a chicken'], 'Owls sleep in the day and hunt at night.', '🦉'),
      Q('What can we see in the sky when the Sun shines just after rain?', 'a rainbow', ['a full Moon', 'many stars'], 'Sunlight shining through raindrops makes a rainbow.', '🌈'),
      Q('You stand in the sunlight. What do you see on the ground?', 'your shadow', ['a rainbow', 'a puddle'], 'Your body blocks the sunlight. That makes your shadow.'),
      Q('When the Sun goes down in the evening, it is called…', 'sunset', ['sunrise', 'noon'], 'The Sun sets in the evening. That is sunset.'),
      Q('In the morning, the Sun comes up. This is called…', 'sunrise', ['sunset', 'midnight'], 'The Sun rises in the morning. That is sunrise.'),
    ],
  },
  weather1: {
    hint: 'Weather is what the air outside is like: sunny, rainy, windy, cloudy or stormy.',
    items: [
      Q('It is raining. What should you bring?', 'an umbrella', ['sunglasses', 'a fan'], 'An umbrella keeps you dry in the rain.', '🌧️'),
      Q('It is very hot and sunny. What should you wear?', 'a hat', ['a raincoat', 'a thick jacket'], 'A hat shades your face from the hot Sun.', '☀️'),
      Q('The kites fly high and the trees sway. What is the weather?', 'windy', ['still and calm', 'foggy'], 'Moving air is wind. Wind makes kites fly and trees sway.', '🪁'),
      Q('Dark clouds and lightning mean a … is coming.', 'storm', ['rainbow', 'sunny day'], 'Dark clouds, thunder and lightning come with a storm.', '⛈️'),
      Q('What falls from clouds on a rainy day?', 'raindrops', ['leaves', 'sand'], 'Raindrops fall from rain clouds.'),
      Q('A very strong storm with strong winds and heavy rain is a…', 'typhoon', ['rainbow', 'breeze'], 'Typhoons bring strong winds and heavy rain to the Philippines.', '🌀'),
      Q('What should you do when there is lightning?', 'Stay indoors.', ['Swim in the sea.', 'Stand under a tall tree.'], 'Lightning can strike tall things and water. Stay inside a building.'),
      Q('The Sun is out and the puddles dry up. What is the weather?', 'sunny', ['rainy', 'stormy'], 'On a sunny day, the Sun dries up the puddles.'),
      Q('What do you see in the sky on a cloudy day?', 'many clouds', ['a clear blue sky', 'many stars'], 'On a cloudy day, clouds cover much of the sky.', '☁️'),
      Q('Which clothes keep you dry in the rain?', 'a raincoat and boots', ['shorts and slippers', 'a swimsuit'], 'A raincoat and boots keep the rain off you.'),
      Q('On a hot day, what is the best drink?', 'water', ['a soft drink', 'a sweet iced tea'], 'Water is best. It keeps your body cool on hot days.'),
      Q('Which word tells about the weather?', 'sunny', ['happy', 'tall'], 'Sunny tells what the weather is like.'),
    ],
  },
  healthy1: {
    hint: 'Healthy habits: wash your hands, brush your teeth, eat go, grow and glow foods, play and sleep well.',
    items: [
      Q('When should you wash your hands?', 'before eating', ['only when they look dirty', 'never'], 'Germs are too small to see, so wash your hands before eating, even if they look clean.', '🧼'),
      Q('How often should you brush your teeth?', 'at least twice a day', ['once a week', 'only on your birthday'], 'Brush your teeth in the morning and before bed.', '🪥'),
      Q('Which snack is healthier?', 'a banana', ['a bag of chips', 'candy'], 'Fruits like bananas are healthy snacks.', '🍌'),
      Q('Which drink is best for your body?', 'water', ['a soft drink', 'a sweet iced tea'], 'Water is the best drink. Sweet drinks have too much sugar.', '💧'),
      Q('How many hours should a child sleep each night?', 'about 9 to 12 hours', ['about 2 hours', 'about 4 hours'], 'Children need about 9 to 12 hours of sleep to grow and stay well.', '😴'),
      Q('Why do we cover our mouth when we cough?', 'to stop germs from spreading', ['to make the cough louder', 'to keep our mouth warm'], 'Covering a cough stops germs from reaching other people.'),
      Q('Which helps keep your body strong?', 'playing and running', ['watching TV all day', 'skipping meals'], 'Playing and running make your muscles, heart and bones strong.', '⚽'),
      Q('Fish, eggs and meat help you grow. They are … foods.', 'grow', ['go', 'glow'], 'Grow foods, like fish, eggs and meat, help your body grow.', '🐟'),
      Q('Rice and bread give you energy. They are … foods.', 'go', ['grow', 'glow'], 'Go foods, like rice and bread, give you energy to move and play.', '🍚'),
      Q('Fruits and vegetables keep you healthy. They are … foods.', 'glow', ['go', 'grow'], 'Glow foods, like fruits and vegetables, keep your skin, eyes and body healthy.', '🥕'),
      Q('You scraped your knee. What should you do first?', 'Wash it with clean water and tell an adult.', ['Put soil on it.', 'Hide it and tell no one.'], 'Clean the cut with water and tell an adult so they can help.'),
    ],
  },
};

const G1_SORTS = {
  living: {
    ask: 'Is it living or non-living?',
    hint: 'A living thing grows, needs food, water and air, and makes young like itself.',
    groups: {
      living: group('living', 'a living thing', 'it grows, needs food, water and air, and makes young like itself', [
        it('dog', '🐶'), it('tree', '🌳'), it('flower', '🌸'), it('fish', '🐟'), it('bird', '🐦'), it('butterfly', '🦋'),
        it('mushroom', '🍄', 'A mushroom is living. It grows and makes more mushrooms.'), it('carabao', '🐃'), it('baby', '👶'),
        it('ant', '🐜'), it('frog', '🐸'), it('cactus', '🌵'), it('potted plant', '🪴'),
      ]),
      nonliving: group('non-living', 'a non-living thing', 'it does not grow, eat, breathe or make young', [
        it('rock', '🪨'), it('chair', '🪑'), it('ball', '⚽'), it('car', '🚗', 'A car moves, but it does not grow, eat or breathe. It is non-living.'),
        it('book', '📕'), it('phone', '📱'), it('shoe', '👟'), it('pencil', '✏️'),
        it('robot', '🤖', 'A robot can move and make sounds, but it does not grow, eat or breathe. It is non-living.'),
        it('kite', '🪁'), it('clock', '⏰', 'A clock ticks and its hands move, but it does not grow, eat or breathe. It is non-living.'),
        it('cloud', '☁️', 'A cloud moves and changes shape, but it is not alive. It is non-living.'),
        it('fire', '🔥', 'Fire grows and needs air, but it does not eat food or make young. It is non-living.'),
      ]),
    },
  },
  plantPartsEaten: {
    ask: 'Which part of the plant do we eat?',
    hint: 'Roots grow under the ground, stems hold the plant up, leaves are thin and flat, flowers come before fruits, and seeds can grow into new plants.',
    groups: {
      root: group('root', 'a root we eat', 'it grows under the ground and stores food for the plant', [
        it('carrot', '🥕'), it('sweet potato (kamote)', '🍠'), it('radish (labanos)', undefined), m('cassava', undefined),
      ]),
      stem: group('stem', 'a stem we eat', 'it is the part that holds the plant up', [
        m('sugarcane', undefined, 'Sugarcane is a tall, sweet stem.'), m('asparagus', undefined), it('bamboo shoot', '🎍', 'A bamboo shoot is a young bamboo stem.'),
      ]),
      leaf: group('leaf', 'a leaf we eat', 'it is the thin, green part of the plant', [
        m('pechay', '🥬'), m('cabbage', undefined), m('lettuce', '🥗'), it('malunggay leaves', '🌿', 'Malunggay leaves are leaves we eat: they are the thin, green parts of the plant.'), m('spinach', undefined),
      ]),
      flower: group('flower', 'a flower we eat', 'it is the flower of the plant, picked before it opens fully', [
        m('broccoli', '🥦', 'Broccoli is made of many tiny flower buds, picked before they open.'), m('cauliflower', undefined, 'Cauliflower is made of many tiny flower buds, picked before they open.'), it('banana heart (puso ng saging)', undefined, 'The banana heart is the big purple flower of the banana plant.'),
      ]),
      fruit: group('fruit', 'a fruit we eat', 'it grows from a flower and has seeds inside', [
        it('mango', '🥭'), it('banana', '🍌', 'A banana grows from the banana flower, so it is a fruit. Its tiny black dots are seeds that cannot grow.'), it('tomato', '🍅', 'A tomato grows from a flower and has seeds inside, so it is a fruit.'),
        it('eggplant', '🍆', 'An eggplant grows from a flower and has seeds inside, so it is a fruit.'), it('cucumber', '🥒', 'A cucumber has seeds inside, so it is a fruit.'), it('papaya', undefined),
      ]),
      seed: group('seed', 'a seed we eat', 'it can grow into a new plant', [
        it('peanut', '🥜'), it('mung beans (monggo)', undefined, 'Mung beans (monggo) are seeds we eat: each one can grow into a new plant.'), it('green peas', '🫛', 'Green peas are seeds we eat: each one can grow into a new plant.'), it('pili nut', undefined),
      ]),
    },
  },
  float: {
    ask: 'Will it float or sink in water?',
    hint: 'Light things like wood, leaves and things full of air float. Heavy things like stones and metal sink.',
    groups: {
      floats: group('floats', 'something that floats', 'it stays on top of the water', [
        it('a leaf', '🍃'), it('a rubber duck', '🦆'), it('a piece of wood', '🪵'), it('a feather', '🪶'),
        it('an empty plastic bottle with its cap on', '🧴', 'The bottle is full of air, so it floats.'), it('a coconut', '🥥', 'A coconut floats. That is how coconuts travel across the sea!'),
        it('a beach ball', undefined), it('a dry sponge', '🧽'),
      ], { pick: 'Which one floats?', is: 'floats' }),
      sinks: group('sinks', 'something that sinks', 'it goes down to the bottom', [
        it('a stone', '🪨'), it('a coin', '🪙'), it('a key', '🔑'), it('a metal spoon', '🥄'), it('a metal bolt', '🔩'), it('a pair of scissors', '✂️'),
      ], { pick: 'Which one sinks?', is: 'sinks' }),
    },
  },
  sound: {
    ask: 'Is the sound loud or soft?',
    hint: 'A loud sound is easy to hear from far away. A soft sound is quiet; you must listen closely.',
    groups: {
      loud: group('loud', 'a loud sound', 'it is easy to hear, even from far away', [
        m('thunder', '⛈️'), it('a drum being banged', '🥁'), it('a fire truck siren', '🚒'), it('a jet plane', '✈️'), it('fireworks', '🎆', 'Fireworks make a loud sound: you can hear them from far away.'), it('a lion roaring', '🦁'),
      ], { pick: 'Which one makes a loud sound?', is: 'makes a loud sound' }),
      soft: group('soft', 'a soft sound', 'it is quiet; you must listen closely to hear it', [
        it('a whisper', '🤫'), it('a ticking watch', '⌚'), it('a leaf falling', '🍂'), it('a cat purring', '🐈'), it('a feather landing', '🪶'),
      ], { pick: 'Which one makes a soft sound?', is: 'makes a soft sound' }),
    },
  },
};

/* ------------------------------------------------------------------ */
/* Grade 2                                                             */
/* ------------------------------------------------------------------ */

const G2 = {
  coverings: {
    hint: 'Mammals have fur or hair, birds have feathers, fish and reptiles have scales, and frogs have smooth, wet skin.',
    items: [
      Q("What covers a cat's body?", 'fur', ['feathers', 'scales'], 'A cat has soft fur. Fur keeps it warm.', '🐱'),
      Q("What covers a bird's body?", 'feathers', ['fur', 'scales'], 'Birds are the only animals with feathers.', '🐦'),
      Q("What covers a fish's body?", 'scales', ['feathers', 'fur'], 'Most fish are covered in smooth, wet scales.', '🐟'),
      Q("What covers a snake's body?", 'dry scales', ['fur', 'feathers'], 'A snake has dry scales.', '🐍'),
      Q('What covers the back of a turtle?', 'a hard shell', ['feathers', 'fur'], 'A turtle has a hard shell that protects it.', '🐢'),
      Q("What covers a frog's body?", 'smooth, wet skin', ['feathers', 'fur'], 'A frog has smooth, wet skin. It has no scales, fur or feathers.', '🐸'),
      Q("What covers a dog's body?", 'fur', ['scales', 'a shell'], 'A dog has fur.', '🐶'),
      Q("What covers a chicken's body?", 'feathers', ['fur', 'scales'], 'A chicken is a bird, so it has feathers.', '🐔'),
      Q("What covers a crocodile's body?", 'hard scales', ['feathers', 'fur'], 'A crocodile has thick, hard scales.', '🐊'),
      Q('What protects a snail?', 'a shell', ['feathers', 'fur'], 'A snail can hide inside its shell.', '🐌'),
      Q('Which animal has feathers?', 'a duck', ['a goat', 'a lizard'], 'A duck is a bird, so it has feathers.'),
      Q('Which animal has fur?', 'a rabbit', ['a parrot', 'a fish'], 'A rabbit has soft fur.'),
      Q('Thick fur helps an animal keep…', 'warm', ['wet', 'slow'], 'Fur traps warm air close to the body.'),
    ],
  },
  plantNeeds: {
    hint: 'Plants need sunlight, water, air and space to grow.',
    items: [
      Q('What does a plant need to make food?', 'sunlight, water and air', ['soil only', 'darkness and water'], 'Leaves use sunlight, water and air to make food.'),
      Q('A plant by a window bends toward the window. Why?', 'It grows toward the light.', ['It is looking for water.', 'The wind pushes it.'], 'Plants grow toward light because they need it to make food.', '🪴'),
      Q('One plant gets water every day. The same kind of plant gets none. After a week, which looks healthy?', 'the plant that got water', ['the plant with no water', 'both look the same'], 'Plants need water. The plant with no water dries up.'),
      Q('Why should plants not be planted too close together?', 'They need space to grow.', ['They grow faster when crowded.', 'Plants do not need space.'], 'Crowded plants fight for light, water and space.'),
      Q('What do roots take in from the soil?', 'water', ['sunlight', 'sugar'], 'Roots take in water from the soil.'),
      Q('What happens to a plant left in a dark cupboard?', 'It turns yellow and weak.', ['It grows fruit.', 'It turns dark green.'], 'Without light, a plant cannot make food. It turns yellow and weak.'),
      Q('Which plant will grow best?', 'one with sunlight, water and space', ['one in a closed box with no light', 'one that is never watered'], 'A plant grows best when it gets all it needs.'),
      Q('Plants make their food in their…', 'leaves', ['roots', 'flowers'], 'The green leaves make food for the plant.', '🍃'),
      Q('Too much water can make roots rot. So a plant needs…', 'just enough water', ['no water at all', 'water once a year'], 'Plants need water, but not too much.'),
      Q('What do seeds need to start growing?', 'water, air and warmth', ['salt and sugar', 'ice'], 'Seeds start to grow when they get water, air and warmth.', '🌰'),
    ],
  },
  plantUses: {
    hint: 'Many things we use every day come from plants: food, wood, cloth, paper, rope and medicine.',
    items: [
      Q('Cotton cloth comes from…', 'a plant', ['an animal', 'a rock'], 'Cotton grows on the cotton plant as soft, fluffy fibres.'),
      Q('Paper is made from…', 'wood from trees', ['rocks', 'plastic'], 'Paper is made from wood.', '📄'),
      Q('Abaca, a plant grown in the Philippines, is used to make…', 'strong rope', ['glass', 'metal pots'], 'Abaca fibres are very strong. They are made into rope and cloth.'),
      Q('Coconut oil comes from…', 'the coconut fruit', ['the coconut roots', 'sea water'], 'Coconut oil is pressed from the white meat of the coconut.', '🥥'),
      Q('Which food comes from a plant?', 'rice', ['eggs', 'fish'], 'Rice is the seed of the rice plant.', '🍚'),
      Q('Lagundi leaves are used to make…', 'medicine for coughs', ['paint', 'glue'], 'Lagundi is a plant used to make cough medicine.'),
      Q('Tables and chairs are often made of…', 'wood', ['glass', 'sand'], 'Wood from trees is used to make furniture.', '🪑'),
      Q('Trees give off … that we breathe.', 'oxygen', ['smoke', 'dust'], 'Plants give off oxygen. We need oxygen to breathe.', '🌳'),
      Q('Bamboo is used to build…', 'a bahay kubo', ['cars', 'phones'], 'A bahay kubo is a house made of bamboo and nipa.', '🎍'),
      Q('Which comes from a plant?', 'sugar from sugarcane', ['milk from a cow', 'wool from a sheep'], 'Sugar is made from the sweet juice of sugarcane stems.'),
      Q('Big trees give us … on hot days.', 'shade', ['snow', 'light'], 'Trees block the sunlight and give us cool shade.'),
    ],
  },
  properties2: {
    hint: 'Think about how it feels and what it can do: hard or soft, rough or smooth, bendy, waterproof or see-through.',
    items: [
      Q('Which word tells how a rock feels?', 'hard', ['soft', 'bendy'], 'A rock is hard. It does not squash.', '🪨'),
      Q('A pillow feels…', 'soft', ['hard', 'sharp'], 'A pillow is soft. It squashes when you press it.'),
      Q('Sandpaper feels…', 'rough', ['smooth', 'wet'], 'Sandpaper is rough and bumpy.'),
      Q('A clear glass window is…', 'see-through', ['rough', 'bendy'], 'You can see through clear glass.', '🪟'),
      Q('A raincoat must be…', 'waterproof', ['soft as a pillow', 'made of paper'], 'Waterproof means it does not let water through.'),
      Q('Which can bend without breaking?', 'a rubber band', ['a glass cup', 'a dry cookie'], 'Rubber bends and stretches without breaking.'),
      Q('Which is smooth?', 'a mirror', ['tree bark', 'sandpaper'], 'A mirror is flat and smooth.', '🪞'),
      Q('Why are cooking pots made of metal?', 'Metal is strong and gets hot quickly.', ['Metal is soft and bendy.', 'Metal is see-through.'], 'Metal is strong and lets heat through quickly to cook the food.', '🍲'),
      Q('Why is a window made of glass?', 'Glass lets light through.', ['Glass is soft.', 'Glass soaks up water.'], 'Glass is see-through, so light comes into the room.'),
      Q('Which soaks up water?', 'a cotton towel', ['a plastic bag', 'a metal spoon'], 'Cloth like cotton soaks up water.'),
      Q('Which is waterproof?', 'a plastic bag', ['a paper bag', 'a cotton shirt'], 'Plastic does not let water through.'),
      Q('Why is a ball made of rubber?', 'Rubber is bouncy.', ['Rubber is see-through.', 'Rubber breaks easily.'], 'Rubber bounces back, so the ball bounces.', '🏀'),
    ],
  },
  magnets2: {
    hint: 'Magnets attract (pull) things made of iron or steel. They do not attract wood, plastic, glass, paper or rubber.',
    items: [
      Q('A magnet can pull things made of…', 'iron', ['wood', 'plastic'], 'Magnets attract iron and steel.', '🧲'),
      Q('Which will a magnet pick up?', 'a steel paper clip', ['a rubber band', 'a wooden pencil'], 'The paper clip is made of steel, so the magnet attracts it.'),
      Q('Which will a magnet NOT pick up?', 'a plastic spoon', ['an iron nail', 'a steel pin'], 'Magnets do not attract plastic.'),
      Q('Can a magnet pull a paper clip through a sheet of paper?', 'Yes, it can.', ['No, it cannot.'], 'Magnets can pull through thin paper, cloth and even water.'),
      Q('The two ends of a bar magnet are called…', 'poles', ['corners', 'sides'], 'A bar magnet has a north pole and a south pole at its ends.'),
      Q('Where is a bar magnet strongest?', 'at its ends', ['in the middle', 'the same everywhere'], 'A magnet is strongest at its poles, at the ends.'),
      Q('How do we use magnets at home?', 'to stick notes on the fridge', ['to cook rice', 'to cut paper'], 'Fridge magnets hold notes on the steel door.'),
      Q('Can a magnet pull a nail without touching it?', 'Yes, if it is close enough.', ['No, never.', 'Only under water.'], 'A magnet pulls iron from a short distance away.'),
      Q('Which is attracted to a magnet?', 'a steel safety pin', ['an aluminium can', 'a glass marble'], 'Steel is attracted. Aluminium is a metal, but magnets do not attract it.'),
      Q('Ben mixed iron filings with sand. How can he get the iron out?', 'Use a magnet.', ['Add water.', 'Shake it.'], 'The magnet pulls the iron filings out and leaves the sand.'),
    ],
  },
  weather2: {
    hint: 'The Philippines has a wet season and a dry season. Tools like thermometers and rain gauges help us measure the weather.',
    items: [
      Q('The Philippines has two main seasons. They are…', 'the wet season and the dry season', ['spring and autumn', 'the snow season and the ice season'], 'In the Philippines we have a wet (rainy) season and a dry season.'),
      Q('When is the wet season in the Philippines?', 'about June to November', ['about January to March', 'all year round'], 'Most rain falls from about June to November.', '🌧️'),
      Q('Which tool measures how hot or cold the air is?', 'a thermometer', ['a ruler', 'a weighing scale'], 'A thermometer measures temperature.', '🌡️'),
      Q('PAGASA raises Wind Signal No. 3. What is coming?', 'a storm with very strong winds', ['a sunny day', 'a rainbow'], 'Wind signals warn us about strong winds. The higher the number, the stronger the wind.', '🌀'),
      Q('What should a family get ready before a typhoon?', 'food, water, a flashlight and a radio', ['a kite to fly', 'beach toys'], 'Typhoons can cut off power and roads. Prepare food, water, a flashlight and a radio.'),
      Q('Which clouds usually bring rain?', 'dark grey clouds', ['thin white clouds', 'no clouds'], 'Thick, dark grey clouds are full of water. They often bring rain.', '☁️'),
      Q('A wind vane shows…', 'which way the wind blows', ['how hot it is', 'how much rain fell'], 'A wind vane turns to point into the wind.'),
      Q('Rain is water that falls from…', 'clouds', ['the Sun', 'trees'], 'Clouds are made of tiny water drops. When they get big, they fall as rain.'),
      Q('Which is usually the hottest part of a sunny day?', 'around noon to early afternoon', ['early morning', 'midnight'], 'The Sun is highest around noon, and the ground and air keep warming into the early afternoon.'),
      Q('A day with no wind, rain or clouds is…', 'sunny and clear', ['stormy', 'foggy'], 'With no clouds, the sky is clear and sunny.'),
      Q('What does a rain gauge measure?', 'how much rain has fallen', ['how strong the wind is', 'how hot the day is'], 'A rain gauge collects rain so we can measure how much fell.'),
    ],
  },
  sky2: {
    hint: 'The Sun is a star. The Moon reflects sunlight. The Earth spins once a day, which gives us day and night.',
    items: [
      Q('The Sun is a…', 'star', ['planet', 'moon'], 'The Sun is a star, the one closest to us.', '☀️'),
      Q('Why does the Sun look small?', 'It is very far away.', ['It is tiny.', 'It is behind the clouds.'], 'The Sun is huge, but it is very far away.'),
      Q('The Moon shines because…', 'it reflects light from the Sun', ['it makes its own light', 'it is on fire'], 'The Moon has no light of its own. It reflects sunlight.', '🌙'),
      Q('Why do we have day and night?', 'The Earth spins.', ['The Sun turns off at night.', 'The Moon covers the Sun every night.'], 'As the Earth spins, our side faces the Sun (day), then faces away (night).', '🌍'),
      Q('How long does the Earth take to spin around once?', 'about 24 hours', ['one week', 'one year'], 'The Earth spins once in about 24 hours: one day and one night.'),
      Q('The shapes of the Moon that we see during a month are called…', 'phases', ['seasons', 'colours'], 'The Moon seems to change shape. These shapes are its phases.'),
      Q('Which is closest to the Earth?', 'the Moon', ['the Sun', 'the stars'], 'The Moon is much closer to us than the Sun or the stars.'),
      Q('Why are stars hard to see in the daytime?', 'The Sun is too bright.', ['They go away in the day.', 'They are asleep.'], 'Stars are still there in the day. The bright sunlight hides them.', '✨'),
      Q('The Sun rises in the … and sets in the west.', 'east', ['north', 'south'], 'The Sun rises in the east and sets in the west.', '🌅'),
      Q('What gives the Earth light and heat?', 'the Sun', ['the Moon', 'clouds'], 'The Sun gives us light and heat.'),
      Q('A group of stars that makes a picture in the sky is a…', 'constellation', ['planet', 'comet'], 'People join stars into pictures called constellations.'),
    ],
  },
  shadows2: {
    hint: 'A shadow forms when something blocks light. Light passes through clear things, so they make little or no shadow.',
    items: [
      Q('A shadow forms when an object…', 'blocks light', ['gives off light', 'is very wet'], 'When light is blocked, a dark shadow forms behind the object.'),
      Q('When is your shadow longest?', 'early morning or late afternoon', ['at noon', 'when it rains'], 'When the Sun is low in the sky, shadows are long.'),
      Q('When is your shadow shortest?', 'around noon', ['early morning', 'late afternoon'], 'At noon the Sun is high above, so shadows are short.'),
      Q('Does clear glass make a dark shadow?', 'No, light passes through it.', ['Yes, a very dark one.', 'Only at night.'], 'Light passes through clear glass, so it makes almost no shadow.'),
      Q('The light is on your left. Where is your shadow?', 'on your right', ['on your left', 'on top of the light'], 'A shadow is on the side away from the light.'),
      Q('To make a bigger hand shadow on the wall, move your hand…', 'closer to the torch', ['farther from the torch', 'behind your back'], 'The closer your hand is to the light, the more light it blocks, so the shadow grows.', '🔦'),
      Q('Which makes a dark shadow?', 'a wooden block', ['a clear plastic sheet', 'clean window glass'], 'Wood blocks all the light, so its shadow is dark.'),
      Q('A shadow has the same … as the object.', 'outline', ['colour', 'smell'], 'A shadow has the same outline, but it is dark and has no colour.'),
      Q('On a cloudy day, shadows are…', 'faint or missing', ['very sharp and dark', 'colourful'], 'Clouds spread out the sunlight, so shadows are faint.'),
      Q('Can you see your shadow in a dark room with no light?', 'No. A shadow needs light.', ['Yes, it is darker.', 'Yes, but it is coloured.'], 'A shadow is made where light is blocked. With no light, there is no shadow.'),
      Q('Which of these gives out its own light?', 'a torch', ['a mirror', 'the Moon'], 'A torch makes light. A mirror and the Moon only reflect light.', '🔦'),
      Q('You walk toward a street lamp at night. Your shadow is…', 'behind you', ['in front of you', 'on top of the lamp'], 'The lamp is in front of you, so your shadow falls behind you.'),
    ],
  },
};

const ANIMAL_GROUPS = {
  mammal: group('mammal', 'a mammal', 'it has hair or fur and feeds its young on milk', [
    it('dog', '🐶'), it('cat', '🐱'), it('carabao', '🐃'), it('cow', '🐄'), it('pig', '🐖'), it('monkey', '🐒'), it('goat', '🐐'), it('horse', '🐴'),
    it('whale', '🐋', 'A whale lives in the sea, but it breathes air with lungs and feeds its young on milk. It is a mammal.'),
    it('bat', '🦇', 'A bat can fly, but it has fur and feeds its young on milk. It is a mammal.'),
    it('dolphin', '🐬', 'A dolphin breathes air and feeds its young on milk. It is a mammal, not a fish.'),
  ]),
  bird: group('bird', 'a bird', 'it has feathers, wings and a beak, and lays eggs with hard shells', [
    it('chicken', '🐔'), it('eagle', '🦅'), it('duck', '🦆'), it('owl', '🦉'), it('parrot', '🦜'),
    it('penguin', '🐧', 'A penguin cannot fly, but it has feathers, wings and a beak. It is a bird.'),
  ]),
  fish: group('fish', 'a fish', 'it lives in water, breathes with gills and has fins; most fish have scales', [
    it('milkfish (bangus)', '🐟'), it('tilapia', '🐟'), it('clownfish', '🐠'), it('galunggong', '🐟'), it('tuna', '🐟'),
    it('shark', '🦈', 'A shark breathes with gills and has fins. It is a fish.'),
  ]),
  reptile: group('reptile', 'a reptile', 'it has dry, scaly skin and most lay eggs on land', [
    it('snake', '🐍'), it('crocodile', '🐊'), it('lizard (tuko)', '🦎'), it('turtle', '🐢'),
  ]),
  amphibian: group('amphibian', 'an amphibian', 'its young (tadpoles) live in water, and the adults breathe air and can live on land; its skin has no scales, fur or feathers', [
    it('frog', '🐸'), it('toad', '🐸', 'A toad is an amphibian. Its tadpoles live in water, and the adult lives on land. Its skin is dry and bumpy, with no scales.'), it('bullfrog', '🐸'), it('tree frog', '🐸'),
  ]),
  insect: group('insect', 'an insect', 'it has six legs and three body parts', [
    it('ant', '🐜'), it('bee', '🐝'), it('butterfly', '🦋'), it('mosquito', '🦟'), it('beetle', '🪲'), it('ladybug', '🐞'), it('cockroach', '🪳'), it('cricket', '🦗'),
  ]),
};

const G2_SORTS = {
  animals: {
    ask: 'Which animal group does it belong to?',
    hint: 'Mammals have fur and feed their young milk. Birds have feathers. Fish have gills and fins. Reptiles have dry scales. Amphibians have wet skin. Insects have six legs.',
    groups: ANIMAL_GROUPS,
  },
  diet: {
    ask: 'What does it eat?',
    hint: 'Plant-eaters eat only plants. Meat-eaters eat other animals. Some animals eat both.',
    groups: {
      plants: group('only plants', 'a plant-eater', 'grass, leaves and other plant parts are its food', [
        it('cow', '🐄'), it('goat', '🐐'), it('carabao', '🐃'), it('rabbit', '🐇'), it('caterpillar', '🐛'), it('horse', '🐴'), it('deer', '🦌'),
      ], { pick: 'Which one eats only plants?', is: 'eats only plants' }),
      meat: group('only animals', 'a meat-eater', 'it hunts or catches other animals for food', [
        it('lion', '🦁'), it('tiger', '🐅'), it('eagle', '🦅'), it('shark', '🦈'), it('snake', '🐍'), it('crocodile', '🐊'),
        it('frog', '🐸', 'A frog eats insects and worms, which are animals.'), it('spider', '🕷️', 'A spider eats insects caught in its web.'),
      ], { pick: 'Which one eats only animals?', is: 'eats only animals' }),
      both: group('plants and animals', 'an animal that eats both plants and animals', 'it eats plant food and also small animals or eggs', [
        it('chicken', '🐔', 'A chicken eats grains and also worms and insects.'), it('pig', '🐖'), it('bear', '🐻'),
        it('monkey', '🐒', 'A monkey eats fruits and leaves, and also insects and eggs.'),
      ], { pick: 'Which one eats both plants and animals?', is: 'eats both plants and animals' }),
    },
  },
  states: {
    ask: 'Is it a solid, a liquid or a gas?',
    hint: 'A solid keeps its own shape. A liquid flows and takes the shape of its container. A gas spreads out to fill any space.',
    groups: {
      solid: group('solid', 'a solid', 'it keeps its own shape', [
        it('a rock', '🪨'), it('an ice cube', '🧊'), it('a book', '📕'), it('a spoon', '🥄'), it('a brick', '🧱'), it('a coin', '🪙'), it('an apple', '🍎'),
      ]),
      liquid: group('liquid', 'a liquid', 'it flows and takes the shape of its container', [
        m('water', '💧'), m('milk', '🥛'), m('juice', '🧃'), m('cooking oil', '🫗'), it('honey', '🍯', 'Honey flows slowly, but it does flow and takes the shape of its jar. It is a liquid.'), m('vinegar', undefined), m('soy sauce', undefined),
      ]),
      gas: group('gas', 'a gas', 'it spreads out to fill any space', [
        it('the air in a balloon', '🎈'), it('the air around us', '💨'), it('the bubbles in soda', '🫧', 'The bubbles in soda are a gas: it spreads out to fill any space.'), it('the air in a bicycle tyre', '🚲'),
      ]),
    },
  },
  pushPull: {
    ask: 'Is it a push or a pull?',
    hint: 'A push moves something away from you. A pull moves something toward you.',
    groups: {
      push: group('push', 'a push', 'it moves something away from you', [
        m('kicking a ball', '⚽'), m('pushing a shopping cart', '🛒'), m('pressing a doorbell', '🔔'), m('closing a drawer', undefined), m('pushing a friend on a swing', undefined), m('pressing a key on a keyboard', '⌨️'),
      ]),
      pull: group('pull', 'a pull', 'it moves something toward you', [
        m('opening a drawer', undefined), m('pulling a wagon', undefined), m('pulling a rope in tug-of-war', '🪢'), m('pulling out a weed', '🌱'), m('pulling up your socks', '🧦'), m('opening a fridge door', undefined),
      ]),
    },
  },
};

/* ------------------------------------------------------------------ */
/* Grade 3                                                             */
/* ------------------------------------------------------------------ */

const G3 = {
  lifeProcesses: {
    hint: 'All living things need food, water and air, grow, respond to changes around them, and reproduce (make young).',
    items: [
      Q('Which of these do ALL living things do?', 'grow', ['walk', 'talk'], 'All living things grow. Not all of them walk or talk; plants do not.'),
      Q('Living things make more of their own kind. This is called…', 'reproduction', ['digestion', 'evaporation'], 'Reproduction is making young: seeds, eggs or babies.'),
      Q('A plant grows toward light. This shows that living things…', 'respond to changes around them', ['are made of metal', 'stay the same forever'], 'Living things respond to changes, such as light, heat and touch.'),
      Q('A car moves and uses fuel. Why is it not a living thing?', 'It cannot grow or reproduce.', ['It is too big.', 'It has wheels.'], 'Living things grow and reproduce. A car can do neither.', '🚗'),
      Q('Which is a living thing?', 'mould on bread', ['a stone', 'a raindrop'], 'Mould is a fungus. It grows and makes spores, so it is alive.'),
      Q('All living things need … to stay alive.', 'food, water and air', ['money and toys', 'soil and sand'], 'Every living thing needs food, water and air.'),
      Q('The leaves of a makahiya plant fold up when touched. This shows that it…', 'responds to touch', ['is not a plant', 'has no leaves'], 'Makahiya responds to touch. Responding to changes is a sign of life.', '🌿'),
      Q('Which shows that a kitten is living?', 'It grows into a cat.', ['It is soft.', 'It is brown.'], 'Growing is a sign of life.'),
      Q('Which non-living thing was once part of a living thing?', 'a wooden table', ['a rock', 'a glass window'], 'Wood comes from trees, which were alive.'),
      Q('A dry seed can stay alive for years. What does it need to start growing?', 'water, air and warmth', ['a magnet', 'salt'], 'A seed starts to grow (germinates) when it gets water, air and warmth.', '🌰'),
      Q('Why do animals move from place to place?', 'to find food, water and shelter', ['to grow leaves', 'to make sunlight'], 'Animals move to find what they need and to escape danger.'),
    ],
  },
  fungi: {
    hint: 'Fungi (like mushrooms, mould and yeast) and bacteria are living things. They cannot make their own food.',
    items: [
      Q('A mushroom is a…', 'fungus', ['plant', 'animal'], 'A mushroom is a fungus. It is not a plant.', '🍄'),
      Q('Why is a mushroom not a plant?', 'It cannot make its own food.', ['It is not alive.', 'It has no colour.'], 'Plants make food from sunlight. Fungi have no chlorophyll and cannot.'),
      Q('Mould grows quickly on bread that is…', 'warm and damp', ['cold and dry', 'in the freezer'], 'Fungi grow best in warm, damp places.', '🍞'),
      Q('How do fungi get their food?', 'from the dead or living things they grow on', ['from sunlight', 'from the air only'], 'Fungi break down the things they grow on and take in the food.'),
      Q('Fungi reproduce by making…', 'spores', ['seeds', 'eggs'], 'Fungi make tiny spores that float in the air.'),
      Q('Yeast, a kind of fungus, is used to make…', 'pandesal and other bread', ['glass', 'metal'], 'Yeast makes gas bubbles that help bread dough rise.'),
      Q('Bacteria are so small that we need … to see them.', 'a microscope', ['a ruler', 'sunglasses'], 'Bacteria are too small to see with our eyes alone.', '🔬'),
      Q('Which shows that some bacteria are helpful?', 'They help make yogurt.', ['They cause tooth decay.', 'They make food spoil.'], 'Some bacteria turn milk into yogurt. Others cause disease or spoil food.'),
      Q('Why should we wash our hands before eating?', 'to wash away harmful bacteria', ['to make our hands grow', 'to feed the bacteria'], 'Washing with soap removes germs that can make us sick.'),
      Q('Fungi and bacteria break down dead leaves and animals. They are called…', 'decomposers', ['producers', 'predators'], 'Decomposers break down dead things and return nutrients to the soil.'),
      Q('Why do we keep food in the refrigerator?', 'Cold slows the growth of bacteria and mould.', ['Cold kills all germs forever.', 'It makes food bigger.'], 'Cold slows germs down, but does not kill them all. Food still spoils in time.'),
    ],
  },
  materialProps: {
    hint: 'Properties of materials: strength, hardness, flexibility, waterproofness, and whether light passes through, or it floats.',
    items: [
      Q('A material that does not let water through is…', 'waterproof', ['transparent', 'flexible'], 'Waterproof materials, like plastic and rubber, keep water out.'),
      Q('A material that bends easily without breaking is…', 'flexible', ['brittle', 'transparent'], 'Flexible materials bend. Rubber and cloth are flexible.'),
      Q('Glass breaks easily when dropped. Glass is…', 'brittle', ['flexible', 'soft'], 'Brittle materials crack or shatter easily.'),
      Q('A steel nail scratched a piece of wood. This shows that steel is … than wood.', 'harder', ['softer', 'lighter'], 'A harder material can scratch a softer one.'),
      Q('Which material is best for a frying pan?', 'metal', ['plastic', 'paper'], 'Metal does not melt or burn on the stove, and it lets heat through to the food.', '🍳'),
      Q('Which of these floats on water?', 'wood', ['iron', 'glass'], 'Most wood floats. Iron and glass sink.'),
      Q('Why is rubber used for the soles of shoes?', 'It grips the floor and is waterproof.', ['It is see-through.', 'It breaks easily.'], 'Rubber grips well and keeps water out.', '👟'),
      Q('Why is plastic used to make raincoats?', 'It is waterproof and flexible.', ['It soaks up water.', 'It is hard and stiff.'], 'Plastic keeps rain out and bends as you move.'),
      Q('A material you can see clearly through is…', 'transparent', ['opaque', 'flexible'], 'Transparent materials, like clear glass, let light through.'),
      Q('Which material can be stretched and then goes back to its shape?', 'rubber', ['glass', 'paper'], 'Rubber is elastic. It springs back to its shape.'),
      Q('Which is made from an animal material?', 'a wool sweater', ['a cotton shirt', 'a plastic cup'], 'Wool comes from sheep. Cotton comes from a plant.'),
      Q('Which material is made by people, not found in nature?', 'plastic', ['wood', 'cotton'], 'Plastic is made in factories. Wood and cotton come from plants.'),
    ],
  },
  materialUses: {
    hint: 'A material is chosen for a job because of its properties. Ask: what must this object be able to do?',
    items: [
      Q('Why are cooking pots made of metal?', 'Metal lets heat pass through quickly.', ['Metal is light like paper.', 'Metal melts easily.'], 'Metal conducts heat well, so the food cooks.'),
      Q('Why do pot handles often have plastic or wooden covers?', 'Plastic and wood do not let heat through easily.', ['They make the pot heavier.', 'They make the pot cook faster.'], 'Plastic and wood are poor conductors of heat, so the handle stays cool to hold.'),
      Q('Why are windows made of glass?', 'Glass is transparent, so light comes in.', ['Glass is flexible.', 'Glass soaks up rain.'], 'Glass lets light in and keeps rain out.'),
      Q('Why is cloth used to make towels?', 'It soaks up water.', ['It is waterproof.', 'It is transparent.'], 'Cloth absorbs water, so it dries you.'),
      Q('Why are electric wires covered with plastic?', 'Plastic does not let electricity through.', ['Plastic makes the wires faster.', 'Plastic is shiny.'], 'The plastic cover keeps electricity in the wire and keeps us safe.'),
      Q('Why are tyres made of rubber?', 'Rubber is strong, flexible and grips the road.', ['Rubber is transparent.', 'Rubber is brittle.'], 'Rubber grips the road and bends over bumps.', '🛞'),
      Q('Why are many bridges made of steel?', 'Steel is very strong.', ['Steel is soft.', 'Steel is as light as paper.'], 'Steel is strong enough to hold up heavy cars and trucks.', '🌉'),
      Q('Which material is best for an umbrella cover?', 'waterproof cloth', ['paper', 'cotton wool'], 'An umbrella cover must keep water out and fold up.', '☂️'),
      Q('Why is paper a poor material for a raincoat?', 'Paper is not waterproof and tears when wet.', ['Paper is too strong.', 'Paper is too heavy.'], 'Paper soaks up water and tears.'),
      Q('Why are so many toys made of plastic?', 'Plastic is light, strong and easy to shape.', ['Plastic is a metal.', 'Plastic soaks up water.'], 'Plastic can be moulded into any shape and is light and strong.', '🧸'),
    ],
  },
  cycleFacts: {
    hint: 'Some animals have 3 stages in their life cycle (egg, young, adult). Others have 4 (egg, larva, pupa, adult).',
    items: [
      Q('Which stage of a butterfly does not eat?', 'the pupa', ['the caterpillar', 'the adult butterfly'], 'Inside the pupa, the body changes into a butterfly. It does not eat.', '🦋'),
      Q('A young frog that lives in water and breathes with gills is a…', 'tadpole', ['caterpillar', 'chick'], 'Tadpoles live in water and breathe with gills.', '🐸'),
      Q('Mosquito larvae live in…', 'still water', ['tree bark', 'dry sand'], 'Mosquitoes lay their eggs in still water, where the larvae live.', '🦟'),
      Q('Why should we empty water from old cans, pots and tyres?', 'Mosquitoes lay their eggs in still water.', ['The water turns into ice.', 'Butterflies lay eggs there.'], 'No still water means fewer mosquitoes, and less dengue.'),
      Q('Which animal has 3 stages in its life cycle: egg, nymph, adult?', 'cockroach', ['butterfly', 'mosquito'], 'A cockroach hatches as a nymph that looks like a small adult. No pupa.', '🪳'),
      Q('A young cockroach (nymph) looks like…', 'a small adult without wings', ['a worm', 'a tadpole'], 'Nymphs look like small adults. They grow wings as they moult.'),
      Q('Where does a butterfly usually lay its eggs?', 'on leaves the caterpillars can eat', ['in still water', 'in a bird nest'], 'When the caterpillars hatch, their food is right there.', '🍃'),
      Q('In which life cycle does the young live in water while the adult can live on land?', 'the frog', ['the chicken', 'the cockroach'], 'A tadpole lives in water. An adult frog can live on land.'),
      Q('A caterpillar sheds its skin as it grows. Why?', 'Its skin cannot stretch, so it grows a bigger one.', ['It is cold.', 'It wants to change colour.'], 'Insects moult: they shed their old skin to grow bigger.', '🐛'),
      Q('How is a chick like its parent?', 'It has feathers and a beak.', ['It has fins.', 'It lives in water.'], 'A chick looks like a small adult chicken.', '🐥'),
      Q("Which animal's young look very different from the adults?", 'a butterfly', ['a dog', 'a chicken'], 'A caterpillar looks nothing like a butterfly.'),
      Q('Do all animals have the same number of stages in their life cycle?', 'No. Some have 3 stages and some have 4.', ['Yes, all have 4 stages.', 'Yes, all have 2 stages.'], 'A chicken and a cockroach have 3 stages. A butterfly and a mosquito have 4.'),
    ],
  },
  plantParts3: {
    hint: 'Roots take in water and hold the plant. The stem carries water and food and holds the plant up. Leaves make food. Flowers become fruits, and fruits protect seeds.',
    items: [
      Q('Which part of a plant takes in water and mineral salts from the soil?', 'the roots', ['the leaves', 'the flowers'], 'Roots take in water and mineral salts.'),
      Q('What carries water from the roots to the leaves?', 'the stem', ['the flower', 'the fruit'], 'Tubes in the stem carry water up to the leaves.'),
      Q('Where does a plant make most of its food?', 'in the leaves', ['in the roots', 'in the seeds'], 'Green leaves make food using sunlight.', '🍃'),
      Q('What do leaves need to make food?', 'sunlight, water and air', ['soil, sand and rocks', 'darkness and cold'], 'Leaves use light, water and air to make food.'),
      Q('Which part holds the plant firmly in the soil?', 'the roots', ['the leaves', 'the flowers'], 'Roots spread out in the soil and anchor the plant.'),
      Q('Which part of a plant develops into a fruit?', 'the flower', ['the leaf', 'the root'], 'After pollination, part of the flower grows into the fruit.', '🌼'),
      Q('What does a fruit do for its seeds?', 'protects them and helps them spread', ['makes food from sunlight', 'takes in water from the soil'], 'The fruit protects the seeds. Animals that eat fruits spread the seeds.'),
      Q('Why are the leaves of most plants flat and wide?', 'to catch more light', ['to make the plant heavier', 'to hold the plant in the soil'], 'A wide leaf has more surface to catch sunlight.'),
      Q("A plant's stem is cut through. What happens to the leaves after a while?", 'They droop because they get no water.', ['They grow faster.', 'They turn into roots.'], 'The stem carries water. Without it, the leaves droop and dry up.'),
      Q('Why are many flowers brightly coloured and sweet-smelling?', 'to attract insects for pollination', ['to scare animals away', 'to make food'], 'Insects visit bright, sweet flowers and carry pollen between them.', '🐝'),
      Q('A carrot is a root that stores…', 'food', ['air', 'sand'], 'The carrot root stores food for the plant. We eat it.', '🥕'),
      Q('Which part holds the leaves up toward the light?', 'the stem', ['the roots', 'the fruit'], 'The stem supports the leaves so they get sunlight.'),
    ],
  },
  digestion: {
    hint: 'Food goes: mouth → gullet → stomach → small intestine → large intestine. Digestion breaks food into tiny pieces the blood can carry.',
    items: [
      Q('Where does digestion begin?', 'in the mouth', ['in the stomach', 'in the large intestine'], 'Teeth and saliva start to break down food in the mouth.', '👄'),
      Q('What do teeth do to food?', 'cut and grind it into small pieces', ['turn it into blood', 'store it'], 'Teeth break food into small pieces that are easy to swallow and digest.'),
      Q('Saliva helps us…', 'soften food and start digesting it', ['breathe', 'see'], 'Saliva wets food and starts to digest it.'),
      Q('Which tube carries food from the mouth to the stomach?', 'the gullet (oesophagus)', ['the windpipe', 'the small intestine'], 'The gullet carries food down to the stomach. The windpipe carries air.'),
      Q('In which organ is food churned and mixed with digestive juices?', 'the stomach', ['the gullet', 'the large intestine'], 'The stomach squeezes and mixes food with digestive juices.'),
      Q('Where is most digested food taken into the blood?', 'the small intestine', ['the stomach', 'the mouth'], 'Digestion finishes in the small intestine, and the food passes into the blood.'),
      Q('What does the large intestine take in from undigested food?', 'water', ['oxygen', 'sunlight'], 'The large intestine takes in water. What is left leaves the body.'),
      Q('Why is food digested?', 'so it is small enough to pass into the blood', ['so it becomes bigger', 'so it tastes better'], 'Only tiny, digested food can pass into the blood and reach every part of the body.'),
      Q('Which is NOT part of the digestive system?', 'the lungs', ['the stomach', 'the small intestine'], 'The lungs are part of the breathing (respiratory) system.'),
      Q('Which is the longest part of the digestive system?', 'the small intestine', ['the gullet', 'the stomach'], 'The small intestine is long and folded, about 6 metres in an adult.'),
      Q('Undigested food leaves the body through the…', 'anus', ['mouth', 'stomach'], 'Waste leaves the body through the anus.'),
    ],
  },
  magnetFacts: {
    hint: 'A magnet has a north (N) and a south (S) pole. Like poles repel; unlike poles attract. Magnets attract iron and steel.',
    items: [
      Q('Where are the poles of a bar magnet?', 'at its two ends', ['in the middle', 'all over it'], 'The poles, where the magnet is strongest, are at the ends.', '🧲'),
      Q('What happens when two N poles face each other?', 'They repel (push apart).', ['They attract (pull together).', 'Nothing happens.'], 'Like poles repel.'),
      Q('What happens when an N pole faces an S pole?', 'They attract (pull together).', ['They repel (push apart).', 'Nothing happens.'], 'Unlike poles attract.'),
      Q('Which test shows for sure that a metal bar is a magnet?', 'It repels one end of a magnet.', ['It is attracted to a magnet.', 'It is made of iron.'], 'Iron is attracted to a magnet too. Only a magnet can repel another magnet.'),
      Q('A bar magnet hangs freely from a string. It comes to rest pointing…', 'north and south', ['east and west', 'up and down'], 'A freely hanging magnet lines up north–south. A compass works this way.', '🧭'),
      Q('How can you make an iron nail into a magnet?', 'Stroke it many times in one direction with a magnet.', ['Paint it red.', 'Put it in water.'], 'Stroking an iron nail in one direction with a magnet magnetises it.'),
      Q('Which can make a magnet lose its magnetism?', 'dropping or heating it', ['wrapping it in paper', 'keeping it in a box'], 'Hitting, dropping or heating a magnet weakens it.'),
      Q('A magnet is under a thin wooden table. Can it move a steel paper clip on top?', 'Yes. Magnetism can pass through wood.', ['No, never.', 'Only if the clip is plastic.'], 'Magnetic force passes through materials that are not magnetic, like wood and paper.'),
      Q('Where are magnets used?', 'in compasses, fridge doors and speakers', ['in candles', 'in pencils'], 'Magnets are inside compasses, fridge door seals, speakers and motors.'),
      Q('Which material is attracted to a magnet?', 'steel', ['copper', 'aluminium'], 'Iron and steel are magnetic. Copper and aluminium are metals, but not magnetic.'),
    ],
  },
};

const G3_SORTS = {
  plantGroups: {
    ask: 'Is it a flowering or a non-flowering plant?',
    hint: 'Flowering plants make flowers, then fruits with seeds. Ferns and mosses make spores; pine trees make seeds in cones.',
    groups: {
      flowering: group('flowering plant', 'a flowering plant', 'it makes flowers, which become fruits with seeds', [
        it('mango tree', '🥭'), it('gumamela (hibiscus)', '🌺'), it('rice plant', '🌾'), it('sunflower', '🌻'), it('rose', '🌹'),
        it('coconut tree', '🌴', 'A coconut tree has small flowers that grow into coconuts.'), it('orchid', undefined), it('sampaguita', undefined),
      ]),
      nonflowering: group('non-flowering plant', 'a non-flowering plant', 'it reproduces without flowers', [
        it('fern', '🌿', 'A fern makes spores under its leaves. It has no flowers.'), m('moss', undefined, 'Moss makes spores. It has no flowers.'),
        it('pine tree', '🌲', 'A pine tree makes seeds in cones, not in flowers.'), it("bird's-nest fern", '🌿', "A bird's-nest fern makes spores, not flowers."),
        it('pako (edible fern)', undefined, 'Pako is a fern. It makes spores, not flowers.'),
      ]),
    },
  },
  magnetic: {
    ask: 'Will a magnet attract it?',
    hint: 'Magnets attract things made of iron or steel. Not every metal is magnetic: aluminium, copper and gold are not.',
    groups: {
      magnetic: group('attracted', 'something a magnet attracts', 'it is made of iron or steel', [
        it('an iron nail', undefined), it('a steel paper clip', '📎'), it('iron filings', undefined, 'Iron filings are attracted by a magnet: they are tiny bits of iron.'), it('a steel safety pin', '🧷'), it('an iron bolt', '🔩'), it('a steel fridge door', undefined),
      ], { pick: 'Which one will a magnet attract?', is: 'is attracted by a magnet' }),
      notMagnetic: group('not attracted', 'something a magnet does not attract', 'it is not made of iron or steel', [
        it('a wooden ruler', '📏'), it('a plastic cup', '🥤'), it('a rubber eraser', undefined), it('a glass marble', undefined), it('a sheet of paper', '📄'),
        it('an aluminium can', '🥫', 'Aluminium is a metal, but magnets do not attract it.'), it('a copper wire', undefined, 'Copper is a metal, but magnets do not attract it.'),
        it('a gold ring', '💍', 'Gold is a metal, but magnets do not attract it.'), it('a cotton shirt', '👕'),
      ], { pick: 'Which one will a magnet not attract?', is: 'is not attracted by a magnet' }),
    },
  },
};

/* ------------------------------------------------------------------ */
/* Sequences                                                           */
/* ------------------------------------------------------------------ */

export const SEQUENCES = {
  beanPlant: {
    name: 'the life cycle of a bean plant', pic: '🌱', cycle: true,
    steps: ['a seed', 'the seed sprouts a root', 'a seedling with small leaves', 'a young plant', 'an adult plant with flowers', 'pods with new seeds'],
    loop: 'The new seeds can grow into new bean plants.',
  },
  butterfly: {
    name: 'the life cycle of a butterfly', pic: '🦋', cycle: true,
    steps: ['egg', 'caterpillar (larva)', 'pupa', 'adult butterfly'],
    loop: 'The adult butterfly lays eggs, and the cycle starts again.',
  },
  frog: {
    name: 'the life cycle of a frog', pic: '🐸', cycle: true,
    steps: ['egg', 'tadpole', 'tadpole with legs', 'young frog (froglet)', 'adult frog'],
    loop: 'The adult frog lays eggs in water, and the cycle starts again.',
  },
  chicken: {
    name: 'the life cycle of a chicken', pic: '🐔', cycle: true,
    steps: ['egg', 'chick', 'adult chicken'],
    loop: 'The adult hen lays eggs, and the cycle starts again.',
  },
  mosquito: {
    name: 'the life cycle of a mosquito', pic: '🦟', cycle: true,
    steps: ['egg', 'larva', 'pupa', 'adult mosquito'],
    loop: 'The adult mosquito lays eggs in still water, and the cycle starts again.',
  },
  cockroach: {
    name: 'the life cycle of a cockroach', pic: '🪳', cycle: true,
    steps: ['egg', 'nymph', 'adult cockroach'],
    loop: 'The adult cockroach lays eggs, and the cycle starts again.',
  },
  plantCycle: {
    name: 'the life cycle of a flowering plant', pic: '🌻', cycle: true,
    steps: ['seed', 'seedling', 'adult plant', 'flower', 'fruit with seeds'],
    loop: 'The seeds in the fruit grow into new plants, and the cycle starts again.',
  },
  digestion: {
    name: 'the path of food through the body', pic: '🍎', cycle: false,
    steps: ['mouth', 'gullet', 'stomach', 'small intestine', 'large intestine'],
    hint: 'Food goes in at the mouth, down the gullet, into the stomach, then through the small and large intestines.',
  },
};

export const QUIZ = { ...G1, ...G2, ...G3 };
export const SORTS = { ...G1_SORTS, ...G2_SORTS, ...G3_SORTS };
