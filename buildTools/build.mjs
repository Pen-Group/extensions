import * as fs from "fs";

export function build(path) {
    path += `src/`;
    
    if (fs.existsSync(`${path}buildInfo.json`)) {
        console.log(`\x1b[32mBuild info exists for "${path}"`);

        const buildInfo = JSON.parse(fs.readFileSync(`${path}buildInfo.json`));

        let result = String(fs.readFileSync("buildTools/header.js"));

        //Remove the //END area
        result = result.replace(/\/\/END.*/s, "");

        //Replace info
        result = result.replace("[NAME]", buildInfo.Name)
        .replace("[ID]", buildInfo.ID)
        .replace("[DESCRIPTION]", buildInfo.Description)
        .replace("[AUTHOR]", buildInfo.Author)
        .replace("[URL]", buildInfo.AuthorURL)
        .replace("[LICENSE]", buildInfo.License)
        .replace("\"BUILD_DATE\"", Date.now());

        //If we have a header, parse and add it. otherwise remove it.
        if (buildInfo.Header) {
            const headerUnparsed = String(fs.readFileSync(`${path}${buildInfo.Header}`)).split("\n");
            let headerParsed = "\n";
            for (let line in headerUnparsed) {
                headerParsed += `// ${headerUnparsed[line]}\n`;
            }

            result = result.replace("[HEADER]", headerParsed);
        }
        else result = result.replace("[HEADER]", "");

        //Parse files
        for (let fileID in buildInfo.Files) {
            const file = buildInfo.Files[fileID];
            console.log(`\x1b[32mBuilding file \x1b[31m${fileID} \x1b[0m: \x1b[36m"${file}"`);

            //Add the seperator
            result += `\n    //===---=== ${file} ===---===\\\\\n`;

            //Make the file look nice
            const fileContents = String(fs.readFileSync(`${path}${file}`)).split("\n");
            for (let line in fileContents) {
                result += `\n    ${fileContents[line]}`;
            }
            result += "\n";
        }

        //Add the footer
        result += String(fs.readFileSync("buildTools/footer.js")).replace(/.*\/\/START/s, "");

        return result;
    }
    else console.log(`\x1b[31mBuild info does not exist for "${path}"`);
    
    return "(function() {})();";
}