# SW2.5 Foundry Stat Block Importer for Jean's SW2.5 System
> Imports monster stat blocks from sw25.nerdsunited.com to Jean's Sword World 2.5 Foundry VTT System

## Required Foundry VTT Modules
None!

## How to Set-Up
Navigate to the directory of the Stat Block Importer using Git:
```
cd "YOUR DIRECTORY HERE"
```

Run the following commands with [npm](https://www.npmjs.com/):

```sh
$ npm install fs
```

```sh
$ npm install readline
```

```sh
$ npm install node-fetch@2
```

```sh
$ npm install he
```

Run the script using [Node.js](https://nodejs.org/en/download)

```sh
$ node importStatBlocks.js
```

When prompted, enter a link to a specific stat block on sw25.nerdsunited.com or type the name of any monster (i.e "Wolf"). If performing the latter, the script will use the `?list` function of the API to search for a specific monster stat block.

Once the JSON file has been exported to the `monsters` folder, you can then import and run `jeansTranslatedImport`. See the guide for [Importing Macros](https://foundryvtt.com/article/macros/#:~:text=You%20can%20also%20export%20individual,the%20%22Import%20Data%22%20option.). Select "Choose File" and navigate to your exported JSON. Your monster should now be imported.

## Known Limitations
* Multi-section monsters will import as separate stat blocks, one for each body part. This is a limitation of Jean's system, and cannot be fixed by me. If you wish to have multiple HP and MP bars for a single token, I recommend using [Bar Brawl](https://foundryvtt.com/packages/barbrawl).
* Fortitude and Willpower saves do not correctly add themselves to the sheet. I am working on fixing this.
