/**
 * Science for Grades 4–6: question banks, sorting sets, sequences, food
 * chains and experiments (science.js turns them into questions). Data only,
 * apart from the small label functions in EXPERIMENTS.
 *
 * Every question is original and has one right answer, written by hand.
 * tests/science.test.mjs checks the lists. Item keys as in scienceData.js:
 * q = question, a = right answer, w = wrong answers, e = why, pic = picture.
 */

const Q = (q, a, w, e, pic) => ({ q, a, w, e, ...(pic ? { pic } : {}) });
const it = (name, emoji, why) => ({ name, emoji, ...(why ? { why } : {}) });
/** words: { pick: 'Which one is opaque?', is: 'is opaque' } when "Which one is …?" would read badly. */
const group = (label, name, why, items, words = {}) => ({ label, name, why, items, ...words });
/** A mass noun ("frosted glass"): said without "a". */
const m = (name, emoji, why) => ({ name, emoji, ...(why ? { why } : {}), mass: true });

/* ------------------------------------------------------------------ */
/* Grade 4: matter, heat and light                                     */
/* ------------------------------------------------------------------ */

const G4 = {
  matter: {
    hint: 'Matter is anything that has mass and takes up space. Solids, liquids and gases are matter. Light, heat and sound are not.',
    items: [
      Q('Matter is anything that…', 'has mass and takes up space', ['you can see', 'is hard'], 'Air is invisible, but it has mass and takes up space, so it is matter.'),
      Q('Which is NOT matter?', 'light', ['air', 'water'], 'Light is a form of energy. It has no mass and takes up no space.'),
      Q('Which shows that air takes up space?', 'A balloon gets bigger when you blow into it.', ['A balloon is colourful.', 'Air is invisible.'], 'The air you blow in needs room, so the balloon gets bigger.', '🎈'),
      Q('Which tool measures mass?', 'a weighing scale', ['a ruler', 'a thermometer'], 'A weighing scale (or a balance) measures mass.', '⚖️'),
      Q('Mass is measured in…', 'grams and kilograms', ['litres', 'degrees Celsius'], 'Mass is measured in grams (g) and kilograms (kg).'),
      Q('Volume is the amount of … something takes up.', 'space', ['heat', 'colour'], 'Volume is how much space something takes up.'),
      Q('Which is matter?', 'the air in a tyre', ['a shadow', 'a sound'], 'Air has mass and takes up space. Shadows and sounds do not.'),
      Q('Heat is…', 'a form of energy, not matter', ['a kind of gas', 'a kind of liquid'], 'Heat is energy. It has no mass.'),
      Q('An empty cup is pushed upside down into water. Why does water not fill it?', 'The air inside takes up space.', ['Water cannot touch cups.', 'The cup is too small.'], 'The cup is full of air. The air takes up space, so the water cannot get in.', '🥛'),
      Q('A bag of rice has a mass of 5 kg. This tells us…', 'how much matter is in it', ['how hot it is', 'how long it is'], 'Mass is the amount of matter in something.', '🍚'),
      Q('Which tool measures the volume of a liquid?', 'a measuring cylinder', ['a weighing scale', 'a thermometer'], 'A measuring cylinder is marked in millilitres (ml).', '🧪'),
    ],
  },
  statesProps: {
    hint: 'Solid: fixed shape and fixed volume. Liquid: fixed volume, takes the shape of its container. Gas: no fixed shape or volume, and can be squashed.',
    items: [
      Q('Which state of matter has a fixed shape and a fixed volume?', 'solid', ['liquid', 'gas'], 'A solid keeps its own shape and volume.'),
      Q('Which state has a fixed volume but takes the shape of its container?', 'liquid', ['solid', 'gas'], 'A liquid flows to fit its container, but its volume stays the same.'),
      Q('Which state has no fixed shape and no fixed volume?', 'gas', ['solid', 'liquid'], 'A gas spreads out to fill whatever space it is in.'),
      Q('Which can be squashed (compressed) easily?', 'gas', ['solid', 'liquid'], 'Gases have lots of space between their particles, so they can be squashed.'),
      Q('Water is poured from a tall glass into a wide bowl. What stays the same?', 'its volume', ['its shape', 'how high the water is'], 'The water changes shape, but its volume stays the same.'),
      Q('More air is pumped into a ball until it is hard. What happened?', 'More air was squashed into the same space.', ['The air turned into a liquid.', 'The air lost its mass.'], 'Air can be compressed, so more of it fits in the ball.', '⚽'),
      Q('Sand can be poured, but it is a solid. Why?', 'Each grain keeps its own shape and volume.', ['Sand is a liquid.', 'Sand is a gas.'], 'A pile of sand pours, but every grain is a tiny solid.'),
      Q('A gas spreads out to…', 'fill all the space in its container', ['the bottom of its container only', 'make a fixed shape'], 'A gas fills any container completely.'),
      Q('Which is a liquid at room temperature?', 'cooking oil', ['salt', 'oxygen'], 'Oil flows and takes the shape of its bottle. Salt is a solid and oxygen is a gas.'),
      Q('Honey flows slowly, but it is still a…', 'liquid', ['solid', 'gas'], 'Honey flows and takes the shape of its jar, so it is a liquid.', '🍯'),
      Q('The smell of frying fish reaches the next room. This shows that gases…', 'spread out to fill a space', ['have a fixed shape', 'are heavier than solids'], 'The smell is a gas that spreads out through the air.', '🐟'),
    ],
  },
  changeState: {
    hint: 'Melting: solid to liquid. Freezing: liquid to solid. Evaporating and boiling: liquid to gas. Condensing: gas to liquid.',
    items: [
      Q('Ice changes into water. This is called…', 'melting', ['freezing', 'condensation'], 'Melting is a solid changing into a liquid. Ice gains heat and melts.', '🧊'),
      Q('Water changes into ice in the freezer. This is called…', 'freezing', ['melting', 'evaporation'], 'Freezing is a liquid changing into a solid. The water loses heat.'),
      Q('Wet clothes dry in the sun because the water…', 'evaporates', ['freezes', 'melts'], 'The water gains heat and evaporates into water vapour.', '👕'),
      Q('Droplets form on the outside of a glass of iced water. This is…', 'condensation', ['evaporation', 'melting'], 'Water vapour in the air touches the cold glass, loses heat and condenses.', '🥤'),
      Q('Pure water boils at…', '100 °C', ['0 °C', '37 °C'], 'Pure water boils at 100 °C.'),
      Q('Pure water freezes at…', '0 °C', ['100 °C', '50 °C'], 'Pure water freezes (and ice melts) at 0 °C.'),
      Q('When water evaporates, it turns into…', 'water vapour', ['ice', 'salt'], 'Water vapour is water as a gas. It is invisible.'),
      Q('When a solid melts, it…', 'gains heat', ['loses heat', 'loses mass'], 'A solid must gain heat to melt.'),
      Q('Water vapour loses heat and changes into water. This is…', 'condensation', ['evaporation', 'melting'], 'Condensation is a gas changing into a liquid when it loses heat.'),
      Q('The bathroom mirror fogs up after a hot shower. Why?', 'Warm water vapour condenses on the cool mirror.', ['The mirror melts.', 'Soap sticks to it.'], 'The water vapour loses heat to the cool mirror and condenses into tiny droplets.', '🪞'),
      Q('Which makes water evaporate faster?', 'more heat, more wind and a wider surface', ['a lid over the water', 'cold, still air'], 'Heat, wind and a large exposed surface all speed up evaporation.'),
      Q('Does water only evaporate when it boils?', 'No. Water can evaporate at any temperature.', ['Yes, only at 100 °C.', 'Yes, only in the sun.'], 'Puddles dry up on cool days too. Boiling is just very fast evaporation.'),
    ],
  },
  heat: {
    hint: 'Heat flows from a hotter place to a colder one. Things expand when they gain heat and contract when they lose heat.',
    items: [
      Q('Heat always flows from…', 'a hotter place to a colder place', ['a colder place to a hotter place', 'the bottom to the top only'], 'Heat moves from hot to cold until both are the same temperature.'),
      Q('Which tool measures temperature?', 'a thermometer', ['a measuring cylinder', 'a ruler'], 'A thermometer measures how hot or cold something is.', '🌡️'),
      Q('Temperature is measured in…', 'degrees Celsius', ['grams', 'centimetres'], 'We measure temperature in degrees Celsius.'),
      Q('Normal human body temperature is about…', '37 °C', ['100 °C', '0 °C'], 'A healthy body is about 37 °C. A temperature of 37.5 °C or higher may be a fever.'),
      Q('Most solids … when they gain heat.', 'expand', ['contract', 'lose mass'], 'Heated solids expand: they get a little bigger.'),
      Q('Why are there small gaps between sections of railway track?', 'to leave room for the metal to expand on hot days', ['to make a clicking sound', 'to save metal'], 'On hot days the steel expands. The gaps stop the track from bending.', '🛤️'),
      Q('A dented ping-pong ball is put in hot water and the dent pops out. Why?', 'The air inside expands when heated.', ['The water pushes it out.', 'The ball melts.'], 'The air inside gains heat, expands and pushes the dent out.', '🏓'),
      Q('A cup of hot chocolate is left on the table. What happens?', 'It loses heat to the air until it is as warm as the room.', ['It gets hotter.', 'It gains heat from the air.'], 'Heat flows from the hot drink to the cooler air.', '☕'),
      Q('A tight metal lid on a glass jar can be loosened by…', 'running warm water over the lid', ['putting the jar in the freezer', 'shaking the jar'], 'The metal lid expands more than the glass, so it loosens.'),
      Q('Which is a source of heat?', 'the Sun', ['ice', 'a shadow'], 'The Sun gives out heat and light.'),
      Q('An ice cube melts in your hand because…', 'it gains heat from your hand', ['your hand gains cold from it', 'it loses heat to your hand'], 'Heat flows from your warm hand to the ice. "Cold" does not flow.'),
    ],
  },
  heatGainLoss: {
    hint: 'Something gains heat from warmer surroundings and loses heat to colder ones. Poor conductors slow heat down in both directions.',
    items: [
      Q('An ice cream melts on a hot day. The ice cream…', 'gains heat from the warm air', ['loses heat to the air', 'gains cold from the air'], 'Heat flows from the warm air into the ice cream.', '🍦'),
      Q('Hot soup is left on the table. The soup…', 'loses heat to the cooler air', ['gains heat', 'loses cold'], 'Heat flows from the hot soup to the cooler air around it.', '🍲'),
      Q('Which cup keeps a drink hot for longest?', 'a foam cup with a lid', ['a thin metal cup with no lid', 'a thin glass with no lid'], 'Foam is a poor conductor of heat, and the lid stops warm vapour escaping.'),
      Q('Why do we use a cloth mitt to hold a hot pot?', 'Cloth is a poor conductor of heat.', ['Cloth is a good conductor of heat.', 'Cloth makes the pot boil faster.'], 'Cloth (and the air trapped in it) lets heat through slowly, so our hands are safe.'),
      Q('A metal bench and a wooden bench are in the same shade. Why does the metal one feel colder?', 'Metal takes heat from your skin faster.', ['Metal is always colder than wood.', 'Wood makes its own heat.'], 'Both are the same temperature. Metal conducts heat away from your skin faster, so it feels colder.'),
      Q('Why do people in cold places wear layers of clothes?', 'Air trapped between the layers is a poor conductor of heat.', ['The layers make their own heat.', 'The layers let cold air in.'], 'Trapped air slows down the loss of body heat.'),
      Q('A cold can of juice is left in the room. Its temperature…', 'rises until it reaches room temperature', ['keeps falling', 'stays the same'], 'The can gains heat from the warmer air.'),
      Q('Why are cooking pots often metal with plastic handles?', 'Metal conducts heat to the food; plastic keeps hands safe.', ['Plastic conducts heat to the food.', 'Metal keeps hands safe.'], 'Metal is a good conductor of heat. Plastic is a poor one.'),
      Q('Two ice cubes: one is wrapped in wool, one is not. Which melts more slowly?', 'the one wrapped in wool', ['the one not wrapped', 'both melt at the same time'], 'Wool is a poor conductor, so it slows down the heat reaching the ice. Wool does not make heat.', '🧊'),
      Q('When water freezes, it…', 'loses heat', ['gains heat', 'gains cold'], 'Water must lose heat to freeze into ice.'),
    ],
  },
  light: {
    hint: 'We see an object when light from it, or reflected by it, enters our eyes. Light travels in straight lines.',
    items: [
      Q('We see an object when…', 'light from it enters our eyes', ['light from our eyes hits it', 'we close our eyes'], 'Light from the object, or reflected off it, travels into our eyes.', '👀'),
      Q('Which is a source of light?', 'a candle flame', ['the Moon', 'a mirror'], 'A candle flame gives off its own light. The Moon and a mirror only reflect light.', '🕯️'),
      Q('Is the Moon a source of light?', 'No. It reflects light from the Sun.', ['Yes. It makes its own light.', 'Yes, but only at night.'], 'The Moon has no light of its own.', '🌙'),
      Q('Light travels in…', 'straight lines', ['curves around corners', 'circles'], 'Light travels in straight lines, which is why shadows form.'),
      Q('Why can we not see around corners?', 'Light travels in straight lines.', ['Corners are dark.', 'Our eyes are too small.'], 'Light cannot bend around the corner to reach our eyes.'),
      Q('A mirror … light.', 'reflects', ['makes', 'absorbs all'], 'A smooth, shiny mirror reflects light.', '🪞'),
      Q('In a completely dark room, can you see a red ball?', 'No. There is no light to reflect into your eyes.', ['Yes, red is bright.', 'Yes, if you look hard.'], 'With no light, nothing reflects into your eyes, so you see nothing.'),
      Q('Which surface reflects light best?', 'a shiny mirror', ['black cloth', 'rough wood'], 'Smooth, shiny surfaces reflect the most light.'),
      Q('Why do cyclists wear reflective vests at night?', 'They reflect light so drivers can see them.', ['They make the bike faster.', 'They keep the rider warm.'], 'Car headlights reflect off the vest back to the driver.', '🚴'),
      Q('Which is NOT a source of light?', 'a shiny spoon', ['the Sun', 'a torch'], 'A shiny spoon only reflects light.'),
      Q('A periscope uses … to see over a wall.', 'mirrors', ['magnets', 'sponges'], 'Two mirrors reflect light down to your eyes.'),
    ],
  },
  shadows4: {
    hint: 'An opaque object blocks light and makes a shadow on the side away from the light. Moving the object closer to the light makes a bigger shadow.',
    items: [
      Q('A shadow forms when…', 'an opaque object blocks light', ['a transparent object lets light through', 'light bends around an object'], 'Light cannot pass through an opaque object, so a shadow forms behind it.'),
      Q('Which casts the darkest shadow?', 'a wooden board', ['frosted glass', 'clear glass'], 'Wood is opaque and blocks all the light.'),
      Q('A translucent object casts…', 'a faint shadow', ['a dark, sharp shadow', 'a coloured rainbow'], 'A translucent object lets some light through, so its shadow is faint.'),
      Q('A torch is moved closer to a toy. The toy\'s shadow on the wall becomes…', 'bigger', ['smaller', 'the same size'], 'Closer to the light, the toy blocks more light, so the shadow grows.', '🔦'),
      Q('A torch shines on a toy from its left. Where is the shadow?', 'on the right of the toy', ['on the left of the toy', 'on top of the torch'], 'The shadow is on the side away from the light.'),
      Q('Why is your shadow shortest around noon?', 'The Sun is high in the sky.', ['The Sun is low in the sky.', 'The Sun is behind you.'], 'When the Sun is high, light comes from almost overhead, so shadows are short.', '☀️'),
      Q('In the morning, the Sun is in the east. Your shadow points…', 'west', ['east', 'up'], 'Your shadow points away from the Sun.', '🌅'),
      Q("Why does a shadow have the same outline as the object?", 'Light travels in straight lines and is blocked at the edges.', ['The object paints the wall.', 'Shadows are reflections.'], 'Light that passes the edges travels straight on, so the shadow keeps the outline.'),
      Q('Is a shadow matter?', 'No. It is only a place where light is blocked.', ['Yes. It has mass.', 'Yes. It is a gas.'], 'A shadow has no mass and takes up no space.'),
      Q('A toy is moved away from the torch, closer to the wall. Its shadow…', 'gets smaller and sharper', ['gets bigger', 'disappears'], 'Farther from the light, the toy blocks less light, so its shadow shrinks.'),
    ],
  },
};

const G4_SORTS = {
  heatConductors: {
    ask: 'Is it a good or a poor conductor of heat?',
    hint: 'Metals are good conductors of heat. Wood, plastic, cloth, rubber, foam and trapped air are poor conductors.',
    groups: {
      good: group('good conductor of heat', 'a good conductor of heat', 'it is a metal, and heat passes through metals quickly', [
        it('a metal spoon', '🥄'), it('a copper pot', undefined), it('an aluminium tray', undefined), it('an iron pan', '🍳'), it('a steel nail', undefined), m('aluminium foil', undefined),
      ]),
      poor: group('poor conductor of heat', 'a poor conductor of heat', 'heat passes through it slowly', [
        it('a wooden spoon', undefined), it('a plastic handle', undefined), it('a cloth oven mitt', '🧤'), it('a rubber mat', undefined), it('a wool blanket', undefined), it('a foam cup', undefined),
      ]),
    },
  },
  lightPass: {
    ask: 'Is it transparent, translucent or opaque?',
    hint: 'Transparent: almost all light passes through (clear). Translucent: some light passes through (blurry). Opaque: no light passes through.',
    groups: {
      transparent: group('transparent', 'transparent', 'almost all light passes through it, so you can see clearly through it', [
        m('clear window glass', '🪟'), m('clear plastic wrap', undefined), it('a clear plastic bottle', undefined), m('clean water in a glass', '🥛'),
      ]),
      translucent: group('translucent', 'translucent', 'some light passes through it, but you cannot see clearly through it', [
        m('frosted glass', undefined), m('wax paper', undefined), m('tracing paper', undefined), m('tissue paper', undefined),
      ]),
      opaque: group('opaque', 'opaque', 'no light passes through it', [
        it('a wooden door', '🚪'), it('a cardboard box', '📦'), it('a metal plate', undefined), it('a thick book', '📕'), it('a brick wall', '🧱'), m('aluminium foil', undefined),
      ]),
    },
  },
};

/* ------------------------------------------------------------------ */
/* Grade 5: cells, body and plant systems, reproduction, electricity   */
/* ------------------------------------------------------------------ */

const G5 = {
  cellParts: {
    hint: 'Nucleus: controls the cell. Cell membrane: controls what goes in and out. Cytoplasm: where activities happen. Plants also have a cell wall and chloroplasts.',
    items: [
      Q('The basic unit of all living things is the…', 'cell', ['organ', 'bone'], 'All living things are made of one or more cells.', '🔬'),
      Q('Which part of the cell controls all its activities?', 'the nucleus', ['the cell membrane', 'the cytoplasm'], 'The nucleus is the control centre of the cell.'),
      Q('Which part controls what goes in and out of the cell?', 'the cell membrane', ['the nucleus', 'the cell wall'], 'The thin cell membrane lets some things in and out, and keeps others out.'),
      Q('In which jelly-like part do most cell activities happen?', 'the cytoplasm', ['the cell wall', 'the nucleus'], 'Most activities of the cell happen in the cytoplasm.'),
      Q('Which part gives a plant cell its fixed shape?', 'the cell wall', ['the cell membrane', 'the nucleus'], 'The tough cell wall supports the plant cell and keeps its shape.'),
      Q('Which part contains chlorophyll to make food?', 'the chloroplast', ['the nucleus', 'the vacuole'], 'Chloroplasts contain green chlorophyll, which traps light to make food.'),
      Q('Which part holds the information passed from parents to their young?', 'the nucleus', ['the cytoplasm', 'the cell wall'], 'The nucleus holds the information (genetic material) that is passed on.'),
      Q('Which tool do we use to see cells?', 'a microscope', ['a telescope', 'a thermometer'], 'Most cells are too small to see without a microscope.'),
      Q('A large space filled with cell sap in a plant cell is the…', 'vacuole', ['nucleus', 'chloroplast'], 'Plant cells have one large vacuole filled with cell sap.'),
      Q('Cells of the same kind working together form a…', 'tissue', ['cell wall', 'nucleus'], 'Similar cells form tissues; tissues form organs; organs form systems.'),
      Q('Which is the right order from smallest to biggest?', 'cell → tissue → organ → system', ['organ → cell → tissue → system', 'system → organ → tissue → cell'], 'Cells make tissues, tissues make organs, and organs work together as systems.'),
    ],
  },
  cellCompare: {
    hint: 'Plant and animal cells both have a nucleus, cytoplasm and cell membrane. Only plant cells have a cell wall, and many have chloroplasts.',
    items: [
      Q('Which part is found in plant cells but NOT in animal cells?', 'the cell wall', ['the nucleus', 'the cell membrane'], 'Only plant cells have a cell wall.'),
      Q('Which part is found in both plant and animal cells?', 'the nucleus', ['the cell wall', 'the chloroplast'], 'Both plant and animal cells have a nucleus.'),
      Q('Why do root cells have no chloroplasts?', 'They are underground, with no light to make food.', ['Roots do not need food.', 'Roots are not made of cells.'], 'Chloroplasts need light. Root cells get food made by the leaves.'),
      Q('A cell has a cell wall and chloroplasts. It most likely comes from…', 'a leaf', ["a human's cheek", "a cat's muscle"], 'A cell wall and chloroplasts are found in green plant parts like leaves.', '🍃'),
      Q('A cell has a nucleus, cytoplasm and a cell membrane, but no cell wall. It most likely comes from…', 'an animal', ['a plant leaf', 'a plant stem'], 'Animal cells have no cell wall.'),
      Q('Which of these is made of only one cell?', 'a bacterium', ['a mango tree', 'a dog'], 'A bacterium is a single cell.'),
      Q('Plant cells usually have one large…', 'vacuole', ['chloroplast', 'nucleus'], 'The large vacuole holds cell sap and helps keep the cell firm.'),
      Q('Which cell part is green?', 'the chloroplast', ['the nucleus', 'the cytoplasm'], 'Chloroplasts are green because of chlorophyll.'),
      Q('Do all plant cells have chloroplasts?', 'No. Cells in roots and other parts with no light do not.', ['Yes. Every plant cell has them.', 'No. Only flowers have them.'], 'Only cells that get light, mostly in leaves and green stems, have chloroplasts.'),
      Q('How do animal cells usually compare in shape with plant cells?', 'Animal cells have no fixed shape; plant cells are more regular.', ['Animal cells are always square.', 'Both are always round.'], 'The cell wall gives plant cells a regular shape. Animal cells have none.'),
    ],
  },
  respiratory: {
    hint: 'Air goes in through the nose or mouth, down the windpipe, into the lungs. Oxygen passes into the blood in the tiny air sacs.',
    items: [
      Q('Which gas from the air we breathe in does the body use?', 'oxygen', ['carbon dioxide', 'water vapour'], 'Our cells use oxygen to release energy from food.'),
      Q('Which gas do we breathe out more of than we breathe in?', 'carbon dioxide', ['oxygen', 'nitrogen'], 'Cells make carbon dioxide, and we breathe it out.'),
      Q('Air enters the body through the…', 'nose and mouth', ['ears', 'stomach'], 'We breathe in through the nose and mouth.', '👃'),
      Q('Which tube carries air from the throat to the lungs?', 'the windpipe', ['the gullet', 'the small intestine'], 'The windpipe (trachea) carries air. The gullet carries food.'),
      Q('Where does oxygen pass into the blood?', 'in the tiny air sacs of the lungs', ['in the stomach', 'in the nose'], 'The air sacs have very thin walls and many blood vessels around them.', '🫁'),
      Q('Why do we breathe faster when we run?', 'Our body needs more oxygen.', ['Our lungs get smaller.', 'We need less air.'], 'Working muscles need more oxygen, so we breathe faster and deeper.', '🏃'),
      Q('Tiny hairs and mucus in the nose…', 'trap dust and germs', ['make food', 'pump blood'], 'They clean the air before it reaches the lungs.'),
      Q('Fish take in oxygen from water using their…', 'gills', ['lungs', 'fins'], 'Gills take in oxygen dissolved in water.', '🐟'),
      Q('Plants take in and give out gases through tiny openings in their leaves called…', 'stomata', ['roots', 'petals'], 'Stomata are tiny pores, mostly on the underside of leaves.'),
      Q('Breathed-out air has more … than breathed-in air.', 'carbon dioxide and water vapour', ['oxygen', 'dust'], 'Breathe on a cold mirror: the mist is water vapour condensing.'),
      Q('Why is smoking harmful?', 'Smoke damages the lungs.', ['Smoke makes the lungs stronger.', 'Smoke gives the body more oxygen.'], 'Smoke damages the air sacs and can cause lung disease.'),
    ],
  },
  circulatory: {
    hint: 'The heart pumps blood. Arteries carry blood away from the heart, veins carry it back, and capillaries reach every cell.',
    items: [
      Q('Which organ pumps blood around the body?', 'the heart', ['the lungs', 'the stomach'], 'The heart is a muscle that pumps blood all the time.', '❤️'),
      Q('Blood carries oxygen and … to all parts of the body.', 'digested food', ['bones', 'undigested food'], 'Blood carries oxygen from the lungs and digested food from the small intestine.'),
      Q('Blood vessels that carry blood away from the heart are…', 'arteries', ['veins', 'capillaries'], 'Arteries carry blood away from the heart.'),
      Q('Blood vessels that carry blood back to the heart are…', 'veins', ['arteries', 'capillaries'], 'Veins carry blood back to the heart.'),
      Q('The tiniest blood vessels, where things pass in and out of cells, are…', 'capillaries', ['arteries', 'veins'], 'Capillaries have very thin walls, so oxygen and food pass to the cells.'),
      Q('What does blood carry away from the cells to the lungs?', 'carbon dioxide', ['oxygen', 'digested food'], 'Cells make carbon dioxide. Blood takes it to the lungs to be breathed out.'),
      Q('Your heart beats faster when you exercise because…', 'your muscles need more oxygen and food', ['your blood gets cold', 'your heart is tired'], 'A faster heartbeat sends more blood to the working muscles.'),
      Q('Where does blood pick up oxygen?', 'in the lungs', ['in the stomach', 'in the brain'], 'Oxygen passes from the air sacs into the blood.'),
      Q('Where does blood pick up digested food?', 'in the small intestine', ['in the lungs', 'in the heart'], 'Digested food passes from the small intestine into the blood.'),
      Q('You can feel a pulse at your wrist. A pulse shows…', 'your heart beating', ['your lungs breathing', 'your food digesting'], 'Each beat of the heart pushes blood through the arteries, which you feel as a pulse.'),
      Q('Which system works with the circulatory system to bring oxygen into the body?', 'the respiratory system', ['the digestive system', 'the skeletal system'], 'The lungs take in oxygen; the blood carries it to every cell.'),
    ],
  },
  bodyTogether: {
    hint: 'Body systems work together: the lungs bring in oxygen, the digestive system breaks down food, and the blood carries both to every cell.',
    items: [
      Q('During exercise, your breathing rate and heart rate…', 'both go up', ['both go down', 'stay the same'], 'Muscles need more oxygen and food, so both speed up.'),
      Q('Which two systems work together to bring oxygen to your muscles?', 'the respiratory and circulatory systems', ['the digestive and skeletal systems', 'the skeletal and muscular systems'], 'The lungs take oxygen in; the blood carries it to the muscles.'),
      Q('Food digested in the small intestine reaches the muscles through the…', 'blood', ['lungs', 'windpipe'], 'Digested food passes into the blood, which carries it to all cells.'),
      Q('Cells use oxygen and digested food to…', 'release energy', ['make bones', 'make sunlight'], 'Cells use oxygen to release energy from food. This is respiration.'),
      Q('Why does blood leaving the lungs have more oxygen than blood going in?', 'It picked up oxygen from the air sacs.', ['The heart makes oxygen.', 'The stomach adds oxygen.'], 'Oxygen passes into the blood in the air sacs.'),
      Q('Which organs remove carbon dioxide from the body?', 'the lungs', ['the stomach', 'the small intestine'], 'Blood brings carbon dioxide to the lungs, and we breathe it out.'),
      Q("A runner's muscles need more energy. Which change helps?", 'faster breathing', ['a slower heartbeat', 'holding the breath'], 'More oxygen lets the muscles release more energy.'),
      Q('Which system breaks food into pieces small enough for the blood to carry?', 'the digestive system', ['the respiratory system', 'the circulatory system'], 'Digestion makes food small enough to pass into the blood.'),
      Q('Why do you feel hungry after a long game of basketball?', 'Your muscles used up energy from food.', ['Your lungs need food.', 'Your blood turned into food.'], 'Exercise uses energy released from digested food, so the body needs more.'),
      Q('Why do you sweat when you exercise?', 'Sweat evaporates from your skin and cools you down.', ['Sweat gives your muscles oxygen.', 'Sweat is how food leaves the body.'], 'Working muscles make heat. Sweat takes heat away as it evaporates.'),
      Q('Which is the right path for oxygen to reach a muscle?', 'nose → windpipe → lungs → blood → muscle', ['nose → stomach → heart → muscle', 'mouth → gullet → lungs → muscle'], 'Air goes down the windpipe to the lungs; oxygen passes into the blood, which carries it to the muscle.'),
    ],
  },
  plantTransport: {
    hint: 'Water-carrying tubes take water up from the roots. Food-carrying tubes take food from the leaves to all parts of the plant.',
    items: [
      Q('Water-carrying tubes in a plant carry water from…', 'the roots to the leaves', ['the leaves to the roots', 'the flowers to the soil'], 'Water goes up from the roots, through the stem, to the leaves.'),
      Q('Food-carrying tubes in a plant carry food from…', 'the leaves to the other parts of the plant', ['the soil to the leaves', 'the roots to the air'], 'Food is made in the leaves and carried to every part of the plant.'),
      Q('A white flower is put in red-coloured water. After a day, the petals turn red. Why?', 'The water-carrying tubes carried the red water up.', ['The flower made red food.', 'The red colour came from the air.'], 'The coloured water went up the water-carrying tubes into the petals.', '🌸'),
      Q('A ring of bark, with the food-carrying tubes, is removed from a tree trunk. What happens just above the ring?', 'It swells, because food collects there.', ['It turns red.', 'Water stops going up.'], 'Food coming down from the leaves cannot pass the ring, so it collects above it. Water still goes up the inner tubes.', '🌳'),
      Q('After a ring of bark is removed, why do the roots slowly die?', 'Food from the leaves can no longer reach them.', ['Water cannot reach the roots.', 'The roots get too much food.'], 'The food-carrying tubes were cut, so the roots starve.'),
      Q('Where are water-carrying tubes found?', 'in the roots, stem and leaves', ['only in the flowers', 'only in the roots'], 'The tubes run all the way from the roots to the leaves.'),
      Q('How does water leave a plant?', 'It evaporates through tiny openings in the leaves.', ['It drips out of the roots.', 'It turns into food.'], 'Water vapour escapes through the stomata in the leaves.'),
      Q('Why does a plant droop on a hot, dry day?', 'It loses water faster than its roots take it in.', ['It gets too much water.', 'Its leaves make too much food.'], 'On a hot day water evaporates fast from the leaves.'),
      Q('The veins in a leaf contain…', 'water-carrying and food-carrying tubes', ['blood', 'air only'], 'Leaf veins bring water in and carry food out.', '🍃'),
      Q('Food made in the leaves can be stored in…', 'roots, stems, fruits and seeds', ['only flowers', 'the soil'], 'Carrots (roots), sugarcane (stems), mangoes (fruits) and beans (seeds) store food.'),
    ],
  },
  flowerParts: {
    hint: 'Anthers make pollen. Pollination moves pollen to the stigma. After fertilisation, the ovary becomes the fruit and the ovules become seeds.',
    items: [
      Q('Which part of a flower makes pollen?', 'the anther', ['the stigma', 'the ovary'], 'Pollen is made in the anthers, at the top of the stamens.', '🌸'),
      Q('Pollination is when pollen moves from…', 'an anther to a stigma', ['a stigma to an anther', 'a root to a leaf'], 'Pollen lands on the sticky stigma.'),
      Q('Which part of a flower becomes the fruit after fertilisation?', 'the ovary', ['the anther', 'the petal'], 'The ovary grows into the fruit.'),
      Q('Which part becomes the seed?', 'the ovule', ['the ovary', 'the anther'], 'Each fertilised ovule becomes a seed inside the fruit.'),
      Q('Why do many flowers have bright petals and nectar?', 'to attract animals that carry pollen', ['to make food for the plant', 'to protect the roots'], 'Bees, butterflies and birds come for nectar and carry pollen.', '🐝'),
      Q('Flowers pollinated by wind usually have…', 'small, dull petals and light, dry pollen', ['big, bright petals and sticky pollen', 'sweet nectar'], 'Wind-pollinated flowers, like rice and corn, do not need to attract insects.', '🌾'),
      Q('The sticky top of the female part that catches pollen is the…', 'stigma', ['anther', 'filament'], 'The stigma is sticky so pollen stays on it.'),
      Q('Fertilisation happens when…', 'a male cell from pollen joins an egg cell in an ovule', ['the petals fall off', 'the seed starts to grow'], 'After pollination, a male cell travels down to the ovule and joins the egg cell.'),
      Q('After fertilisation, the petals usually…', 'wither and fall off', ['grow bigger', 'turn into seeds'], 'The petals are no longer needed, so they wither.'),
      Q('Which is the male part of a flower?', 'the stamen (anther and filament)', ['the stigma', 'the ovary'], 'The stamen makes pollen, which carries the male cells.'),
      Q('How do bees help flowers?', 'They carry pollen from flower to flower.', ['They eat the roots.', 'They give the flower water.'], 'Pollen sticks to the bee and rubs off on the next flower.'),
    ],
  },
  waterResource: {
    hint: 'The water cycle: evaporation, condensation into clouds, then rain. Only a small part of Earth\'s water is fresh water we can use.',
    items: [
      Q("Most of the Earth's water is…", 'salt water in the seas and oceans', ['fresh water in rivers', 'ice in freezers'], 'About 97% of Earth\'s water is salt water.', '🌊'),
      Q('Why must we save fresh water?', "Only a small part of Earth's water is fresh water we can use.", ['Fresh water will turn into salt water.', 'Water costs nothing.'], 'Most fresh water is frozen or underground, so the water we can use is limited.'),
      Q('Which is a way to save water at home?', 'Turn off the tap while brushing your teeth.', ['Leave the hose running.', 'Take very long showers.'], 'Turning off the tap saves many litres each day.', '🚰'),
      Q('Clouds are made of…', 'tiny water droplets', ['smoke', 'cotton'], 'Water vapour condenses into tiny droplets, which form clouds.', '☁️'),
      Q('What makes water vapour in the air condense into clouds?', 'It cools down as it rises.', ['It gets hotter.', 'It mixes with salt.'], 'The air is colder higher up, so the vapour loses heat and condenses.'),
      Q('How does the water cycle help living things?', 'It brings fresh water back as rain.', ['It makes the Sun hotter.', 'It keeps water in the clouds forever.'], 'Water evaporates from the salty sea, but falls back as fresh rain.'),
      Q('Rainwater collected in a drum can be used for…', 'watering plants and flushing toilets', ['making the rain stop', 'cooling the Sun'], 'Using rainwater saves tap water.'),
      Q('Why should we not throw rubbish into rivers?', 'It pollutes the water and harms living things.', ['It cleans the river.', 'Fish eat it and grow.'], 'Rubbish pollutes water, blocks waterways and harms fish and people.'),
      Q('Plants give off water vapour through their leaves. This adds water to…', 'the air', ['the roots', 'the rocks'], 'Water vapour from plants joins the water cycle.'),
      Q('Why do puddles disappear after the rain stops?', 'The water evaporates into the air.', ['The water freezes.', 'The water turns into sand.'], 'The water gains heat and evaporates.'),
    ],
  },
  electricity: {
    hint: 'Electricity flows only around a closed (complete) circuit. Conductors, like metals, let it through; insulators, like plastic and rubber, do not.',
    items: [
      Q('For electricity to flow, a circuit must be…', 'closed (complete)', ['open', 'broken'], 'Electricity needs a complete loop with no gaps.'),
      Q('What does a switch do?', 'It opens or closes the circuit.', ['It makes electricity.', 'It stores electricity.'], 'A closed switch completes the circuit; an open one makes a gap.'),
      Q('What is the source of electricity in a torch?', 'the batteries', ['the bulb', 'the switch'], 'Batteries store chemical energy and give electricity.', '🔦'),
      Q('Why are wires made of copper?', 'Copper is a good conductor of electricity.', ['Copper does not let electricity through.', 'Copper is a kind of plastic.'], 'Copper lets electricity flow easily.'),
      Q('More bulbs are added in one loop (in series) with the same battery. The bulbs…', 'become dimmer', ['become brighter', 'stay the same'], 'In series, the bulbs share the battery\'s energy, so each bulb is dimmer.', '💡'),
      Q('Why should you never touch a switch with wet hands?', 'Water can carry electricity into your body.', ['The switch will rust at once.', 'Water turns off the electricity.'], 'Wet skin lets electricity pass, which can give a dangerous shock.'),
      Q('Which mainly uses electricity to make heat?', 'a rice cooker', ['a fan', 'a radio'], 'A rice cooker changes electrical energy into heat.', '🍚'),
      Q('Why are plugs and switches covered in plastic?', 'Plastic is an electrical insulator.', ['Plastic conducts electricity well.', 'Plastic makes electricity.'], 'The plastic keeps electricity away from our fingers.', '🔌'),
      Q('Two bulbs are in a series circuit. One bulb blows. What happens to the other?', 'It goes out too.', ['It gets brighter.', 'It stays lit.'], 'A blown bulb leaves a gap in the only loop, so no electricity flows.'),
      Q('Two bulbs are on separate branches (in parallel). One bulb blows. What happens to the other?', 'It stays lit.', ['It goes out too.', 'It gets dimmer.'], 'The other branch is still a complete loop.'),
      Q('Which is the best way to save electricity?', 'Switch off lights and fans when you leave a room.', ['Leave the TV on all night.', 'Open the fridge often.'], 'Switching things off when not in use saves electricity and money.'),
    ],
  },
};

const G5_SORTS = {
  dispersal: {
    ask: 'How are its seeds mainly spread?',
    hint: 'Light, winged or fluffy seeds: wind. Fibrous fruits that float: water. Juicy fruits or hooks: animals. Pods that dry and burst: splitting.',
    groups: {
      wind: group('by wind', 'spread by wind', 'it is light, with wings or fluffy hairs that catch the wind', [
        it('narra fruit (with a papery wing)', undefined, 'The papery wing of the narra fruit lets the wind carry it.'),
        it('kapok seeds (with fluffy hairs)', undefined, 'Fluffy hairs let kapok seeds float on the wind.'),
        it('cogon grass seeds (fluffy)', undefined, 'Fluffy hairs let cogon seeds float on the wind.'),
        it('lauan fruit (with wings)', undefined, 'The wings make the lauan fruit spin as the wind carries it.'),
      ]),
      water: group('by water', 'spread by water', 'it has a light, fibrous husk that traps air and floats', [
        it('coconut', '🥥', 'The coconut\'s fibrous husk traps air, so it floats across the sea.'),
        it('talisay fruit (sea almond)', undefined, 'The light, fibrous talisay fruit floats on water.'),
        it('nipa palm fruit', undefined, 'Nipa fruits float along rivers and coasts.'),
        it('mangrove seedling', undefined, 'Mangrove seedlings float on the tide until they lodge in mud.'),
      ]),
      animals: group('by animals', 'spread by animals', 'animals eat the juicy fruit or carry hooked seeds on their fur', [
        it('guava', undefined, 'Animals eat the juicy guava, and the seeds pass out in their droppings far away.'),
        it('papaya', undefined, 'Birds and bats eat papaya and spread its seeds in their droppings.'),
        it('amorseko (love grass) seeds with tiny hooks', undefined, 'Tiny hooks stick to fur and clothes, so animals carry the seeds.'),
        it('siling labuyo (chili)', '🌶️', 'Birds eat the bright red chilies and spread the seeds.'),
      ]),
      splitting: group('by splitting open', 'spread by splitting open', 'its pod dries and bursts, flinging the seeds out', [
        it('rubber tree pods', undefined, 'Rubber tree pods dry out and burst open with a pop, flinging the seeds.'),
        it('kamantigue (balsam) pods', undefined, 'Ripe balsam pods burst open when touched.'),
        it('mung bean (monggo) pods', undefined, 'Dry monggo pods twist and split, throwing out the seeds.'),
        it('okra pods', undefined, 'Dry okra pods split open along their sides.'),
      ]),
    },
  },
  electricConductors: {
    ask: 'Is it a conductor or an insulator of electricity?',
    hint: 'Metals conduct electricity. Plastic, rubber, wood, glass, paper and cloth are insulators.',
    groups: {
      conductor: group('conductor', 'a conductor of electricity', 'electricity can flow through it', [
        it('a copper wire', undefined), it('an iron nail', '🔩'), it('a steel paper clip', '📎'), it('a strip of aluminium foil', undefined), it('a metal key', '🔑'),
        it('pencil lead (graphite)', '✏️', 'Graphite is not a metal, but it conducts electricity.'),
      ]),
      insulator: group('insulator', 'an insulator of electricity', 'electricity cannot flow through it', [
        it('a plastic ruler', '📏'), it('a rubber band', undefined), it('a wooden stick', undefined), it('a glass rod', undefined), it('a strip of paper', '📄'), it('a cotton string', '🧵'),
      ]),
    },
  },
};

/* ------------------------------------------------------------------ */
/* Grade 6: energy, forces, environment, Earth and space               */
/* ------------------------------------------------------------------ */

const G6 = {
  energyForms: {
    hint: 'Kinetic energy: moving things. Potential energy is stored: by height (gravitational), by stretching (elastic) or in food and batteries (chemical). Also light, heat, sound and electrical energy.',
    items: [
      Q('A moving car has … energy.', 'kinetic', ['light', 'sound'], 'Anything that moves has kinetic energy.', '🚗'),
      Q('A book on a high shelf has … energy because of its height.', 'gravitational potential', ['kinetic', 'sound'], 'Raised objects store gravitational potential energy.', '📚'),
      Q('A stretched rubber band has … energy.', 'elastic potential', ['light', 'heat'], 'Stretching or squashing stores elastic potential energy.'),
      Q('Food and batteries store … energy.', 'chemical potential', ['kinetic', 'sound'], 'Food and batteries store chemical potential energy.', '🔋'),
      Q('The Sun gives us light energy and … energy.', 'heat', ['sound', 'elastic'], 'The Sun gives out light and heat.', '☀️'),
      Q('Energy is…', 'the ability to do work or make things change', ['a kind of matter', 'a type of gas'], 'Energy makes things move, heat up, light up or change.'),
      Q('Where do green plants get their energy from?', 'light from the Sun', ['the soil', 'rainwater'], 'Plants trap light energy to make food.', '🌱'),
      Q('Where do animals get their energy from?', 'the food they eat', ['the air only', 'the water they drink'], 'Food stores chemical energy that animals use.'),
      Q('A ball sits at the top of a slide. Where is its potential energy greatest?', 'at the top', ['at the bottom', 'halfway down'], 'The higher it is, the more gravitational potential energy it has.'),
      Q('Energy cannot be made or destroyed. It can only be…', 'changed from one form to another', ['used up forever', 'turned into matter'], 'Energy changes form, for example from chemical to heat.'),
      Q('A ringing bell gives out … energy.', 'sound', ['chemical', 'light'], 'A vibrating bell gives out sound energy.', '🔔'),
    ],
  },
  energyChange: {
    hint: 'Follow the energy from where it is stored to what it becomes: chemical → electrical → light, potential → kinetic, and so on.',
    items: [
      Q('A torch is switched on. The energy changes are…', 'chemical → electrical → light and heat', ['light → chemical → electrical', 'heat → sound → light'], 'The battery\'s chemical energy becomes electrical energy, then light and heat in the bulb.', '🔦'),
      Q('A solar panel changes…', 'light energy into electrical energy', ['electrical energy into light energy', 'heat into sound'], 'Solar panels turn sunlight into electricity.'),
      Q('A ball falls off a table. As it falls…', 'potential energy changes into kinetic energy', ['kinetic energy changes into potential energy', 'sound changes into light'], 'It loses height (potential energy) and speeds up (kinetic energy).'),
      Q('A stretched slingshot is let go. Energy changes from…', 'elastic potential to kinetic', ['kinetic to elastic potential', 'light to chemical'], 'The stored elastic energy makes the stone move.'),
      Q('An electric fan changes electrical energy mainly into…', 'kinetic energy', ['chemical energy', 'light energy'], 'The fan blades move: kinetic energy (with some sound and heat).'),
      Q('A radio changes electrical energy mainly into…', 'sound energy', ['kinetic energy only', 'chemical energy'], 'A radio gives out sound.', '📻'),
      Q('You rub your hands together quickly. Kinetic energy changes into…', 'heat', ['light', 'chemical energy'], 'Friction between your hands changes kinetic energy into heat.'),
      Q('Green plants change light energy into…', 'chemical potential energy in food', ['sound energy', 'elastic energy'], 'Photosynthesis stores light energy as food.'),
      Q('A wind turbine changes…', 'the kinetic energy of wind into electrical energy', ['electrical energy into wind', 'light into sound'], 'Moving air turns the blades, which drive a generator.'),
      Q('When wood burns, chemical energy changes into…', 'heat and light', ['kinetic energy only', 'elastic energy'], 'A fire gives out heat and light.', '🔥'),
      Q('A ball bounces lower each time. Why?', 'Some energy changes into heat and sound at each bounce.', ['Energy is destroyed.', 'The ball gains energy.'], 'Energy is not lost; some changes into heat and sound each time.'),
    ],
  },
  photosynthesis: {
    hint: 'Photosynthesis: light + water + carbon dioxide (with chlorophyll) → food (sugar) + oxygen. It happens mainly in the leaves.',
    items: [
      Q('Plants make their own food by a process called…', 'photosynthesis', ['respiration', 'digestion'], 'Photosynthesis means "making with light".'),
      Q('What does a plant need for photosynthesis?', 'light, water, carbon dioxide and chlorophyll', ['oxygen, soil and darkness', 'sugar, salt and sand'], 'Chlorophyll traps light to turn water and carbon dioxide into food.'),
      Q('Which gas do plants take in for photosynthesis?', 'carbon dioxide', ['oxygen', 'nitrogen'], 'Leaves take in carbon dioxide through their stomata.'),
      Q('Which gas do plants give out during photosynthesis?', 'oxygen', ['carbon dioxide', 'smoke'], 'Photosynthesis gives out oxygen, which animals breathe.'),
      Q('The green substance in leaves that traps light is…', 'chlorophyll', ['nectar', 'pollen'], 'Chlorophyll is found in the chloroplasts.'),
      Q('What food does a plant make?', 'sugar, which can be stored as starch', ['protein from the soil', 'fat from the air'], 'Plants make sugar and store some of it as starch.'),
      Q('Why are most leaves broad and flat?', 'to trap as much light as possible', ['to store water', 'to hold the plant up'], 'A broad surface catches more light for photosynthesis.', '🍃'),
      Q('A plant is kept in the dark for 3 days. What happens to the starch in its leaves?', 'It is used up.', ['It increases.', 'It turns into water.'], 'With no light, the plant cannot make food, so it uses its stored starch.'),
      Q('Why is photosynthesis important to animals?', 'It makes the food and oxygen that animals need.', ['It makes carbon dioxide for animals.', 'It makes rain.'], 'Almost all food chains start with green plants or algae, and they give out oxygen.'),
      Q('Where does photosynthesis mainly take place?', 'in the leaves', ['in the roots', 'in the flowers'], 'Leaves have the most chloroplasts.'),
      Q('Which part of a leaf cell carries out photosynthesis?', 'the chloroplast', ['the nucleus', 'the cell wall'], 'Chloroplasts contain chlorophyll.'),
      Q('A leaf that is part green, part white is tested for starch. Where is starch found?', 'only in the green parts', ['only in the white parts', 'in all parts'], 'Only green parts have chlorophyll, so only they make food.'),
    ],
  },
  forces: {
    hint: 'A force is a push or a pull. Gravity pulls things down, friction acts against motion, springs push or pull back, and magnets attract or repel.',
    items: [
      Q('A force is…', 'a push or a pull', ['a kind of matter', 'a kind of light'], 'Every force is a push or a pull.'),
      Q('What force pulls objects toward the Earth?', 'gravity', ['friction', 'magnetic force'], 'Gravity pulls everything toward the Earth.'),
      Q('What force slows down a ball rolling on grass?', 'friction', ['magnetic force', 'elastic spring force'], 'Friction between the ball and the grass acts against its motion.', '⚽'),
      Q('What force does a stretched spring exert?', 'elastic spring force', ['gravity', 'magnetic force'], 'A stretched or squashed spring pushes or pulls back.'),
      Q('Which is NOT an effect of a force?', "changing an object's colour", ["changing an object's speed", "changing an object's shape", "changing an object's direction"], 'Forces can start, stop, speed up, slow down, turn or change the shape of objects, but not change their colour.'),
      Q('Weight is the pull of … on an object.', 'gravity', ['friction', 'wind'], 'Weight is the force of gravity on an object.'),
      Q('Force is measured in…', 'newtons (N)', ['grams', 'litres'], 'Forces are measured in newtons.'),
      Q('Which tool measures force?', 'a spring balance', ['a thermometer', 'a measuring cylinder'], 'A spring balance stretches more with a bigger force.'),
      Q('Why does a ball thrown upward come back down?', 'Gravity pulls it toward the Earth.', ['Friction pushes it down.', 'The air is heavy.'], 'Gravity slows it down, stops it, then pulls it back.'),
      Q('A magnet pulls a steel paper clip without touching it. This shows that magnetic force…', 'can act at a distance', ['needs contact', 'only works under water'], 'Magnetic force and gravity act without touching.', '🧲'),
      Q('You squeeze a ball of clay and it flattens. The force changed its…', 'shape', ['colour', 'mass'], 'Forces can change the shape of objects.'),
    ],
  },
  friction: {
    hint: 'Friction acts between two surfaces against motion. Rough surfaces give more friction; smooth or oiled surfaces give less. Friction also makes heat.',
    items: [
      Q('Friction is a force that…', 'acts against motion between two surfaces', ['makes things move faster', 'pulls things toward the Earth'], 'Friction acts where two surfaces rub.'),
      Q('Which surface gives the most friction?', 'rough sandpaper', ['smooth ice', 'polished glass'], 'Rough surfaces grip each other more.'),
      Q('Why do shoes have grooves on their soles?', 'to increase friction so we do not slip', ['to decrease friction', 'to make shoes lighter'], 'Grooves grip the ground.', '👟'),
      Q('Why do we oil a bicycle chain?', 'to reduce friction', ['to increase friction', 'to make it rust'], 'Oil lets the moving parts slide easily.', '🚲'),
      Q('You rub your hands together quickly. They feel warm because…', 'friction produces heat', ['the air gets colder', 'your hands make light'], 'Friction changes kinetic energy into heat.'),
      Q('Why do tyres have patterns (treads)?', 'to grip the road', ['to look nice', 'to go faster on ice'], 'Treads increase friction and push water away on wet roads.', '🛞'),
      Q('Which is a useful effect of friction?', 'It helps us walk without slipping.', ['It wears out our shoes.', 'It makes machines hot.'], 'Without friction, we would slip with every step.'),
      Q('Which is an unwanted effect of friction?', 'It wears out the soles of shoes.', ['It helps cars to brake.', 'It lets us hold a pencil.'], 'Rubbing wears surfaces away over time.'),
      Q('A ball is rolled on a carpet and on a tiled floor with the same push. Where does it stop sooner?', 'on the carpet', ['on the tiled floor', 'it stops at the same place on both'], 'The rough carpet gives more friction.'),
      Q('Ball bearings in wheels…', 'reduce friction so the wheels turn easily', ['increase friction', 'stop the wheels from turning'], 'Rolling balls cause less friction than sliding surfaces.'),
      Q('Why do people put sand on a slippery path?', 'to increase friction', ['to reduce friction', 'to make it shiny'], 'Sand makes the surface rougher.'),
    ],
  },
  ecosystem: {
    hint: 'Population: one kind of living thing in a place. Community: all the populations in a place. Habitat: where a living thing lives.',
    items: [
      Q('All the living things of one kind living in one place form a…', 'population', ['community', 'habitat'], 'For example, all the tilapia in a pond are a population.'),
      Q('All the different populations living together in one place form a…', 'community', ['population', 'cell'], 'All the fish, frogs, plants and insects in a pond are a community.'),
      Q('The place where a living thing lives is its…', 'habitat', ['population', 'community'], 'A habitat gives a living thing food, water and shelter.'),
      Q('Green plants are called producers because they…', 'make their own food', ['eat other living things', 'break down dead things'], 'Plants produce food by photosynthesis.'),
      Q('Animals are consumers because they…', 'eat other living things for food', ['make food from light', 'live underwater'], 'Animals cannot make their own food.'),
      Q('Fungi and bacteria that break down dead plants and animals are…', 'decomposers', ['producers', 'predators'], 'Decomposers return nutrients to the soil.', '🍄'),
      Q('Which is a community in a pond?', 'all the fish, frogs, plants and insects in it', ['only the frogs', 'the water and the rocks'], 'A community is all the living things in a place.'),
      Q('An animal that hunts other animals for food is a…', 'predator', ['prey', 'producer'], 'An eagle is a predator of snakes.', '🦅'),
      Q('An animal that is hunted and eaten is called…', 'prey', ['a predator', 'a producer'], 'A mouse is the prey of an owl.'),
      Q('Which is a non-living factor in a habitat?', 'temperature', ['a frog', 'a tree'], 'Temperature, light, water and air are non-living factors.'),
      Q('Why are decomposers important?', 'They return nutrients to the soil.', ['They make food from sunlight.', 'They eat living animals.'], 'Plants use these nutrients to grow.'),
      Q('A coral reef, a forest and a rice field are examples of…', 'habitats', ['populations', 'cells'], 'Each is a place where many living things live.'),
    ],
  },
  adaptations: {
    hint: 'An adaptation is a body part or behaviour that helps a living thing survive in its habitat: to find food, escape danger, keep warm or save water.',
    items: [
      Q("A duck's webbed feet help it to…", 'swim', ['climb trees', 'dig'], 'Webbed feet push against the water like paddles.', '🦆'),
      Q("A tarsier's very large eyes help it to…", 'see at night', ['smell food', 'swim'], 'Tarsiers hunt insects at night. Big eyes let in more light.'),
      Q('A cactus has spines instead of broad leaves. This helps it to…', 'lose less water', ['catch more sunlight', 'attract bees'], 'Spines lose much less water than broad leaves, which matters in a desert.', '🌵'),
      Q('Mangrove trees have roots that stick up out of the mud. These help them to…', 'take in air', ['catch fish', 'make flowers'], 'The mud has little air, so these roots take in air above it.'),
      Q('A leaf insect looks just like a leaf. This helps it to…', 'hide from predators', ['find water', 'keep warm'], 'Looking like its surroundings (camouflage) hides it from birds and other predators.', '🍃'),
      Q('A polar bear has thick fur and a layer of fat to…', 'keep warm in the cold', ['swim faster', 'hide from the Sun'], 'Fur and fat slow down heat loss.'),
      Q('An eagle has sharp claws and a hooked beak to…', 'catch and tear its prey', ['crack seeds', 'drink nectar'], 'Talons grip and the hooked beak tears meat.', '🦅'),
      Q('Some butterflies have big "eye" spots on their wings. These help to…', 'scare away predators', ['see better', 'fly faster'], 'The spots look like the eyes of a bigger animal.', '🦋'),
      Q('A fish has gills to…', 'take in oxygen from water', ['see in the dark', 'float on top'], 'Gills take in oxygen dissolved in water.', '🐟'),
      Q("A sunbird's long, thin beak helps it to…", 'drink nectar from flowers', ['crack hard nuts', 'catch fish'], 'The beak reaches deep inside flowers.'),
      Q('Bats are active at night and rest in the day. This helps them to…', 'find food and avoid some predators', ['grow leaves', 'make chlorophyll'], 'At night they hunt night insects and avoid day-time hunters.', '🦇'),
      Q('A water lily has wide, flat leaves that float. This helps it to…', 'get sunlight on the water', ['sink to the bottom', 'store sand'], 'Floating leaves catch the light above the water.'),
    ],
  },
  humanImpact: {
    hint: 'People can harm the environment (cutting forests, pollution, too much waste) or protect it (planting trees, the 3Rs, saving energy).',
    items: [
      Q('Cutting down large areas of forest is called…', 'deforestation', ['pollination', 'evaporation'], 'Deforestation destroys habitats and can cause floods and landslides.', '🪓'),
      Q('Which helps reduce waste?', 'reusing bottles and bags', ['throwing everything away', 'burning plastic'], 'Reusing things means less rubbish.'),
      Q('What do the 3Rs stand for?', 'reduce, reuse, recycle', ['run, rest, read', 'rain, river, rock'], 'Reduce what you use, reuse what you can, and recycle the rest.', '♻️'),
      Q('Why is burning plastic harmful?', 'It releases harmful gases into the air.', ['It makes the air cleaner.', 'It makes plastic grow back.'], 'Burning plastic gives off smoke and poisons.'),
      Q('Planting mangroves along the coast helps to…', 'protect the shore from strong waves', ['make the sea salty', 'stop the rain'], 'Mangrove roots slow down waves and storm surges.'),
      Q('What happens to animals when their forest is cut down?', 'They lose their homes and food.', ['They get more food.', 'Nothing happens.'], 'Without their habitat, many animals cannot survive.'),
      Q('Why is fishing with dynamite harmful?', 'It destroys coral reefs and kills young fish.', ['It makes more fish.', 'It cleans the sea.'], 'Blasts kill everything nearby and wreck the reef habitat.'),
      Q('Which reduces air pollution?', 'walking, cycling or sharing rides', ['burning more rubbish', 'leaving car engines running'], 'Fewer engines running means less smoke.'),
      Q('Too much carbon dioxide in the air traps heat. This leads to…', 'global warming', ['an ice age', 'colder oceans'], 'Trapped heat warms the Earth and changes the climate.', '🌡️'),
      Q('Why should we sort our rubbish?', 'so it can be recycled or composted', ['to make it smell', 'so it is heavier'], 'Sorted rubbish can be recycled or turned into compost.'),
      Q('Composting food scraps turns them into…', 'fertiliser for plants', ['plastic', 'glass'], 'Decomposers break the scraps down into rich soil.'),
    ],
  },
  solarSystem: {
    hint: 'The Sun is at the centre. Eight planets orbit it: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune.',
    items: [
      Q('What is at the centre of the Solar System?', 'the Sun', ['the Earth', 'the Moon'], 'All the planets orbit the Sun.', '☀️'),
      Q('How many planets are in the Solar System?', 'eight', ['nine', 'seven'], 'There are eight planets. Pluto is now called a dwarf planet.', '🪐'),
      Q('Which planet is closest to the Sun?', 'Mercury', ['Venus', 'Earth'], 'Mercury is the closest planet to the Sun.'),
      Q('Which is the largest planet?', 'Jupiter', ['Saturn', 'Earth'], 'Jupiter is the biggest planet, more than 11 times as wide as Earth.'),
      Q('Which planet is famous for its large, bright rings?', 'Saturn', ['Mars', 'Venus'], 'Saturn\'s rings are made of ice and rock.', '🪐'),
      Q('Which planet is called the Red Planet?', 'Mars', ['Jupiter', 'Neptune'], 'Rusty dust makes Mars look red.'),
      Q('Earth is the … planet from the Sun.', 'third', ['first', 'fifth'], 'Mercury, Venus, then Earth.', '🌍'),
      Q('Why can Earth support life?', 'It has liquid water, air and the right temperature.', ['It is the biggest planet.', 'It has rings.'], 'Water, air and a mild temperature let living things survive.'),
      Q('The Moon is Earth\'s…', 'natural satellite', ['planet', 'star'], 'The Moon orbits the Earth.', '🌙'),
      Q('Planets move around the Sun in paths called…', 'orbits', ['craters', 'comets'], 'Each planet travels in its own orbit.'),
      Q('Which planet is the hottest?', 'Venus', ['Mercury', 'Mars'], 'Venus is hotter than Mercury because its thick air traps heat.'),
      Q('Which planet is farthest from the Sun?', 'Neptune', ['Jupiter', 'Mars'], 'Neptune is the eighth and farthest planet.'),
    ],
  },
  earthMoon: {
    hint: 'Earth rotates on its axis once a day (day and night) and revolves around the Sun once a year. The Moon orbits Earth about once a month.',
    items: [
      Q('The Earth spins once on its axis every…', '24 hours', ['7 days', '365 days'], 'One spin of the Earth is one day.', '🌍'),
      Q('The Earth goes around the Sun once every…', 'year (about 365 days)', ['24 hours', 'month (about 30 days)'], 'One trip around the Sun is one year.'),
      Q('Day and night happen because…', 'the Earth rotates on its axis', ['the Sun goes around the Earth', 'the Moon blocks the Sun'], 'The side of the Earth facing the Sun has day.'),
      Q('The Moon goes around the Earth about once every…', 'month', ['day', 'year'], 'The Moon takes about a month to orbit the Earth.', '🌙'),
      Q('Why does the Moon seem to change shape?', 'We see different amounts of its sunlit half as it orbits Earth.', ["Clouds cover parts of it.", "The Earth's shadow covers part of it every night."], 'Half the Moon is always lit by the Sun. As it orbits, we see more or less of that half.'),
      Q('A solar eclipse happens when…', 'the Moon passes between the Sun and the Earth', ['the Earth passes between the Sun and the Moon', 'the Sun passes behind the Earth'], 'The Moon blocks the Sun\'s light from part of the Earth.'),
      Q('A lunar eclipse happens when…', "the Earth's shadow falls on the Moon", ['the Moon blocks the Sun', 'clouds hide the Moon'], 'The Earth is between the Sun and the Moon.'),
      Q('When we see the whole lit face of the Moon, it is called a…', 'full moon', ['new moon', 'crescent moon'], 'At full moon, we see all of the Moon\'s sunlit half.', '🌕'),
      Q('Why does the Sun seem to move across the sky?', 'Because the Earth rotates.', ['Because the Sun goes around the Earth every day.', 'Because clouds move it.'], 'The Earth turns from west to east, so the Sun seems to rise in the east.'),
      Q('Which is the right order from smallest to biggest?', 'Moon, Earth, Sun', ['Earth, Moon, Sun', 'Sun, Earth, Moon'], 'The Moon is smaller than the Earth, and the Sun is far bigger than both.'),
      Q('It is noon in the Philippines. On the side of Earth facing away from the Sun, it is…', 'night', ['also noon', 'early afternoon'], 'The side facing away from the Sun is in darkness.'),
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Sequences                                                           */
/* ------------------------------------------------------------------ */

export const SEQUENCES = {
  waterCycle: {
    name: 'the water cycle', pic: '💧', cycle: true,
    steps: ['the Sun heats water in seas and rivers', 'the water evaporates', 'water vapour rises and cools', 'it condenses into clouds', 'rain falls back to the Earth'],
    loop: 'The rain flows back to seas and rivers, and the cycle starts again.',
    hint: 'Heat makes water evaporate; cooling makes it condense; then it falls as rain.',
  },
  airPath: {
    name: 'the path of air into the body', pic: '🫁', cycle: false,
    steps: ['nose', 'windpipe', 'lungs', 'air sacs', 'blood'],
    hint: 'Air goes in through the nose, down the windpipe into the lungs, then oxygen passes from the air sacs into the blood.',
  },
  bloodPath: {
    name: 'the path of blood around the body', pic: '❤️', cycle: true,
    steps: ['the heart', 'arteries', 'capillaries', 'veins'],
    loop: 'The veins bring the blood back to the heart, which pumps it out again.',
    hint: 'The heart pumps blood into arteries; capillaries reach the cells; veins bring blood back.',
  },
  plantWater: {
    name: 'the path of water through a plant', pic: '🌱', cycle: false,
    steps: ['soil', 'roots', 'stem', 'leaves', 'air (as water vapour)'],
    hint: 'Water goes from the soil into the roots, up the stem to the leaves, then out into the air.',
  },
  flowerToFruit: {
    name: 'the steps from flower to fruit', pic: '🌸', cycle: false,
    steps: ['pollen is made in the anther', 'pollination', 'fertilisation', 'the ovary grows into a fruit'],
    hint: 'Pollen must reach the stigma (pollination) before the egg can be fertilised.',
  },
};

/* ------------------------------------------------------------------ */
/* Food chains (producer first; [singular, plural])                    */
/* ------------------------------------------------------------------ */

export const FOOD_CHAINS = [
  [['grass', 'grass plants'], ['grasshopper', 'grasshoppers'], ['frog', 'frogs'], ['snake', 'snakes'], ['eagle', 'eagles']],
  [['rice plant', 'rice plants'], ['rat', 'rats'], ['snake', 'snakes'], ['hawk', 'hawks']],
  [['algae', 'algae'], ['shrimp', 'shrimps'], ['small fish', 'small fish'], ['kingfisher', 'kingfishers']],
  [['mango leaves', 'mango leaves'], ['caterpillar', 'caterpillars'], ['sparrow', 'sparrows'], ['cat', 'cats']],
  [['corn plant', 'corn plants'], ['mouse', 'mice'], ['owl', 'owls']],
  [['guava fruits', 'guava fruits'], ['fruit bat', 'fruit bats'], ['python', 'pythons']],
  [['pechay', 'pechay plants'], ['snail', 'snails'], ['duck', 'ducks']],
  [['tiny plant-like plankton (algae)', 'plankton algae'], ['tiny shrimp-like animals', 'tiny shrimp-like animals'], ['sardine', 'sardines'], ['tuna', 'tuna']],
];

/* ------------------------------------------------------------------ */
/* Experiments (fair tests). Results rise (dir 1) or fall (dir -1).    */
/* ------------------------------------------------------------------ */

const unitLabel = (unit, one, many) => (x) => `${x} ${x === 1 ? one : many}`;

export const EXPERIMENTS = [
  {
    id: 'plantLight',
    result: "the plants' height",
    title: 'Plants and light',
    setup: (n) => `${n} grew 4 bean plants of the same kind in the same soil. Each plant got a different number of hours of light a day. After 2 weeks, ${n} measured how tall each plant was.`,
    changed: 'the number of hours of light', measured: 'the height of each plant',
    same: ['the kind of plant', 'the amount of water', 'the size of the pot'],
    head: ['Hours of light a day', 'Height after 2 weeks (cm)'],
    xs: [2, 4, 6, 8], xLabel: unitLabel('h', 'hour', 'hours'), yUnit: ' cm',
    y: { start: [3, 6], step: [2, 5], dir: 1 },
    choiceOf: (l) => `the plant with ${l} of light`,
    best: { q: 'Which plant grew the tallest?', pick: 'max', why: (v) => `The tallest plant was ${v} cm.` },
    worst: { q: 'Which plant grew the least?', pick: 'min', why: (v) => `The shortest plant was ${v} cm.` },
    conclude: 'The more hours of light a plant gets, the taller it grows.',
    notConclude: ['The fewer hours of light a plant gets, the taller it grows.', 'Light does not change how tall a plant grows.'],
  },
  {
    id: 'sugarDissolve',
    result: "the time to dissolve",
    title: 'Dissolving sugar',
    setup: (n) => `${n} stirred 1 spoon of sugar into each of 4 cups of water at different temperatures. ${n} timed how long the sugar took to dissolve.`,
    changed: 'the temperature of the water', measured: 'the time the sugar took to dissolve',
    same: ['the amount of sugar', 'the amount of water', 'how fast the water was stirred'],
    head: ['Water temperature (°C)', 'Time to dissolve (s)'],
    xs: [20, 40, 60, 80], xLabel: (x) => `${x}\u00a0°C`, yUnit: ' s',
    y: { start: [150, 190], step: [20, 35], dir: -1 },
    choiceOf: (l) => `the water at ${l}`,
    best: { q: 'In which cup did the sugar dissolve fastest?', pick: 'min', why: (v) => `The shortest time was ${v} s.` },
    worst: { q: 'In which cup did the sugar dissolve slowest?', pick: 'max', why: (v) => `The longest time was ${v} s.` },
    conclude: 'The hotter the water, the faster the sugar dissolves.',
    notConclude: ['The hotter the water, the slower the sugar dissolves.', 'The temperature of the water does not change how fast sugar dissolves.'],
  },
  {
    id: 'ramp',
    result: "the distance rolled",
    title: 'Toy car on a ramp',
    setup: (n) => `${n} let a toy car roll down a ramp set at 4 different heights. Each time, ${n} measured how far the car rolled along the floor.`,
    changed: 'the height of the ramp', measured: 'how far the car rolled',
    same: ['the toy car', 'the kind of floor', 'the length of the ramp'],
    head: ['Height of ramp (cm)', 'Distance rolled (cm)'],
    xs: [10, 20, 30, 40], xLabel: (x) => `${x} cm`, yUnit: ' cm',
    y: { start: [50, 80], step: [25, 45], dir: 1 },
    choiceOf: (l) => `the ramp at ${l}`,
    best: { q: 'From which height did the car roll the farthest?', pick: 'max', why: (v) => `The longest distance was ${v} cm.` },
    worst: { q: 'From which height did the car roll the shortest distance?', pick: 'min', why: (v) => `The shortest distance was ${v} cm.` },
    conclude: 'The higher the ramp, the farther the car rolls.',
    notConclude: ['The higher the ramp, the shorter the distance the car rolls.', 'The height of the ramp does not change how far the car rolls.'],
  },
  {
    id: 'electromagnet',
    result: "the number of paper clips picked up",
    title: 'Making an electromagnet',
    setup: (n) => `${n} wound a wire around an iron nail and joined it to a battery. ${n} tried 4 different numbers of coils and counted how many paper clips the nail picked up.`,
    changed: 'the number of coils of wire', measured: 'the number of paper clips picked up',
    same: ['the iron nail', 'the battery', 'the size of the paper clips'],
    head: ['Number of coils', 'Paper clips picked up'],
    xs: [10, 20, 30, 40], xLabel: unitLabel('', 'coil', 'coils'), yUnit: ' clips',
    y: { start: [2, 4], step: [2, 4], dir: 1 },
    choiceOf: (l) => `${l} of wire`,
    best: { q: 'Which electromagnet was the strongest?', pick: 'max', why: (v) => `The strongest one picked up ${v} paper clips.` },
    worst: { q: 'Which electromagnet was the weakest?', pick: 'min', why: (v) => `The weakest one picked up only ${v} paper clips.` },
    conclude: 'The more coils of wire, the stronger the electromagnet.',
    notConclude: ['The more coils of wire, the weaker the electromagnet.', 'The number of coils does not change how strong the electromagnet is.'],
  },
  {
    id: 'clothLayers',
    result: "the water temperature",
    title: 'Keeping water warm',
    setup: (n) => `${n} poured the same amount of hot water into 4 cups, then wrapped each cup in a different number of layers of cloth. After 30 minutes, ${n} measured the temperature of the water.`,
    changed: 'the number of layers of cloth', measured: 'the temperature of the water after 30 minutes',
    same: ['the starting temperature of the water', 'the amount of water', 'the kind of cloth'],
    head: ['Layers of cloth', 'Temperature after 30 min (°C)'],
    xs: [1, 2, 3, 4], xLabel: unitLabel('', 'layer', 'layers'), yUnit: ' °C',
    y: { start: [38, 46], step: [3, 6], dir: 1 },
    noPredict: true, // "1.5 layers of cloth" makes no sense
    choiceOf: (l) => `the cup with ${l}`,
    best: { q: 'Which cup kept the water warmest?', pick: 'max', why: (v) => `The warmest water was ${v}\u00a0°C.` },
    worst: { q: 'Which cup lost the most heat?', pick: 'min', why: (v) => `The coolest water was ${v}\u00a0°C, so it lost the most heat.` },
    conclude: 'The more layers of cloth, the warmer the water stays.',
    notConclude: ['The more layers of cloth, the faster the water cools.', 'The number of layers does not change how warm the water stays.'],
  },
  {
    id: 'dishWidth',
    result: "the amount of water left",
    title: 'Water in open dishes',
    setup: (n) => `${n} poured 100 ml of water into each of 4 dishes of different widths and left them side by side in the sun. After 2 days, ${n} measured how much water was left.`,
    changed: 'the width of the dish', measured: 'the amount of water left',
    same: ['the amount of water at the start', 'the place where the dishes were left', 'the number of days'],
    head: ['Width of dish (cm)', 'Water left after 2 days (ml)'],
    xs: [5, 10, 15, 20], xLabel: (x) => `${x} cm`, yUnit: ' ml',
    y: { start: [82, 90], step: [10, 16], dir: -1 },
    choiceOf: (l) => `the dish ${l} wide`,
    best: { q: 'From which dish did the most water evaporate?', pick: 'min', why: (v) => `It had the least water left, ${v} ml, so the most water evaporated from it.` },
    worst: { q: 'Which dish had the most water left?', pick: 'max', why: (v) => `The most water left was ${v} ml.` },
    conclude: 'The wider the dish, the faster the water evaporates.',
    notConclude: ['The wider the dish, the slower the water evaporates.', 'The width of the dish does not change how fast water evaporates.'],
  },
  {
    id: 'ballDrop',
    result: "the bounce height",
    title: 'Bouncing balls',
    setup: (n) => `${n} dropped the same ball from 4 different heights onto the same floor and measured how high it bounced each time.`,
    changed: 'the height the ball was dropped from', measured: 'how high the ball bounced',
    same: ['the ball', 'the floor', 'how the ball was let go'],
    head: ['Drop height (cm)', 'Bounce height (cm)'],
    xs: [50, 100, 150, 200], xLabel: (x) => `${x} cm`, yUnit: ' cm',
    y: { start: [22, 32], step: [15, 25], dir: 1 },
    choiceOf: (l) => `dropped from ${l}`,
    best: { q: 'From which height did the ball bounce the highest?', pick: 'max', why: (v) => `The highest bounce was ${v} cm.` },
    worst: { q: 'From which height did the ball bounce the lowest?', pick: 'min', why: (v) => `The lowest bounce was ${v} cm.` },
    conclude: 'The higher the ball is dropped from, the higher it bounces.',
    notConclude: ['The higher the ball is dropped from, the lower it bounces.', 'The drop height does not change how high the ball bounces.'],
  },
];

export const QUIZ = { ...G4, ...G5, ...G6 };
export const SORTS = { ...G4_SORTS, ...G5_SORTS };
