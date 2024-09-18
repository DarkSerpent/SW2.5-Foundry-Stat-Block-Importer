const fs = require('fs');
const readline = require('readline');
const fetch = require('node-fetch');
const path = require('path');
const he = require('he');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptForAPILink() {
  return new Promise((resolve, reject) => {
    rl.question('Enter the API link for the monster stat block or type the name of a monster and find the closest match: ', (answer) => {
      resolve(answer);
    });
  });
}

async function fetchMonsterData(apiLink) {
  let finalApiLink = apiLink;
  if (!apiLink.includes("sw25.nerdsunited.com")) {
    const searchResponse = await fetch(`https://sw25.nerdsunited.com/api/v1/monster/list?name=${encodeURIComponent(apiLink)}`);
    if (!searchResponse.ok) {
      console.error('Failed to search for monster name');
      process.exit(1);
    }
    const searchData = await searchResponse.json();
    if (searchData.monsters.length === 0) {
      console.error('No monsters found with that name');
      process.exit(1);
    } else if (searchData.monsters.length > 1) {
      console.log('Multiple monsters found with that name:');
      searchData.monsters.forEach((monster, index) => {
        console.log(`${index + 1}. ${monster.monstername}`);
      });
      const selectedMonsterIndex = await promptForMonsterSelection(searchData.monsters.length);
      const selectedMonsterId = searchData.monsters[selectedMonsterIndex - 1].monster_id;
      finalApiLink = `https://sw25.nerdsunited.com/api/v1/monster/get/${selectedMonsterId}`;
    } else {
      const monsterId = searchData.monsters[0].monster_id;
      finalApiLink = `https://sw25.nerdsunited.com/api/v1/monster/get/${monsterId}`;
    }
  }

  const response = await fetch(finalApiLink);
  if (!response.ok) {
    console.error('Failed to fetch data from the API');
    process.exit(1);
  }
  const data = await response.json();
  return data.monster;
}

function promptForMonsterSelection(maxSelection) {
  return new Promise((resolve, reject) => {
    rl.question(`Select a monster by typing the corresponding number (1-${maxSelection}): `, (answer) => {
      const selection = parseInt(answer);
      if (isNaN(selection) || selection < 1 || selection > maxSelection) {
        console.log('Invalid selection. Please select a number within the range.');
        promptForMonsterSelection(maxSelection).then(resolve);
      } else {
        resolve(selection);
      }
    });
  });
}

function convertData(inputData) {
  const monster = inputData;
  let lootEntries = {};
  let sectionStatus = {};
  let sectionSkills = {};

  monster.loottable.forEach((entry, index) => {
    const lootKey = `loots${index + 1}`;
    const rollRange = entry.roll.replace(/ - /g, '～');
    lootEntries[`${lootKey}Num`] = rollRange;
    lootEntries[`${lootKey}Item`] = entry.loot;
  });

  let statusEntries = {};
  let sectionCount = 0;

  monster.combatstyles.forEach((style, index) => {
    sectionCount++;
    statusEntries[`status${sectionCount}Accuracy`] = style.accuracy;
    statusEntries[`status${sectionCount}AccuracyFix`] = parseInt(style.accuracy) + 7;
    statusEntries[`status${sectionCount}Damage`] = style.damage;
    statusEntries[`status${sectionCount}Defense`] = style.defense;
    statusEntries[`status${sectionCount}Evasion`] = style.evasion;
    statusEntries[`status${sectionCount}EvasionFix`] = parseInt(style.evasion) + 7;
    statusEntries[`status${sectionCount}Hp`] = style.hp;
    statusEntries[`status${sectionCount}Mp`] = style.mp;
    statusEntries[`status${sectionCount}Style`] = style.style;
  });

  const formattedSkills = monster.uniqueskills.map(skill => {
    return skill.abilities.map(ability => {
      const title = he.decode(ability.title).trim();
      const description = he.decode(ability.description).trim().replace(/<\/?p>/g, '');
      return `<p><strong>${title}</strong></p><p>${description}</p>`;
    }).join('');
  }).join('<br><br>');

  const outputData = {
    description: monster.description,
    disposition: monster.disposition,
    habitat: monster.habitat,
    initiative: monster.initiative,
    intellect: monster.intelligence,
    language: monster.language,
    lootsNum: monster.loottable.length,
    monsterName: monster.monstername,
    mndResist: monster.willpower,
    vitResist: monster.fortitude,
    lv: monster.level,
    mobility: monster.movementspeed,
    mode: "save",
    paletteInsertType: "exchange",
    paletteRemoveTags: "1",
    paletteTool: "bcdice",
    paletteUseBuff: "1",
    paletteUseVar: "1",
    partsNum: sectionCount,
    perception: monster.perception,
    reputation: monster.reputation,
    "reputation+": monster.weakness,
    weakness: monster.weakpoint,
    result: "OK",
    sheetDescriptionM: `分類:${monster.monstertype}　知能:${monster.intelligence}　知覚:${monster.perception}　反応:${monster.disposition}\n言語:${monster.language}　生息地:${monster.habitat}\n弱点:${monster.weakpoint}\n先制値:${monster.initiative}　生命抵抗力:${monster.fortitude}（${parseInt(monster.fortitude) + 7}）　精神抵抗力:${monster.willpower}（${parseInt(monster.willpower) + 7}）`,
    sheetDescriptionS: `分類:${monster.monstertype}\n弱点:${monster.weakpoint}\n先制値:${monster.initiative}　生命抵抗力:${monster.fortitude}（${parseInt(monster.fortitude) + 7}）　精神抵抗力:${monster.willpower}（${parseInt(monster.willpower) + 7}）`,
    sin: monster.soulscars,
    skills: formattedSkills,
    ...statusEntries,
    statusNum: sectionCount,
    taxa: monster.monstertype,
    type: "m",
    unitStatus: monster.combatstyles.map(style => ({
      [`${style.style}:HP`]: `${style.hp}/${style.hp}`,
      [`${style.style}:MP`]: style.mp
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    unitExceptStatus: {
      "HP": sectionCount,
      "MP": sectionCount,
      "Defense": sectionCount
    },
    ...lootEntries,
    fortitude: monster.fortitude,
    willpower: monster.willpower
  };

  return outputData;
}

async function main() {
  try {
    const apiLink = await promptForAPILink();
    const monsterData = await fetchMonsterData(apiLink);
    const convertedData = convertData(monsterData);

    const outputDir = path.join(__dirname, 'monsters');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputFilePath = path.join(outputDir, `${monsterData.monstername}.json`);

    fs.writeFileSync(outputFilePath, JSON.stringify(convertedData, null, 2), 'utf8');
    console.log(`Data has been written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main();
