const SOURCE_PREFIX = "https://raw.githubusercontent.com/conlacda/atcoder-testcase/main";
const SMALL_FILE_SIZE = 100 * 1024; // bytes

class Testcase {
    constructor(name, inputsize, outputsize) {
        this.name = name;
        this.inputsize = inputsize;
        this.outputsize = outputsize;
    }

    get printOutInputName() {
        const [_, testname, num] = this.name.split('.')[0].split('_');
        return `${testname.charAt(0).toUpperCase() + testname.slice(1)} Input ${parseInt(num)}`;
    }

    get printOutOutputName() {
        const [_, testname, num] = this.name.split('.')[0].split('_');
        return `${testname.charAt(0).toUpperCase() + testname.slice(1)} Output ${parseInt(num)}`;
    }
}

async function fetchListOfTestcases() {
    let res = [];
    const listUrl = `${SOURCE_PREFIX}/${contest}/${problem}/list.txt`;
    return await fetch(listUrl).then(async response => {
        const content = await response.text();
        const lines = content.split('\n');
        for (let i=0;i<lines.length - 1;i++) {
            const [name, inputsize, outputsize] = lines[i].split(',');
            res.push(new Testcase(name, inputsize, outputsize));
        }     
        return res;   
    });
}

async function fetchTestcases(contest, problem) {
    let testcases = await fetchListOfTestcases();
    // Keep only small testcases
    testcases = testcases.filter((tc) => tc.inputsize <= SMALL_FILE_SIZE && tc.outputsize <= SMALL_FILE_SIZE);
    await Promise.all(testcases.map(async tc => {
        const input = await fetch(`${SOURCE_PREFIX}/${contest}/${problem}/in/${tc.name}`)
        tc.input = await input.text();
        const output = await fetch(`${SOURCE_PREFIX}/${contest}/${problem}/out/${tc.name}`)
        tc.output = await output.text();
    }));
    return testcases;
}
